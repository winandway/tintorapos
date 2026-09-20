import { z } from "zod";
import { esquemaInsumo, guardarInsumo, moverInsumo } from "@/server/contabilidad";
import { ruta } from "@/server/ruta";

export const PUT = ruta({
  acceso: "sesion",
  permiso: "contabilidad.gestionar",
  cuerpo: z.object({ insumo: esquemaInsumo }),
  manejar: async (c) => {
    await guardarInsumo(c.db, c.sesion!, c.params.id ?? "", c.cuerpo.insumo, c.ahora);
    return { ok: true };
  },
});

/** Sumar o restar existencia a mano: se gastó, se dañó o se volvió a contar. */
export const POST = ruta({
  acceso: "sesion",
  permiso: "contabilidad.gestionar",
  cuerpo: z.object({
    cantidad: z.number().refine((n) => n !== 0, "invalida"),
    motivo: z.string().trim().max(120).optional(),
    tipo: z.enum(["consumo", "ajuste"]).default("ajuste"),
  }),
  manejar: async (c) => ({
    existencia: await moverInsumo(
      c.db,
      c.sesion!,
      c.params.id ?? "",
      c.cuerpo.cantidad,
      c.cuerpo.motivo ?? null,
      c.cuerpo.tipo,
      c.ahora,
    ),
  }),
});
