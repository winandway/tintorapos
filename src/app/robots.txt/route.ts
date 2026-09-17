import { robotsTxt } from "@/lib/agentes/robots";

/** Se escribe a mano (no con MetadataRoute) para poder incluir Content-Signal y Agentmap. */
export function GET() {
  return new Response(robotsTxt(), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
