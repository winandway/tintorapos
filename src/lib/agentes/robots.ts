import { RUTAS_AGENTES, url } from "@/lib/agentes/enlaces";
import { URL_SITIO } from "@/lib/sitio";

/** Lo privado del sistema: nunca se indexa ni se entrega a un rastreador. */
export const RUTAS_PRIVADAS = ["/app", "/datos", "/media", "/t/", "/e/", "/v/", "/entrar"];

/**
 * robots.txt con las señales de contenido (contentsignals.org):
 * - `search=yes`: que los buscadores indexen y enlacen el sitio.
 * - `ai-input=yes`: que un asistente pueda leer la página para responder y citar.
 * - `ai-train=no`: no autorizamos entrenar modelos con este contenido.
 * Además, `Agentmap` apunta al manifiesto de recursos para agentes.
 */
export function robotsTxt(): string {
  const señales = "Content-Signal: search=yes, ai-input=yes, ai-train=no";
  const lineas = [
    "# Tintora POS",
    "# Señales de contenido (https://contentsignals.org/): qué se puede hacer con este contenido.",
    "# Content signals: search yes, AI input yes, AI training no.",
    "",
    "User-agent: *",
    señales,
    "Allow: /",
    ...RUTAS_PRIVADAS.map((r) => `Disallow: ${r}`),
    "",
    `Sitemap: ${URL_SITIO}/sitemap.xml`,
    `Host: ${URL_SITIO}`,
    `Agentmap: ${url(RUTAS_AGENTES.catalogoIa)}`,
    "",
  ];
  return lineas.join("\n");
}
