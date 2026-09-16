import { esquemaMovimiento, registrarMovimiento } from "@/server/caja";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "sesion",
  permiso: "caja.abrir",
  cuerpo: esquemaMovimiento,
  manejar: async (c) => ({ id: await registrarMovimiento(c.db, c.sesion!, c.cuerpo, c.ahora) }),
});
