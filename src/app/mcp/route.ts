import { VERSION_MCP, manejarMcp } from "@/server/agentes/mcp";
import { obtenerContexto } from "@/server/entorno";
import { limitar } from "@/server/limites";
import { ipDePeticion } from "@/server/ruta";

/**
 * Servidor MCP público de Tintora POS (Streamable HTTP, solo JSON).
 * Sin cuenta y de solo lectura: estado de una orden con su código, búsqueda en
 * las guías y qué es el producto. Tarjeta del servidor en
 * `/.well-known/mcp/server-card.json`.
 */
const CABECERAS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, mcp-protocol-version, mcp-session-id, accept",
  "access-control-allow-methods": "POST, OPTIONS",
  "mcp-protocol-version": VERSION_MCP,
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CABECERAS });
}

/** Sin canal de eventos: el servidor responde en la misma petición. */
export function GET() {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32000, message: "Usa POST con JSON-RPC 2.0." } },
    { status: 405, headers: { ...CABECERAS, allow: "POST, OPTIONS" } },
  );
}

export async function POST(req: Request) {
  const { env } = obtenerContexto();
  const limite = await limitar(env.DB, `mcp:${ipDePeticion(req)}`, 120, 60);
  if (!limite.permitido)
    return Response.json(
      { jsonrpc: "2.0", id: null, error: { code: -32029, message: "Demasiadas peticiones." } },
      { status: 429, headers: { ...CABECERAS, "retry-after": "60" } },
    );

  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido." } },
      { status: 400, headers: CABECERAS },
    );
  }
  const respuesta = await manejarMcp(env.DB, cuerpo);
  if (respuesta === null) return new Response(null, { status: 202, headers: CABECERAS });
  return Response.json(respuesta, { headers: CABECERAS });
}
