import { editarServicio, esquemaServicio } from "@/server/catalogo";
import { ruta } from "@/server/ruta";

export const PUT = ruta({
  acceso: "sesion",
  permiso: "ajustes.catalogo",
  cuerpo: esquemaServicio,
  manejar: async (c) => {
    await editarServicio(c.db, c.sesion!, c.params.id ?? "", c.cuerpo, c.ahora);
    return { ok: true };
  },
});
