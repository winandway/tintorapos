import { nuevoId, sha256Hex } from "@/lib/codigos";
import { registrarTintoreria } from "@/server/cuentas/registro";
import { abrirTurno } from "@/server/caja";
import { crearOrden } from "@/server/ordenes/crear";
import { guardarFoto } from "@/server/fotos";
import { sesionDe } from "./sesion";
import type { EntornoPrueba } from "./entorno";
import { crearDispositivo, crearUsuario, sesionPara, type TintoreriaPrueba } from "./fabrica";

export interface LadoEscenario extends TintoreriaPrueba {
  sesionDueno: string;
  dispositivoId: string;
  dispositivoToken: string;
  /** Identificadores y textos únicos de esta tintorería que nunca deben verse desde la otra. */
  marcas: string[];
  ids: Record<string, string>;
}

export interface Escenario {
  a: LadoEscenario;
  b: LadoEscenario;
  env: EntornoPrueba["env"];
}

/** Dos tintorerías completas (registro real con catálogo). A tiene datos; B intenta alcanzarlos. */
export async function escenarioAislamiento(e: EntornoPrueba): Promise<Escenario> {
  const db = e.env.DB;
  const lado = async (nombre: string): Promise<LadoEscenario> => {
    const r = await registrarTintoreria(db, {
      negocio: nombre,
      nombre: `Dueño ${nombre}`,
      correo: `dueno-${nuevoId().slice(0, 8)}@ejemplo.com`,
      clave: "Clave-Segura-2026",
      zonaHoraria: "America/New_York",
      idioma: "es",
      pais: "US",
      moneda: "USD",
    });
    const t: TintoreriaPrueba = { id: r.tintoreriaId, sucursalId: r.sucursalId, duenoId: r.usuarioId };
    const d = await crearDispositivo(db, t);
    const prenda = await db
      .prepare("select id from catalogo_prendas where tintoreria_id = ? order by orden limit 1")
      .bind(t.id)
      .first<{ id: string }>();
    const servicio = await db
      .prepare("select id from catalogo_servicios where tintoreria_id = ? order by orden limit 1")
      .bind(t.id)
      .first<{ id: string }>();
    const empleadoId = await crearUsuario(db, t.id, "cajero", { pin: "5820", nombre: `Cajero ${nombre}` });
    await db
      .prepare(
        "insert into precios (tintoreria_id, servicio_id, prenda_id, precio_cents, actualizado_en) values (?, ?, ?, 777, ?)",
      )
      .bind(t.id, servicio!.id, prenda!.id, Date.now())
      .run();
    const clienteId = nuevoId();
    await db
      .prepare(
        "insert into clientes (id, tintoreria_id, nombre, telefono, telefono_digitos, idioma, creado_en, actualizado_en) values (?, ?, ?, ?, ?, 'es', ?, ?)",
      )
      .bind(clienteId, t.id, `Cliente ${nombre}`, "+13125550199", "3125550199", Date.now(), Date.now())
      .run();
    const sesionDueno = await sesionPara(db, t.id, t.duenoId);
    const s = await sesionDe(db, sesionDueno);
    const turnoId = await abrirTurno(db, s, 5000);
    const ordenId = nuevoId();
    const prendaOrdenId = nuevoId();
    const pagoId = nuevoId();
    const orden = await crearOrden(db, s, {
      id: ordenId,
      cliente: { id: clienteId },
      prendas: [{ id: prendaOrdenId, prendaId: prenda!.id, servicioId: servicio!.id, cantidad: 1 }],
      urgente: false,
      pago: { id: pagoId, metodo: "efectivo", montoCents: 100 },
    });
    const fotoId = await guardarFoto(db, e.env.BUCKET, s, {
      ordenId,
      prendaId: prendaOrdenId,
      bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]),
    });
    return {
      ...t,
      sesionDueno,
      dispositivoId: d.id,
      dispositivoToken: d.token,
      marcas: [
        t.id,
        t.duenoId,
        nombre,
        empleadoId,
        prenda!.id,
        servicio!.id,
        d.id,
        clienteId,
        ordenId,
        prendaOrdenId,
        pagoId,
        turnoId,
        orden.codigoPublico,
        fotoId,
      ],
      ids: {
        prendaId: prenda!.id,
        servicioId: servicio!.id,
        empleadoId,
        clienteId,
        ordenId,
        prendaOrdenId,
        pagoId,
        turnoId,
        codigoPublico: orden.codigoPublico,
        fotoId,
      },
    };
  };
  const a = await lado("Tintoreria A marca-unica-aaaa");
  const b = await lado("Tintoreria B marca-unica-bbbb");
  return { a, b, env: e.env };
}

const TABLAS = [
  "tintorerias:id",
  "sucursales",
  "usuarios",
  "dispositivos",
  "clientes",
  "catalogo_prendas",
  "catalogo_servicios",
  "precios",
  "turnos_caja",
  "movimientos_caja",
  "ordenes",
  "orden_prendas",
  "orden_estados",
  "fotos",
  "pagos",
  "avisos",
  "respaldos",
];

/** Huella de todos los datos de una tintorería: si algo cambia, cambia la huella. */
export async function huellaTintoreria(
  db: D1Database,
  tintoreriaId: string,
  excluir: string[] = [],
): Promise<string> {
  const partes: string[] = [];
  for (const def of TABLAS.filter((t) => !excluir.includes(t))) {
    const [tabla, col = "tintoreria_id"] = def.split(":");
    const { results } = await db
      .prepare(`select * from ${tabla} where ${col} = ? order by rowid`)
      .bind(tintoreriaId)
      .all();
    partes.push(`${tabla}:${JSON.stringify(results)}`);
  }
  return sha256Hex(partes.join("\n"));
}
