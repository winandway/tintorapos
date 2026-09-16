import { anularOrden, esquemaAnulacion } from "@/server/ordenes/acciones";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "sesion",
  permiso: "ordenes.entregar",
  cuerpo: esquemaAnulacion,
  manejar: async (c) =>
    anularOrden(c.db, c.sesion!, c.params.id ?? "", c.cuerpo.motivo, c.cuerpo.autorizacion, c.ahora),
});
