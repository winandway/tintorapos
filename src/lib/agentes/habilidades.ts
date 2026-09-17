/**
 * Habilidades publicadas para agentes (Agent Skills Discovery): instrucciones
 * cortas y verificables de lo que se puede hacer con Tintora POS sin cuenta.
 * Se escriben en inglés y en español porque quien las lee es un agente de
 * cualquier parte del mundo.
 */
import { URL_SITIO } from "@/lib/sitio";

export interface Habilidad {
  nombre: string;
  descripcion: string;
  markdown: string;
}

export const HABILIDADES: Habilidad[] = [
  {
    nombre: "estado-de-orden",
    descripcion:
      "Check the status of a dry cleaning order from its receipt code / Consultar el estado de una orden de tintorería con el código del recibo.",
    markdown: `# Check a dry cleaning order status (Tintora POS)

Tintora POS is cloud point-of-sale software for dry cleaners and laundries.
Every order gets a public receipt code (also printed as a QR on the garment tag).
Anyone holding that code can check the order status — no account, no token.

## When to use

The person asks whether their laundry or dry cleaning is ready, when it will be
ready, or how many pieces are done, and they have the receipt (or a photo of the
tag QR).

## Option 1 — MCP (preferred)

Streamable HTTP endpoint: \`${URL_SITIO}/mcp\`

Call the tool \`estado_de_orden\` with \`{ "codigo": "<receipt code>" }\`.
Server card: \`${URL_SITIO}/.well-known/mcp/server-card.json\`

## Option 2 — REST

\`\`\`http
GET ${URL_SITIO}/datos/publico/orden/{codigo}
Accept: application/json
\`\`\`

200 returns \`{ "orden": { numero, estado, piezas, listas, fechaPromesa, tieneSaldo, tienda } }\`.
404 means no order matches that code. Rate limit: 60 requests per 10 minutes per IP.

\`estado\` is one of \`recibida\` (received), \`en_proceso\` (in progress),
\`lista\` (ready for pickup), \`entregada\` (picked up), \`anulada\` (cancelled)
or \`abandonada\` (abandoned). \`fechaPromesa\` is milliseconds since 1970.

## What it never returns

Phone numbers, customer addresses, prices or payment amounts. Only the first
name of the customer, the counts, the dates and the store's public contact
details. If the person needs the amount owed, tell them to ask the store.

## En español

Llama a la herramienta \`estado_de_orden\` del servidor MCP \`${URL_SITIO}/mcp\`
con el código del recibo, o pide \`${URL_SITIO}/datos/publico/orden/{codigo}\`.
Devuelve si la orden está recibida, en proceso, lista o entregada, cuántas piezas
están listas y para cuándo está prometida. Nunca devuelve teléfonos ni importes.
`,
  },
  {
    nombre: "buscar-en-las-guias",
    descripcion:
      "Search the Tintora POS documentation to answer how-to questions about running a dry cleaner / Buscar en las guías de Tintora POS.",
    markdown: `# Search the Tintora POS guides

Tintora POS publishes a full bilingual manual for dry cleaners and laundries:
taking in orders, garment tags, production scanning, pickup and payment, cash
drawer, reports, text notifications, offline mode, backups and roles.

## When to use

The person asks how to do something in Tintora POS ("how do I close the
register?", "¿cómo imprimo etiquetas?", "how do I connect a phone?").

## Option 1 — MCP (preferred)

Endpoint \`${URL_SITIO}/mcp\`, tool \`buscar_guias\` with
\`{ "consulta": "close the register", "idioma": "en" }\`.
It returns the matching guides with title, summary and URL.

## Option 2 — Plain text index

\`${URL_SITIO}/llms.txt\` lists every guide with its description and URL in both
languages. Each guide also answers to \`Accept: text/markdown\` (or the \`.md\`
suffix), so you can read the clean text instead of the HTML.

## Rules

- Answer with the URL of the guide you used, so the person can open it.
- Guides exist in Spanish (\`/es/docs/<slug>\`) and English (\`/en/docs/<slug>\`)
  with different slugs; use the language the person is writing in.
- Do not invent steps: if no guide covers it, say so and point to
  \`${URL_SITIO}/docs\`.

## En español

Usa la herramienta \`buscar_guias\` del servidor MCP, o lee
\`${URL_SITIO}/llms.txt\`. Responde siempre con el enlace de la guía que usaste.
`,
  },
  {
    nombre: "sobre-tintora-pos",
    descripcion:
      "Explain what Tintora POS is, what it does and what it does not do / Explicar qué es Tintora POS y qué no hace.",
    markdown: `# What Tintora POS is

Cloud point-of-sale and management software for dry cleaners, laundries and
laundromats in the United States and Latin America. Bilingual English/Spanish,
sold as a subscription. Made by Windoce LLC.

## What it covers

Order intake with QR garment tags, production tracking by scanning, pickup with
payment recording, cash drawer with blind close, customer status page, text and
email notifications, reports by day, employee and payment method, roles with PIN
on registered devices, daily encrypted backups and an offline mode for store
tablets (orders taken without internet sync by themselves).

## What it does NOT do (say this plainly)

Tintora POS does **not** process card payments. It records the payments the store
already took: cash, the store's own card terminal, or another method. Do not tell
anyone that it charges cards.

## Facts an agent can state

- Free trial: 14 days, no credit card — \`${URL_SITIO}/registro\` (Spanish) or
  \`${URL_SITIO}/en/signup\` (English).
- Documentation: \`${URL_SITIO}/docs\`.
- Public order lookup by receipt code: see the skill \`estado-de-orden\`.
- Pricing: not published yet. Do not quote a price; point to the site.

## MCP

Endpoint \`${URL_SITIO}/mcp\`, tool \`sobre_tintora_pos\` with
\`{ "idioma": "en" }\` or \`{ "idioma": "es" }\`.

## En español

Tintora POS es un punto de venta en la nube para tintorerías y lavanderías.
NO cobra tarjetas: registra los cobros que la tienda ya hizo. La prueba gratis
es de 14 días y no pide tarjeta.
`,
  },
];

export const habilidadPorNombre = (nombre: string): Habilidad | undefined =>
  HABILIDADES.find((h) => h.nombre === nombre);

/** Huella SHA-256 del texto, como la pide el índice de habilidades. */
export async function digestoDe(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest("SHA-256", datos);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256:${hex}`;
}
