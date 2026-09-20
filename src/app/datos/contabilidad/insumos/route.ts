import { z } from "zod";
import { crearInsumosEstandar, esquemaInsumo, guardarInsumo, listarInsumos } from "@/server/contabilidad";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "contabilidad.ver",
  manejar: async (c) => ({ insumos: await listarInsumos(c.db, c.sesion!.tintoreria.id) }),
});

export const POST = ruta({
  acceso: "sesion",
  permiso: "contabilidad.gestionar",
  cuerpo: z.union([z.object({ insumo: esquemaInsumo }), z.object({ estandar: z.literal(true) })]),
  manejar: async (c) => {
    if ("estandar" in c.cuerpo) return { creados: await crearInsumosEstandar(c.db, c.sesion!, c.ahora) };
    return { id: await guardarInsumo(c.db, c.sesion!, null, c.cuerpo.insumo, c.ahora) };
  },
});
