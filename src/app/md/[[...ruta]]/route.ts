import { markdownDeRuta } from "@/lib/agentes/markdown";

/**
 * La versión en Markdown de las páginas públicas. Se llega aquí de dos formas:
 * pidiendo la página con `Accept: text/markdown` (lo reescribe next.config) o
 * entrando directo a /md/... . El navegador nunca la ve: sigue recibiendo HTML.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ ruta?: string[] }> }) {
  const { ruta } = await params;
  const r = markdownDeRuta((ruta ?? []).map((x) => decodeURIComponent(x).replace(/\.md$/, "")));
  if (!r) return new Response("No hay versión en Markdown de esa página.", { status: 404 });
  return new Response(r.texto, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=600",
      "access-control-allow-origin": "*",
      "content-language": r.idioma,
      // Cuenta aproximada de tokens (4 caracteres por token), como pide Cloudflare.
      "x-markdown-tokens": String(Math.ceil(r.texto.length / 4)),
      vary: "accept",
    },
  });
}
