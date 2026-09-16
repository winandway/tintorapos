import { sentenciaAuditoria } from "@/server/auditoria";
import { esquemaPlantillas } from "@/server/avisos/plantillas";
import { ruta } from "@/server/ruta";

export const PUT = ruta({
  acceso: "sesion",
  permiso: "ajustes.avisos",
  cuerpo: esquemaPlantillas,
  manejar: async (c) => {
    const s = c.sesion!;
    await c.db.batch([
      c.db
        .prepare("update tintorerias set plantillas = ?, actualizada_en = ? where id = ?")
        .bind(JSON.stringify(c.cuerpo), c.ahora, s.tintoreria.id),
      sentenciaAuditoria(
        c.db,
        {
          tintoreriaId: s.tintoreria.id,
          usuarioId: s.usuario.id,
          dispositivoId: s.dispositivoId,
          accion: "ajustes.avisos",
        },
        c.ahora,
      ),
    ]);
    return { ok: true };
  },
});
