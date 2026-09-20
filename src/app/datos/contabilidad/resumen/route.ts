import { ganancia } from "@/server/contabilidad";
import { ruta } from "@/server/ruta";
import { rangoDe } from "../_rango";

export const GET = ruta({
  acceso: "sesion",
  permiso: "contabilidad.ver",
  manejar: async (c) => {
    const [desde, hasta] = rangoDe(c.req.url, c.sesion!, c.ahora);
    return ganancia(c.db, c.sesion!.tintoreria.id, desde, hasta);
  },
});
