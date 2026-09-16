import { editarPrenda, esquemaPrenda } from "@/server/catalogo";
import { ruta } from "@/server/ruta";

export const PUT = ruta({
  acceso: "sesion",
  permiso: "ajustes.catalogo",
  cuerpo: esquemaPrenda,
  manejar: async (c) => {
    await editarPrenda(c.db, c.sesion!, c.params.id ?? "", c.cuerpo, c.ahora);
    return { ok: true };
  },
});
