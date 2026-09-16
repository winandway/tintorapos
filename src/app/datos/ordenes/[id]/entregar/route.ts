import { entregarOrden, esquemaEntrega } from "@/server/ordenes/acciones";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "sesion",
  permiso: "ordenes.entregar",
  cuerpo: esquemaEntrega,
  manejar: async (c) => {
    await entregarOrden(c.db, c.sesion!, c.params.id ?? "", c.cuerpo, c.ahora);
    return { ok: true };
  },
});
