import { z } from "zod";
import { cerrarTurno } from "@/server/caja";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "sesion",
  permiso: "caja.cerrar",
  cuerpo: z.object({
    contadoCents: z.number().int().min(0).max(100_000_000),
    notas: z
      .string()
      .trim()
      .max(300)
      .transform((v) => (v === "" ? null : v))
      .nullable()
      .optional(),
  }),
  manejar: async (c) => cerrarTurno(c.db, c.sesion!, c.cuerpo.contadoCents, c.cuerpo.notas ?? null, c.ahora),
});
