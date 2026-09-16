import { reporteOperacion } from "@/server/reportes";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "ordenes.ver",
  manejar: async (c) => reporteOperacion(c.db, c.sesion!.tintoreria.id, c.ahora),
});
