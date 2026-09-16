import { esquemaPrecios, guardarPrecios } from "@/server/catalogo";
import { ruta } from "@/server/ruta";

export const PUT = ruta({
  acceso: "sesion",
  permiso: "ajustes.catalogo",
  cuerpo: esquemaPrecios,
  manejar: async (c) => {
    await guardarPrecios(c.db, c.sesion!, c.cuerpo.precios, c.ahora);
    return { ok: true };
  },
});
