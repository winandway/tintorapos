import { z } from "zod";
import { cambiarEstadoEmpleado, editarEmpleado, esquemaEmpleado } from "@/server/empleados";
import { ruta } from "@/server/ruta";

export const PUT = ruta({
  acceso: "sesion",
  permiso: "empleados.gestionar",
  cuerpo: esquemaEmpleado,
  manejar: async (c) => {
    await editarEmpleado(c.db, c.sesion!, c.params.id ?? "", c.cuerpo, c.ahora);
    return { ok: true };
  },
});

/** Activar o desactivar (desactivar va en el menú de 3 puntos, con confirmación). */
export const PATCH = ruta({
  acceso: "sesion",
  permiso: "empleados.gestionar",
  cuerpo: z.object({ activo: z.boolean() }),
  manejar: async (c) => {
    await cambiarEstadoEmpleado(c.db, c.sesion!, c.params.id ?? "", c.cuerpo.activo, c.ahora);
    return { ok: true };
  },
});
