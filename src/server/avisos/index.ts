import { nuevoId } from "@/lib/codigos";
import { formatoFecha } from "@/lib/i18n";
import type { Variables } from "@/env";
import { correoConfigurado, enviarCorreo } from "@/server/correo";
import { componerAviso, configuracionAvisos, type TipoAviso } from "./plantillas";
import { enviarSms } from "./twilio";

export const MAX_INTENTOS = 5;

interface DatosEncolar {
  tintoreriaId: string;
  ordenId: string;
  tipo: TipoAviso;
}

/**
 * Pone en cola los avisos de una orden según el permiso del cliente (SMS y/o
 * correo) y la plantilla activa. No manda nada: eso lo hace procesarCola.
 */
export async function encolarAvisos(
  db: D1Database,
  appUrl: string,
  d: DatosEncolar,
  ahora = Date.now(),
): Promise<string[]> {
  const f = await db
    .prepare(
      `select o.numero, o.codigo_publico, o.fecha_promesa, c.id as cliente_id, c.nombre, c.telefono, c.correo, c.idioma,
         c.acepta_sms, c.sms_baja_en, c.acepta_correo, t.nombre as tienda, t.plantillas, t.zona_horaria, t.pais
       from ordenes o
       join clientes c on c.id = o.cliente_id and c.tintoreria_id = o.tintoreria_id
       join tintorerias t on t.id = o.tintoreria_id
       where o.tintoreria_id = ? and o.id = ?`,
    )
    .bind(d.tintoreriaId, d.ordenId)
    .first<{
      numero: number;
      codigo_publico: string;
      fecha_promesa: number;
      cliente_id: string;
      nombre: string;
      telefono: string | null;
      correo: string | null;
      idioma: "es" | "en";
      acepta_sms: number;
      sms_baja_en: number | null;
      acepta_correo: number;
      tienda: string;
      plantillas: string;
      zona_horaria: string;
      pais: string;
    }>();
  if (!f) return [];
  const conf = configuracionAvisos(f.plantillas)[d.tipo];
  if (!conf.activo) return [];
  const cuerpo = componerAviso(conf[f.idioma], {
    tienda: f.tienda,
    nombre: f.nombre.split(/\s+/)[0] ?? f.nombre,
    numero: f.numero,
    fecha: formatoFecha(
      f.fecha_promesa,
      f.idioma,
      f.zona_horaria,
      { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
      f.pais,
    ),
    enlace: `${appUrl}/t/${f.codigo_publico}`,
  });
  const ids: string[] = [];
  const sentencias: D1PreparedStatement[] = [];
  const agregar = (canal: "sms" | "correo", destino: string, asunto: string | null) => {
    const id = nuevoId();
    ids.push(id);
    sentencias.push(
      db
        .prepare(
          `insert into avisos (id, tintoreria_id, orden_id, cliente_id, tipo, canal, destino, idioma, asunto, cuerpo, programado_en, creado_en)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          d.tintoreriaId,
          d.ordenId,
          f.cliente_id,
          d.tipo,
          canal,
          destino,
          f.idioma,
          asunto,
          cuerpo,
          ahora,
          ahora,
        ),
    );
  };
  if (f.acepta_sms && f.telefono && !f.sms_baja_en) agregar("sms", f.telefono, null);
  if (f.acepta_correo && f.correo) agregar("correo", f.correo, `${f.tienda} · #${f.numero}`);
  if (sentencias.length) await db.batch(sentencias);
  return ids;
}

interface FilaAviso {
  id: string;
  tintoreria_id: string;
  canal: "sms" | "correo";
  destino: string;
  asunto: string | null;
  cuerpo: string;
  intentos: number;
}

export interface ResultadoCola {
  enviados: number;
  fallidos: number;
  omitidos: number;
  reintentos: number;
}

/**
 * Manda lo pendiente. Cada aviso se «reclama» con una actualización condicional
 * para que dos procesos a la vez no manden el mismo mensaje dos veces.
 */
export async function procesarCola(
  env: CloudflareEnv,
  vars: Variables,
  opciones: { ids?: string[]; limite?: number } = {},
  ahora = Date.now(),
): Promise<ResultadoCola> {
  const db = env.DB;
  const r: ResultadoCola = { enviados: 0, fallidos: 0, omitidos: 0, reintentos: 0 };
  const consulta = opciones.ids?.length
    ? db
        .prepare(
          `select id, tintoreria_id, canal, destino, asunto, cuerpo, intentos from avisos /* sistema: avisos recién creados */
           where estado = 'pendiente' and id in (${opciones.ids.map(() => "?").join(",")})`,
        )
        .bind(...opciones.ids.slice(0, 50))
    : db
        .prepare(
          `select id, tintoreria_id, canal, destino, asunto, cuerpo, intentos from avisos /* sistema: cola de todas las tintorerías */
           where estado = 'pendiente' and programado_en <= ? order by programado_en limit ?`,
        )
        .bind(ahora, Math.min(200, opciones.limite ?? 100));
  const { results } = await consulta.all<FilaAviso>();
  for (const a of results) {
    const reclamado = await db
      .prepare(
        "update avisos set intentos = intentos + 1 where tintoreria_id = ? and id = ? and estado = 'pendiente' and intentos = ?",
      )
      .bind(a.tintoreria_id, a.id, a.intentos)
      .run();
    if (!reclamado.meta.changes) continue;
    let resultado: { ok: true; id?: string } | { ok: false; error: string; reintentar: boolean };
    if (a.canal === "sms") {
      resultado = await enviarSms(
        { sid: vars.TWILIO_ACCOUNT_SID, token: vars.TWILIO_AUTH_TOKEN, desde: vars.TWILIO_FROM },
        a.destino,
        a.cuerpo,
      );
    } else if (!correoConfigurado(env, vars)) {
      resultado = { ok: false, error: "no_configurado", reintentar: false };
    } else {
      const c = await enviarCorreo(env, vars, {
        para: a.destino,
        asunto: a.asunto ?? "Tintora POS",
        texto: a.cuerpo,
      });
      resultado =
        c.estado === "enviado"
          ? { ok: true }
          : {
              ok: false,
              error: c.estado === "fallido" ? c.error : "no_configurado",
              reintentar: c.estado === "fallido",
            };
    }
    if (resultado.ok) {
      r.enviados++;
      await db
        .prepare(
          "update avisos set estado = 'enviado', enviado_en = ?, proveedor_id = ?, error = null where tintoreria_id = ? and id = ?",
        )
        .bind(ahora, resultado.id ?? null, a.tintoreria_id, a.id)
        .run();
    } else if (resultado.error === "no_configurado") {
      r.omitidos++;
      await db
        .prepare("update avisos set estado = 'omitido', error = ? where tintoreria_id = ? and id = ?")
        .bind(resultado.error, a.tintoreria_id, a.id)
        .run();
    } else if (resultado.reintentar && a.intentos + 1 < MAX_INTENTOS) {
      r.reintentos++;
      // Espera creciente: 2, 4, 8, 16 minutos.
      const espera = 2 ** (a.intentos + 1) * 60_000;
      await db
        .prepare("update avisos set error = ?, programado_en = ? where tintoreria_id = ? and id = ?")
        .bind(resultado.error, ahora + espera, a.tintoreria_id, a.id)
        .run();
    } else {
      r.fallidos++;
      await db
        .prepare("update avisos set estado = 'fallido', error = ? where tintoreria_id = ? and id = ?")
        .bind(resultado.error, a.tintoreria_id, a.id)
        .run();
    }
  }
  return r;
}

/** Reloj: recordatorios de ropa lista sin recoger, según la política de cada tienda. */
export async function programarRecordatorios(
  db: D1Database,
  appUrl: string,
  ahora = Date.now(),
): Promise<number> {
  const { results } = await db
    .prepare(
      `select o.id, o.tintoreria_id from ordenes o join tintorerias t on t.id = o.tintoreria_id
       /* sistema: recordatorios de todas las tintorerías */
       where o.estado = 'lista' and t.estado = 'activa' and o.recordatorios_enviados < t.max_recordatorios
         and o.lista_en <= ? - t.dias_recordatorio * 86400000
         and (o.ultimo_recordatorio_en is null or o.ultimo_recordatorio_en <= ? - t.dias_recordatorio * 86400000)
       limit 200`,
    )
    .bind(ahora, ahora)
    .all<{ id: string; tintoreria_id: string }>();
  for (const o of results) {
    await encolarAvisos(
      db,
      appUrl,
      { tintoreriaId: o.tintoreria_id, ordenId: o.id, tipo: "recordatorio" },
      ahora,
    );
    await db
      .prepare(
        "update ordenes set recordatorios_enviados = recordatorios_enviados + 1, ultimo_recordatorio_en = ? where tintoreria_id = ? and id = ?",
      )
      .bind(ahora, o.tintoreria_id, o.id)
      .run();
  }
  return results.length;
}
