/**
 * Las mismas páginas públicas, escritas en Markdown para quien pide
 * `Accept: text/markdown` (agentes y asistentes). El contenido sale de los
 * mismos textos que ve una persona: no hay dos versiones que puedan
 * contradecirse.
 */
import { CONTENIDO_INICIO } from "@/lib/contenido/inicio";
import { PRIVACIDAD, TERMINOS } from "@/lib/contenido/legal";
import { GUIAS, guiaPorSlug, SECCIONES, type Bloque } from "@/lib/docs";
import { SLUG_EN } from "@/lib/docs/slugs";
import type { Idioma } from "@/lib/i18n/idiomas";
import { urlAbsoluta } from "@/lib/seo";
import { RUTAS_AGENTES, url } from "./enlaces";

function bloquesAMarkdown(bloques: Bloque[]): string[] {
  const salida: string[] = [];
  for (const b of bloques) {
    if (b.t === "h2") salida.push(`## ${b.texto}`, "");
    else if (b.t === "p") salida.push(b.texto, "");
    else if (b.t === "pasos") salida.push(...b.items.map((x, i) => `${i + 1}. ${x}`), "");
    else if (b.t === "lista") salida.push(...b.items.map((x) => `- ${x}`), "");
    else if (b.t === "nota")
      salida.push(`> **${b.tono === "consejo" ? "Consejo" : "Importante"}:** ${b.texto}`, "");
    else if (b.t === "codigo") salida.push("```", b.texto, "```", "");
    else if (b.pie) salida.push(`_${b.pie}_`, "");
  }
  return salida;
}

const pie = (idioma: Idioma) => [
  "---",
  "",
  idioma === "en"
    ? `Tools for agents: MCP at ${url(RUTAS_AGENTES.mcp)} · API catalog at ${url(RUTAS_AGENTES.catalogoApi)} · Full index at ${url(RUTAS_AGENTES.llms)}`
    : `Herramientas para agentes: MCP en ${url(RUTAS_AGENTES.mcp)} · Catálogo de API en ${url(RUTAS_AGENTES.catalogoApi)} · Índice completo en ${url(RUTAS_AGENTES.llms)}`,
  "",
];

function inicio(idioma: Idioma): string {
  const c = CONTENIDO_INICIO[idioma];
  const l: string[] = [
    `# Tintora POS — ${c.hero.titulo} ${c.hero.tituloResaltado}`,
    "",
    `> ${c.meta.descripcion}`,
    "",
    c.hero.texto,
    "",
    `- ${c.hero.sellos.join("\n- ")}`,
    "",
    `[${c.hero.cta}](${urlAbsoluta("/registro", idioma)})`,
    "",
    `## ${c.flujo.titulo}`,
    "",
    c.flujo.texto,
    "",
    ...c.flujo.pasos.map((p, i) => `${i + 1}. **${p.titulo}** — ${p.texto}`),
    "",
    `## ${c.funciones.titulo}`,
    "",
    ...c.funciones.items.map((f) => `- **${f.titulo}** — ${f.texto}`),
    "",
    `## ${c.sinConexion.titulo}`,
    "",
    c.sinConexion.texto,
    "",
    `## ${c.seguridad.titulo}`,
    "",
    c.seguridad.texto,
    "",
    ...c.seguridad.items.map((f) => `- **${f.titulo}** — ${f.texto}`),
    "",
    `## ${c.preguntas.titulo}`,
    "",
  ];
  for (const q of c.preguntas.items) l.push(`### ${q.p}`, "", q.r, "");
  l.push(
    `## ${idioma === "en" ? "Documentation" : "Documentación"}`,
    "",
    `- [${idioma === "en" ? "All guides" : "Todas las guías"}](${urlAbsoluta("/docs", idioma)})`,
    "",
    ...pie(idioma),
  );
  return l.join("\n");
}

function portadaDocs(idioma: Idioma): string {
  const l = [`# ${idioma === "en" ? "Tintora POS Docs" : "Docs de Tintora POS"}`, ""];
  for (const s of SECCIONES) {
    l.push(`## ${idioma === "en" ? s.en : s.es}`, "");
    for (const g of GUIAS.filter((x) => x.seccion === s.clave)) {
      const t = g[idioma];
      l.push(`- [${t.titulo}](${urlAbsoluta(`/docs/${g.slug}`, idioma)}): ${t.resumen}`);
    }
    l.push("");
  }
  l.push(...pie(idioma));
  return l.join("\n");
}

function guia(slugEs: string, idioma: Idioma): string | null {
  const g = guiaPorSlug(slugEs);
  if (!g) return null;
  const t = g[idioma];
  return [
    `# ${t.titulo}`,
    "",
    `> ${t.resumen}`,
    "",
    ...bloquesAMarkdown(t.bloques),
    `[${idioma === "en" ? "Open in the browser" : "Abrir en el navegador"}](${urlAbsoluta(`/docs/${g.slug}`, idioma)})`,
    "",
    ...pie(idioma),
  ].join("\n");
}

function legal(cual: "privacidad" | "terminos", idioma: Idioma): string {
  const doc = (cual === "privacidad" ? PRIVACIDAD : TERMINOS)[idioma];
  const l = [`# ${doc.titulo}`, "", `> ${doc.descripcion}`, "", `_${doc.actualizado}_`, ""];
  for (const s of doc.secciones) {
    l.push(`## ${s.titulo}`, "");
    for (const p of s.parrafos) l.push(p, "");
    if (s.lista) l.push(...s.lista.map((x: string) => `- ${x}`), "");
  }
  l.push(`## ${doc.contacto.titulo}`, "", doc.contacto.sin, "", ...pie(idioma));
  return l.join("\n");
}

function registro(idioma: Idioma): string {
  const c = CONTENIDO_INICIO[idioma];
  return [
    `# ${c.hero.cta}`,
    "",
    idioma === "en"
      ? "Create your dry cleaner account in Tintora POS. 14-day free trial, no credit card."
      : "Crea la cuenta de tu tintorería en Tintora POS. Prueba gratis de 14 días, sin tarjeta.",
    "",
    idioma === "en"
      ? "The form asks for the store name, your name, email and a password. After that you set prices, add employees with a PIN and register the counter tablet."
      : "El formulario pide el nombre de la tienda, tu nombre, tu correo y una contraseña. Después pones precios, agregas empleados con PIN y registras la tablet del mostrador.",
    "",
    `[${c.hero.cta}](${urlAbsoluta("/registro", idioma)})`,
    "",
    ...pie(idioma),
  ].join("\n");
}

/** Normaliza la ruta pedida y devuelve el Markdown, o null si esa página no existe. */
export function markdownDeRuta(partes: string[]): { texto: string; idioma: Idioma } | null {
  let idioma: Idioma = "es";
  const p = [...partes];
  if (p[0] === "es" || p[0] === "en") {
    idioma = p[0];
    p.shift();
  }
  const ruta = p.join("/");
  if (ruta === "") return { texto: inicio(idioma), idioma };
  if (ruta === "docs") return { texto: portadaDocs(idioma), idioma };
  if (ruta.startsWith("docs/")) {
    const slug = ruta.slice(5);
    const slugEs =
      idioma === "en" ? (Object.entries(SLUG_EN).find(([, en]) => en === slug)?.[0] ?? slug) : slug;
    const texto = guia(slugEs, idioma);
    return texto ? { texto, idioma } : null;
  }
  if (ruta === "privacidad" || ruta === "privacy") return { texto: legal("privacidad", idioma), idioma };
  if (ruta === "terminos" || ruta === "terms") return { texto: legal("terminos", idioma), idioma };
  if (ruta === "registro" || ruta === "signup") return { texto: registro(idioma), idioma };
  return null;
}
