import { digestoDe, HABILIDADES } from "@/lib/agentes/habilidades";
import { url } from "@/lib/agentes/enlaces";

/** Índice de habilidades para agentes (Agent Skills Discovery 0.2.0). */
export async function GET() {
  const skills = await Promise.all(
    HABILIDADES.map(async (h) => ({
      name: h.nombre,
      type: "skill-md" as const,
      description: h.descripcion,
      url: url(`/.well-known/agent-skills/${h.nombre}/SKILL.md`),
      digest: await digestoDe(h.markdown),
    })),
  );
  return Response.json(
    { $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json", skills },
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=3600",
        "access-control-allow-origin": "*",
      },
    },
  );
}
