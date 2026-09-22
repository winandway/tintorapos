import { z } from "zod";
import { guardarSistema, leerSistema } from "@/server/sistema";

/**
 * Los partes de fallo que mandan los teléfonos (ver src/lib/diagnostico.ts).
 * Se guardan los últimos en `sistema` (sin datos personales: ruta genérica,
 * método, estado, código, tipo de equipo) y los enseña /datos/salud.
 */
export const CLAVE_FALLOS_CLIENTE = "fallos_cliente";
const MAX_GUARDADOS = 30;
const VENTANA = 24 * 3600_000;
/** A partir de aquí el canario se pone en rojo: algo está fallando en los equipos. */
export const FALLOS_PARA_ALARMA = 3;

export const esquemaFalloCliente = z.object({
  ruta: z.string().trim().min(1).max(80),
  metodo: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  estado: z.number().int().min(0).max(599),
  codigo: z.string().trim().max(120),
  equipo: z.string().trim().max(60),
  enLinea: z.boolean().optional(),
});
export type FalloCliente = z.infer<typeof esquemaFalloCliente>;

export interface FalloGuardado extends FalloCliente {
  hora: number;
}

/** Nada que no sea texto plano y corto: el parte viene de cualquiera. */
function limpiar(f: FalloCliente): FalloCliente {
  const texto = (s: string, max: number) => s.replace(/[^\p{L}\p{N} _:/*.,()-]/gu, "").slice(0, max);
  return {
    ruta: texto(f.ruta, 80).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "(id)"),
    metodo: f.metodo,
    estado: f.estado,
    codigo: texto(f.codigo, 120),
    equipo: texto(f.equipo, 60),
    enLinea: f.enLinea,
  };
}

export async function leerFallosCliente(db: D1Database, ahora = Date.now()): Promise<FalloGuardado[]> {
  const g = await leerSistema(db, CLAVE_FALLOS_CLIENTE).catch(() => null);
  if (!g) return [];
  try {
    const lista = JSON.parse(g.valor) as FalloGuardado[];
    return Array.isArray(lista) ? lista.filter((f) => ahora - f.hora < VENTANA) : [];
  } catch {
    return [];
  }
}

export async function guardarFalloCliente(
  db: D1Database,
  f: FalloCliente,
  ahora = Date.now(),
): Promise<void> {
  const lista = await leerFallosCliente(db, ahora);
  lista.push({ ...limpiar(f), hora: ahora });
  await guardarSistema(db, CLAVE_FALLOS_CLIENTE, JSON.stringify(lista.slice(-MAX_GUARDADOS)), ahora);
}

/** Lo que enseña el canario: cuántos en 24 h y los últimos, resumidos en una línea cada uno. */
export function resumirFallos(lista: FalloGuardado[]): { cantidad: number; ultimos: string[] } {
  return {
    cantidad: lista.length,
    ultimos: lista
      .slice(-5)
      .reverse()
      .map(
        (f) =>
          `${new Date(f.hora).toISOString().slice(11, 16)} ${f.metodo} ${f.ruta} → ${f.estado || "sin respuesta"}${f.codigo ? ` ${f.codigo}` : ""} · ${f.equipo}${f.enLinea === false ? " · sin internet" : ""}`,
      ),
  };
}
