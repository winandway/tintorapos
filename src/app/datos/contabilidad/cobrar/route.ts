import { porCobrar } from "@/server/contabilidad";
import { ruta } from "@/server/ruta";
import { rangoDe } from "../_rango";

export const GET = ruta({
  acceso: "sesion",
  permiso: "contabilidad.ver",
  manejar: async (c) => {
    const [, , hoy] = rangoDe(c.req.url, c.sesion!, c.ahora);
    return porCobrar(c.db, c.sesion!.tintoreria.id, hoy);
  },
});
