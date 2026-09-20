import { z } from "zod";
import { eliminarProveedor, esquemaProveedor, guardarProveedor } from "@/server/contabilidad";
import { ruta } from "@/server/ruta";

export const PUT = ruta({
  acceso: "sesion",
  permiso: "contabilidad.gestionar",
  cuerpo: z.object({ proveedor: esquemaProveedor }),
  manejar: async (c) => {
    await guardarProveedor(c.db, c.sesion!, c.params.id ?? "", c.cuerpo.proveedor, c.ahora);
    return { ok: true };
  },
});

export const DELETE = ruta({
  acceso: "sesion",
  permiso: "contabilidad.gestionar",
  manejar: async (c) => {
    await eliminarProveedor(c.db, c.sesion!, c.params.id ?? "", c.ahora);
    return { ok: true };
  },
});
