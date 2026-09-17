import { RUTAS_AGENTES, url } from "@/lib/agentes/enlaces";
import { DOMINIO_SITIO } from "@/lib/sitio";

const urn = (espacio: string, nombre: string) => `urn:air:${DOMINIO_SITIO}:${espacio}:${nombre}`;

/**
 * Manifiesto ARD (Agentic Resource Discovery): todo lo que un agente puede usar
 * de Tintora POS, en un solo archivo. Cada entrada lleva preguntas de ejemplo
 * para que los registros puedan buscarlo por significado.
 */
export function GET() {
  const cuerpo = {
    specVersion: "1.0",
    host: {
      displayName: "Tintora POS",
      identifier: `did:web:${DOMINIO_SITIO}`,
      description:
        "Punto de venta en la nube para tintorerías y lavanderías de Estados Unidos y Latinoamérica, en español e inglés.",
      url: url("/"),
    },
    entries: [
      {
        identifier: urn("mcp", "publico"),
        displayName: "Servidor MCP público de Tintora POS",
        description:
          "Estado de una orden con el código del recibo, búsqueda en las guías e información del producto. Solo lectura, sin cuenta.",
        type: "application/mcp-server-card+json",
        url: url(RUTAS_AGENTES.tarjetaMcp),
        representativeQueries: [
          "¿Está lista mi ropa en la tintorería?",
          "is my dry cleaning ready for pickup",
          "consultar el estado de una orden de lavandería con el código del recibo",
          "check laundry order status by receipt code",
        ],
      },
      {
        identifier: urn("api", "publica"),
        displayName: "API pública de Tintora POS (OpenAPI)",
        description:
          "Estado de una orden por su código público y estado del servicio. JSON, sin autenticación.",
        type: "application/vnd.oai.openapi+json",
        url: url(RUTAS_AGENTES.openapi),
        representativeQueries: [
          "API para consultar el estado de una orden de tintorería",
          "dry cleaning order status API",
          "endpoint público de Tintora POS",
        ],
      },
      {
        identifier: urn("agent", "a2a"),
        displayName: "Tarjeta de agente (A2A) de Tintora POS",
        description: "Qué sabe hacer Tintora POS para otro agente, con sus habilidades públicas.",
        type: "application/json",
        url: url(RUTAS_AGENTES.tarjetaA2a),
        representativeQueries: [
          "agente de tintorería",
          "laundry agent card",
          "capacidades del agente de Tintora POS",
        ],
      },
      {
        identifier: urn("skills", "indice"),
        displayName: "Habilidades de agente de Tintora POS",
        description:
          "Instrucciones paso a paso para que un agente consulte una orden, busque en las guías o explique el producto.",
        type: "application/json",
        url: url(RUTAS_AGENTES.habilidades),
        representativeQueries: [
          "habilidades para agentes de tintorería",
          "agent skills for laundry software",
          "cómo usar Tintora POS desde un agente",
        ],
      },
      {
        identifier: urn("docs", "guias"),
        displayName: "Guías de Tintora POS",
        description:
          "Documentación completa del producto en español e inglés: recibir ropa, etiquetas, producción, entrega, caja, reportes, avisos y respaldos.",
        type: "text/plain",
        url: url(RUTAS_AGENTES.llms),
        representativeQueries: [
          "cómo cerrar la caja en una tintorería",
          "how to print garment tags",
          "manual de software para lavanderías",
          "guía de punto de venta para tintorerías",
        ],
      },
    ],
  };
  return Response.json(cuerpo, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
}
