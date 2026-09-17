import { manejarA2a, VERSION_A2A } from "@/server/agentes/a2a";
import { obtenerContexto } from "@/server/entorno";
import { limitar } from "@/server/limites";
import { ipDePeticion } from "@/server/ruta";

/** Puerta A2A: JSON-RPC 2.0 con `message/send`. Tarjeta en /.well-known/agent-card.json */
const CABECERAS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, accept",
  "access-control-allow-methods": "POST, OPTIONS",
  "x-a2a-version": VERSION_A2A,
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CABECERAS });
}

export function GET() {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32000, message: "Usa POST con message/send." } },
    { status: 405, headers: { ...CABECERAS, allow: "POST, OPTIONS" } },
  );
}

export async function POST(req: Request) {
  const { env } = obtenerContexto();
  const limite = await limitar(env.DB, `a2a:${ipDePeticion(req)}`, 60, 60);
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
  return Response.json(await manejarA2a(env.DB, cuerpo), { headers: CABECERAS });
}
