import { listarAuditoria } from "@/server/auditoria";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "auditoria.ver",
  manejar: async (c) => {
    const url = new URL(c.req.url);
    const antes = Number(url.searchParams.get("antes") ?? "") || undefined;
    const accion = url.searchParams.get("accion")?.slice(0, 60) || undefined;
    return {
      registros: await listarAuditoria(c.db, c.sesion!.tintoreria.id, { antesDe: antes, accion, limite: 50 }),
    };
  },
});
