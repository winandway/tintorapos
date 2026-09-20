import { z } from "zod";
import { editarGasto, eliminarGasto, esquemaGasto } from "@/server/contabilidad";
import { ruta } from "@/server/ruta";

export const PUT = ruta({
  acceso: "sesion",
  permiso: "contabilidad.gestionar",
  cuerpo: z.object({ gasto: esquemaGasto }),
  manejar: async (c) => {
    await editarGasto(c.db, c.sesion!, c.params.id ?? "", c.cuerpo.gasto, c.ahora);
    return { ok: true };
  },
});

export const DELETE = ruta({
  acceso: "sesion",
  permiso: "contabilidad.gestionar",
  manejar: async (c) => {
    await eliminarGasto(c.db, c.sesion!, c.params.id ?? "", c.ahora);
    return { ok: true };
  },
});
