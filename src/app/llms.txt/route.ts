import { CONTENIDO_INICIO } from "@/lib/contenido/inicio";
import { GUIAS, SECCIONES } from "@/lib/docs";
import { RUTAS_AGENTES, url } from "@/lib/agentes/enlaces";
import { urlAbsoluta } from "@/lib/seo";

/** Índice para asistentes de IA (llmstxt.org): qué es Tintora POS y dónde está cada guía, en inglés y en español. */
export function GET() {
  const es = CONTENIDO_INICIO.es;
  const en = CONTENIDO_INICIO.en;
  const lineas = [
    "# Tintora POS",
    "",
    `> ${en.meta.descripcion}`,
    `> ${es.meta.descripcion}`,
    "",
    "Tintora POS is cloud point-of-sale software for dry cleaners, laundries and laundromats worldwide, available in English and Spanish. It covers order intake with QR garment tags, production tracking by scanning, pickup and payment recording, cash drawer with blind close, customer text notifications, reports, daily encrypted backups and an offline mode for store tablets.",
    "",
    "## Site",
    "",
    `- [Home (English)](${urlAbsoluta("", "en")}): features, security, offline mode and FAQ`,
    `- [Inicio (español)](${urlAbsoluta("", "es")})`,
    `- [Start free trial](${urlAbsoluta("/registro", "en")}): 14 days, no credit card`,
    `- [Docs (English)](${urlAbsoluta("/docs", "en")}) · [Docs (español)](${urlAbsoluta("/docs", "es")})`,
    `- [Privacy Policy](${urlAbsoluta("/privacidad", "en")}) · [Política de privacidad](${urlAbsoluta("/privacidad", "es")})`,
    `- [Terms of Service](${urlAbsoluta("/terminos", "en")}) · [Términos](${urlAbsoluta("/terminos", "es")})`,
    "",
  ];
  for (const s of SECCIONES) {
    lineas.push(`## Docs: ${s.en} / ${s.es}`, "");
    for (const g of GUIAS.filter((x) => x.seccion === s.clave)) {
      const interna = `/docs/${g.slug}`;
      lineas.push(
        `- [${g.en.titulo}](${urlAbsoluta(interna, "en")}) · [${g.es.titulo}](${urlAbsoluta(interna, "es")}): ${g.en.resumen}`,
      );
    }
    lineas.push("");
  }
  lineas.push(
    "## For agents",
    "",
    `- [MCP server](${url(RUTAS_AGENTES.mcp)}): public read-only tools — order status by receipt code, docs search, product facts. Card: [server-card.json](${url(RUTAS_AGENTES.tarjetaMcp)})`,
    `- [API catalog](${url(RUTAS_AGENTES.catalogoApi)}) · [OpenAPI](${url(RUTAS_AGENTES.openapi)}) · [Agent card (A2A)](${url(RUTAS_AGENTES.tarjetaA2a)})`,
    `- [Agent skills](${url(RUTAS_AGENTES.habilidades)}) · [Resource manifest (ARD)](${url(RUTAS_AGENTES.catalogoIa)})`,
    "- Every public page answers `Accept: text/markdown` with clean Markdown (or add `/md` in front of the path).",
    "- Content signals in robots.txt: search=yes, ai-input=yes, ai-train=no.",
    "",
  );
  return new Response(lineas.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
