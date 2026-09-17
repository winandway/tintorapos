import { RUTAS_AGENTES, url } from "@/lib/agentes/enlaces";
import { HERRAMIENTAS } from "@/server/agentes/herramientas";
import { SERVIDOR, VERSION_MCP } from "@/server/agentes/mcp";

/** Tarjeta del servidor MCP (SEP-1649): quién es, dónde está y qué sabe hacer. */
export function GET() {
  return Response.json(
    {
      $schema: "https://modelcontextprotocol.io/schemas/draft/2025-11-25/server-card.json",
      serverInfo: SERVIDOR,
      protocolVersion: VERSION_MCP,
      description:
        "Herramientas públicas de Tintora POS (software de punto de venta para tintorerías y lavanderías): estado de una orden con el código del recibo, búsqueda en las guías y qué es el producto. Solo lectura, sin cuenta.",
      websiteUrl: url("/"),
      documentationUrl: url(RUTAS_AGENTES.docs),
      transport: { type: "streamable-http", endpoint: url(RUTAS_AGENTES.mcp) },
      endpoint: url(RUTAS_AGENTES.mcp),
      remotes: [{ type: "streamable-http", url: url(RUTAS_AGENTES.mcp) }],
      capabilities: { tools: { listChanged: false } },
      authentication: { type: "none" },
      tools: HERRAMIENTAS.map((h) => ({ name: h.name, title: h.title, description: h.description })),
    },
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=3600",
        "access-control-allow-origin": "*",
      },
    },
  );
}
