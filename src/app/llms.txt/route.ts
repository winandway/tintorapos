import { CONTENIDO_INICIO } from "@/lib/contenido/inicio";
import { GUIAS, SECCIONES } from "@/lib/docs";
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
  return new Response(lineas.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
