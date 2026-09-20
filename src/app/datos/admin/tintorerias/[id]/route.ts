import { z } from "zod";
import { cambiarCuenta, PLANES_ADMIN } from "@/server/admin";
import { ruta } from "@/server/ruta";
import { exigirAdmin } from "../../_admin";

/** Activar el plan de quien pagó, suspender, o alargar la prueba. */
export const PUT = ruta({
  acceso: "sesion",
  permitirPruebaVencida: true,
  cuerpo: z.object({
    plan: z.enum(PLANES_ADMIN).optional(),
    estado: z.enum(["activa", "suspendida"]).optional(),
    diasPrueba: z.number().int().min(0).max(365).optional(),
  }),
  manejar: async (c) => {
    exigirAdmin(c);
    await cambiarCuenta(c.db, c.sesion!, c.params.id ?? "", c.cuerpo, c.ahora);
    return { ok: true };
  },
});
