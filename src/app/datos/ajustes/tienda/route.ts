import { esquemaTienda, guardarTienda, leerTienda } from "@/server/ajustes/tienda";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "ajustes.tienda",
  manejar: async (c) => ({ tienda: await leerTienda(c.db, c.sesion!.tintoreria.id) }),
});

export const PUT = ruta({
  acceso: "sesion",
  permiso: "ajustes.tienda",
  cuerpo: esquemaTienda,
  manejar: async (c) => {
    await guardarTienda(c.db, c.sesion!, c.cuerpo, c.ahora);
    return { ok: true };
  },
});
