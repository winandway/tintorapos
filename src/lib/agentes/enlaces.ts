/**
 * Lo que un agente de IA necesita para entender el sitio sin adivinar: catálogo
 * de API, documentación, habilidades y el servidor MCP. Todo público y de solo
 * lectura. Vive en un solo archivo para que las cabeceras, el catálogo, el
 * manifiesto ARD y las pruebas digan SIEMPRE lo mismo.
 */
import { URL_SITIO } from "../sitio";

export const RUTAS_AGENTES = {
  catalogoApi: "/.well-known/api-catalog",
  openapi: "/.well-known/openapi.json",
  habilidades: "/.well-known/agent-skills/index.json",
  tarjetaMcp: "/.well-known/mcp/server-card.json",
  tarjetaA2a: "/.well-known/agent-card.json",
  catalogoIa: "/.well-known/ai-catalog.json",
  mcp: "/mcp",
  docs: "/docs",
  llms: "/llms.txt",
  estadoApi: "/datos/salud",
} as const;

export const url = (interna: string): string => `${URL_SITIO}${interna}`;

/**
 * Cabecera `Link` de la portada (RFC 8288). Los tipos de relación son los
 * registrados en IANA: así cualquier agente los entiende sin documentación.
 */
export function cabeceraLink(): string {
  return [
    `<${RUTAS_AGENTES.catalogoApi}>; rel="api-catalog"; type="application/linkset+json"`,
    `<${RUTAS_AGENTES.openapi}>; rel="service-desc"; type="application/vnd.oai.openapi+json"`,
    `<${RUTAS_AGENTES.docs}>; rel="service-doc"; type="text/html"`,
    `<${RUTAS_AGENTES.estadoApi}>; rel="status"; type="application/json"`,
    `<${RUTAS_AGENTES.llms}>; rel="describedby"; type="text/plain"`,
    `<${RUTAS_AGENTES.catalogoIa}>; rel="ai-catalog"; type="application/json"`,
  ].join(", ");
}
