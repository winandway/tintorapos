import { crearServicio, esquemaServicio } from "@/server/catalogo";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "sesion",
  permiso: "ajustes.catalogo",
  cuerpo: esquemaServicio,
  manejar: async (c) => ({ id: await crearServicio(c.db, c.sesion!, c.cuerpo, c.ahora) }),
});
