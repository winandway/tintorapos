/**
 * Servidor MCP (Model Context Protocol) mínimo: JSON-RPC 2.0 sobre HTTP, sin
 * sesión y sin canal de eventos. Responde `initialize`, `tools/list`,
 * `tools/call` y `ping`; las notificaciones se aceptan y no responden nada.
 * Las herramientas viven en `herramientas.ts`.
 */
import { ejecutarHerramienta, HERRAMIENTAS } from "./herramientas";

export const VERSION_MCP = "2025-06-18";
export const VERSIONES_MCP = ["2025-06-18", "2025-03-26", "2024-11-05"];
export const SERVIDOR = { name: "tintora-pos", title: "Tintora POS", version: "1.0.0" };

interface Peticion {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

const error = (id: Peticion["id"], code: number, message: string) => ({
  jsonrpc: "2.0" as const,
  id: id ?? null,
  error: { code, message },
});

const ok = (id: Peticion["id"], result: unknown) => ({ jsonrpc: "2.0" as const, id: id ?? null, result });

async function manejarUna(db: D1Database, p: Peticion): Promise<object | null> {
  if (p.jsonrpc !== "2.0" || typeof p.method !== "string")
    return error(p.id, -32600, "Petición JSON-RPC inválida.");
  // Una notificación (sin id) no lleva respuesta.
  const esNotificacion = p.id === undefined || p.id === null;

  switch (p.method) {
    case "initialize": {
      const pedida = String(p.params?.protocolVersion ?? "");
      return ok(p.id, {
        protocolVersion: VERSIONES_MCP.includes(pedida) ? pedida : VERSION_MCP,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVIDOR,
        instructions:
          "Herramientas públicas de Tintora POS, solo lectura: estado de una orden con el código del recibo, búsqueda en las guías y qué es el producto. No hace falta cuenta ni token.",
      });
    }
    case "ping":
      return ok(p.id, {});
    case "tools/list":
      return ok(p.id, { tools: HERRAMIENTAS });
    case "tools/call": {
      const nombre = String(p.params?.name ?? "");
      const argumentos = (p.params?.arguments ?? {}) as Record<string, unknown>;
      if (!HERRAMIENTAS.some((h) => h.name === nombre))
        return error(p.id, -32602, `No existe la herramienta «${nombre}».`);
      const r = await ejecutarHerramienta(db, nombre, argumentos);
      return ok(p.id, {
        content: [{ type: "text", text: r.texto }],
        ...(r.datos ? { structuredContent: r.datos } : {}),
        isError: Boolean(r.error),
      });
    }
    default:
      if (p.method.startsWith("notifications/")) return esNotificacion ? null : ok(p.id, {});
      return error(p.id, -32601, `Método no disponible: ${p.method}.`);
  }
}

/** Devuelve la respuesta JSON-RPC, o null si solo llegaron notificaciones. */
export async function manejarMcp(db: D1Database, cuerpo: unknown): Promise<object | object[] | null> {
  if (Array.isArray(cuerpo)) {
    const salidas = await Promise.all(cuerpo.map((p) => manejarUna(db, p as Peticion)));
    const utiles = salidas.filter((s): s is object => s !== null);
    return utiles.length ? utiles : null;
  }
  return manejarUna(db, (cuerpo ?? {}) as Peticion);
}
