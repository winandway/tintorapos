import { habilidadPorNombre } from "@/lib/agentes/habilidades";

/** El texto de una habilidad, tal cual, para que el agente lo lea. */
export async function GET(_req: Request, { params }: { params: Promise<{ habilidad: string }> }) {
  const { habilidad } = await params;
  const h = habilidadPorNombre(habilidad);
  if (!h) return new Response("No existe esa habilidad.", { status: 404 });
  return new Response(h.markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
      "x-markdown-tokens": String(Math.ceil(h.markdown.length / 4)),
    },
  });
}
