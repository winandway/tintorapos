import { z } from "zod";
import { diccionario, fmt } from "@/lib/i18n";
import type { Idioma } from "@/lib/i18n/idiomas";
import type { Variables } from "@/env";
import type { Sesion } from "@/server/auth/sesiones";
import { encolarAvisos, procesarCola } from "@/server/avisos";
import { ErrorApp } from "@/server/errores";
import { entregarOrden, esquemaEntrega } from "@/server/ordenes/acciones";
import { crearOrden, esquemaNuevaOrden } from "@/server/ordenes/crear";
import { cambiarEstado, esquemaCambioEstado } from "@/server/ordenes/estados";
import { esquemaPago, registrarPago } from "@/server/pagos";
import { tienePermiso, type Permiso } from "@/server/permisos";

export const esquemaSync = z.object({
  ops: z
    .array(
      z.object({
        id: z.uuid(),
        tipo: z.enum(["crear_orden", "estado", "pago", "entregar"]),
        ordenId: z.string().min(1).max(64).optional(),
        cuerpo: z.unknown(),
        creadoEn: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(25),
});

export type OperacionSync = z.infer<typeof esquemaSync>["ops"][number];

export type ResultadoOp =
  | { id: string; ok: true; datos: unknown }
  | { id: string; ok: false; codigo: string; mensaje: string; permanente: true };

const PERMISO: Record<OperacionSync["tipo"], Permiso> = {
  crear_orden: "ordenes.crear",
  estado: "ordenes.cambiar_estado",
  pago: "pagos.cobrar",
  entregar: "ordenes.entregar",
};

const SIETE_DIAS = 7 * 86_400_000;

/** La hora de la operación: la del dispositivo si es creíble (últimos 7 días, no en el futuro). */
export function horaOperacion(creadoEn: number, ahora: number): number {
  return creadoEn <= ahora + 5 * 60_000 && creadoEn >= ahora - SIETE_DIAS ? Math.min(creadoEn, ahora) : ahora;
}

/**
 * Aplica, en orden, lo que el dispositivo hizo sin conexión. Cada operación se
 * guarda con su resultado: reintentar devuelve lo mismo sin repetir nada.
 * Si algo falla de forma inesperada se detiene ahí (lo siguiente puede depender de eso).
 */
export async function sincronizar(
  env: CloudflareEnv,
  vars: Variables,
  s: Sesion,
  idioma: Idioma,
  ops: OperacionSync[],
  esperarLuego: (p: Promise<unknown>) => void,
  ahora = Date.now(),
): Promise<{ resultados: ResultadoOp[]; detenido: boolean }> {
  const db = env.DB;
  const resultados: ResultadoOp[] = [];
  const avisos: string[] = [];
  for (const op of ops) {
    const previo = await db
      .prepare("select resultado from operaciones_sync where tintoreria_id = ? and id = ?")
      .bind(s.tintoreria.id, op.id)
      .first<{ resultado: string }>();
    if (previo) {
      resultados.push(JSON.parse(previo.resultado) as ResultadoOp);
      continue;
    }
    const hora = horaOperacion(op.creadoEn, ahora);
    let resultado: ResultadoOp;
    try {
      if (!tienePermiso(s.usuario.rol, PERMISO[op.tipo])) throw new ErrorApp(403, "sin_permiso");
      let datos: unknown;
      switch (op.tipo) {
        case "crear_orden": {
          const d = esquemaNuevaOrden.parse(op.cuerpo);
          const r = await crearOrden(db, s, d, hora, "sin_conexion");
          if (!r.repetida)
            avisos.push(
              ...(await encolarAvisos(
                db,
                vars.APP_URL,
                { tintoreriaId: s.tintoreria.id, ordenId: r.id, tipo: "recibida" },
                ahora,
              )),
            );
          datos = r;
          break;
        }
        case "estado": {
          const r = await cambiarEstado(db, s, op.ordenId ?? "", esquemaCambioEstado.parse(op.cuerpo), hora);
          if (r.quedoLista)
            avisos.push(
              ...(await encolarAvisos(
                db,
                vars.APP_URL,
                { tintoreriaId: s.tintoreria.id, ordenId: op.ordenId ?? "", tipo: "lista" },
                ahora,
              )),
            );
          datos = r;
          break;
        }
        case "pago":
          datos = await registrarPago(
            db,
            s,
            op.ordenId ?? "",
            esquemaPago.parse(op.cuerpo),
            hora,
            "sin_conexion",
          );
          break;
        case "entregar":
          try {
            await entregarOrden(
              db,
              s,
              op.ordenId ?? "",
              esquemaEntrega.parse(op.cuerpo),
              hora,
              "sin_conexion",
            );
          } catch (e) {
            // Si ya quedó entregada (reintento tras un corte), no es un error.
            if (!(e instanceof ErrorApp && e.codigo === "orden_cerrada")) throw e;
          }
          datos = { ok: true };
          break;
      }
      resultado = { id: op.id, ok: true, datos };
    } catch (e) {
      if (e instanceof ErrorApp || e instanceof z.ZodError) {
        const codigo = e instanceof ErrorApp ? e.codigo : "datos_invalidos";
        const d = diccionario(idioma);
        const plantilla = (d.errores as Record<string, string>)[codigo] ?? d.errores.inesperado;
        resultado = {
          id: op.id,
          ok: false,
          codigo,
          mensaje: fmt(plantilla, e instanceof ErrorApp ? e.vars : {}),
          permanente: true,
        };
      } else {
        console.error("Sincronización detenida:", e);
        if (avisos.length) esperarLuego(procesarCola(env, vars, { ids: avisos }));
        return { resultados, detenido: true };
      }
    }
    await db
      .prepare(
        "insert into operaciones_sync (id, tintoreria_id, dispositivo_id, tipo, resultado, creado_en) values (?, ?, ?, ?, ?, ?)",
      )
      .bind(op.id, s.tintoreria.id, s.dispositivoId, op.tipo, JSON.stringify(resultado), ahora)
      .run();
    resultados.push(resultado);
  }
  if (avisos.length) esperarLuego(procesarCola(env, vars, { ids: avisos }));
  return { resultados, detenido: false };
}

/** Lo que el dispositivo guarda para seguir trabajando sin conexión. */
export async function datosParaSinConexion(db: D1Database, tintoreriaId: string) {
  const [clientes, ordenes, prendas] = await db.batch([
    db
      .prepare(
        `select id, nombre, apellido, telefono, telefono_digitos, idioma from clientes
         where tintoreria_id = ? and eliminado_en is null order by actualizado_en desc limit 2000`,
      )
      .bind(tintoreriaId),
    db
      .prepare(
        `select o.id, o.numero, o.codigo_publico, o.estado, o.urgente, o.fecha_promesa, o.total_cents, o.pagado_cents, o.creada_en,
           o.cliente_id, c.nombre as cliente_nombre, c.apellido as cliente_apellido
         from ordenes o join clientes c on c.id = o.cliente_id and c.tintoreria_id = o.tintoreria_id
         where o.tintoreria_id = ? and o.estado in ('recibida', 'en_proceso', 'lista') order by o.fecha_promesa limit 500`,
      )
      .bind(tintoreriaId),
    db
      .prepare(
        `select p.id, p.orden_id, p.prenda_es, p.prenda_en, p.servicio_es, p.servicio_en, p.codigo_etiqueta, p.estado, p.ubicacion
         from orden_prendas p join ordenes o on o.id = p.orden_id and o.tintoreria_id = p.tintoreria_id
         where p.tintoreria_id = ? and o.estado in ('recibida', 'en_proceso', 'lista') limit 5000`,
      )
      .bind(tintoreriaId),
  ]);
  return {
    clientes: clientes?.results ?? [],
    ordenes: ordenes?.results ?? [],
    prendas: prendas?.results ?? [],
    generadoEn: Date.now(),
  };
}
