import { resumenAdmin } from "@/server/admin";
import { ruta } from "@/server/ruta";
import { exigirAdmin } from "../_admin";

/** Todo el negocio de un vistazo. Solo para los correos de `CORREOS_ADMIN`. */
export const GET = ruta({
  acceso: "sesion",
  manejar: async (c) => {
    exigirAdmin(c);
    return resumenAdmin(c.db, c.ahora);
  },
});
