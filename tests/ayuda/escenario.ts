import { sha256Hex } from "@/lib/codigos";
import type { EntornoPrueba } from "./entorno";
import { crearDispositivo, crearTintoreria, sesionPara, type TintoreriaPrueba } from "./fabrica";

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

/** Dos tintorerías completas. A tiene datos; B intenta alcanzarlos. */
export async function escenarioAislamiento(e: EntornoPrueba): Promise<Escenario> {
  const db = e.env.DB;
  const lado = async (nombre: string): Promise<LadoEscenario> => {
    const t = await crearTintoreria(db, nombre);
    const d = await crearDispositivo(db, t);
    return {
      ...t,
      sesionDueno: await sesionPara(db, t.id, t.duenoId),
      dispositivoId: d.id,
      dispositivoToken: d.token,
      marcas: [t.id, t.duenoId, nombre],
      ids: {},
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
export async function huellaTintoreria(db: D1Database, tintoreriaId: string): Promise<string> {
  const partes: string[] = [];
  for (const def of TABLAS) {
    const [tabla, col = "tintoreria_id"] = def.split(":");
    const { results } = await db
      .prepare(`select * from ${tabla} where ${col} = ? order by rowid`)
      .bind(tintoreriaId)
      .all();
    partes.push(`${tabla}:${JSON.stringify(results)}`);
  }
  return sha256Hex(partes.join("\n"));
}
