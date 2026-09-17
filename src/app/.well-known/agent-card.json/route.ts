import { RUTAS_AGENTES, url } from "@/lib/agentes/enlaces";
import { HERRAMIENTAS } from "@/server/agentes/herramientas";

/**
 * Tarjeta de agente (A2A): qué sabe hacer Tintora POS para otro agente. Las
 * mismas habilidades públicas que expone el servidor MCP, que es el transporte
 * que ofrecemos hoy.
 */
export function GET() {
  return Response.json(
    {
      protocolVersion: "0.3.0",
      name: "Tintora POS",
      description:
        "Punto de venta en la nube para tintorerías y lavanderías. Consulta pública del estado de una orden, búsqueda en las guías e información del producto.",
      url: url(RUTAS_AGENTES.a2a),
      preferredTransport: "JSONRPC",
      supportedInterfaces: [
        { transport: "JSONRPC", url: url(RUTAS_AGENTES.a2a) },
        { transport: "MCP", url: url(RUTAS_AGENTES.mcp) },
      ],
      additionalInterfaces: [{ transport: "MCP", url: url(RUTAS_AGENTES.mcp) }],
      version: "1.0.0",
      documentationUrl: url(RUTAS_AGENTES.docs),
      provider: { organization: "Windoce LLC", url: "https://windoce.com" },
      capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: false },
      defaultInputModes: ["text/plain"],
      defaultOutputModes: ["text/plain", "application/json"],
      securitySchemes: {},
      security: [],
      skills: HERRAMIENTAS.map((h) => ({
        id: h.name,
        name: h.title,
        description: h.description,
        tags: ["tintoreria", "lavanderia", "dry-cleaning", "laundry", "pos"],
        examples:
          h.name === "estado_de_orden"
            ? ["¿Está lista mi ropa? El código del recibo es R0HJ2Y3XRCQ6EJSVJM48", "Is my laundry ready?"]
            : h.name === "buscar_guias"
              ? ["¿Cómo cierro la caja?", "How do I print garment tags?"]
              : ["¿Qué es Tintora POS?", "What does Tintora POS do?"],
        inputModes: ["text/plain"],
        outputModes: ["text/plain", "application/json"],
      })),
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
