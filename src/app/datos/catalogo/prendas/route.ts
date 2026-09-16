import { crearPrenda, esquemaPrenda } from "@/server/catalogo";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "sesion",
  permiso: "ajustes.catalogo",
  cuerpo: esquemaPrenda,
  manejar: async (c) => ({ id: await crearPrenda(c.db, c.sesion!, c.cuerpo, c.ahora) }),
});
