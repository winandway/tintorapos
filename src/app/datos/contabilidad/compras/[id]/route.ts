import { z } from "zod";
import { eliminarCompra, pagarCompra } from "@/server/contabilidad";
import { ruta } from "@/server/ruta";

/** Abonar a una compra a crédito. */
export const POST = ruta({
  acceso: "sesion",
  permiso: "contabilidad.gestionar",
  cuerpo: z.object({ montoCents: z.number().int().positive().max(1_000_000_000) }),
  manejar: async (c) => ({
    pagadoCents: await pagarCompra(c.db, c.sesion!, c.params.id ?? "", c.cuerpo.montoCents, c.ahora),
  }),
});

export const DELETE = ruta({
  acceso: "sesion",
  permiso: "contabilidad.gestionar",
  manejar: async (c) => {
    await eliminarCompra(c.db, c.sesion!, c.params.id ?? "", c.ahora);
    return { ok: true };
  },
});
