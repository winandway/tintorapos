import { GUIAS, SECCIONES } from "@/lib/docs";
import { CONTENIDO_INICIO } from "@/lib/contenido/inicio";
import { URL_SITIO } from "@/lib/sitio";

/** Índice para asistentes de IA (llmstxt.org): qué es Tintora POS y dónde está cada guía de Docs. */
export function GET() {
  const es = CONTENIDO_INICIO.es;
  const en = CONTENIDO_INICIO.en;
  const lineas = [
    "# Tintora POS",
    "",
    `> ${en.meta.descripcion}`,
    `> ${es.meta.descripcion}`,
    "",
    "Tintora POS is a cloud point of sale for dry cleaners and laundries in the United States and Latin America. The interface, customer texts and Docs are available in English and Spanish (the site follows the visitor's language).",
    "",
    "## Site",
    "",
    `- [Home](${URL_SITIO}/): features, security, offline mode and FAQ`,
    `- [Start free trial](${URL_SITIO}/registro): 14 days, no credit card`,
    `- [Docs](${URL_SITIO}/docs): step-by-step guides`,
    `- [Privacy Policy](${URL_SITIO}/privacidad)`,
    `- [Terms of Service](${URL_SITIO}/terminos)`,
    "",
  ];
  for (const s of SECCIONES) {
    lineas.push(`## Docs: ${s.en} / ${s.es}`, "");
    for (const g of GUIAS.filter((x) => x.seccion === s.clave)) {
      lineas.push(`- [${g.en.titulo} / ${g.es.titulo}](${URL_SITIO}/docs/${g.slug}): ${g.en.resumen}`);
    }
    lineas.push("");
  }
  return new Response(lineas.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
