import { z } from "zod";
import { esquemaProveedor, guardarProveedor, listarProveedores } from "@/server/contabilidad";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "contabilidad.ver",
  manejar: async (c) => ({ proveedores: await listarProveedores(c.db, c.sesion!.tintoreria.id) }),
});

export const POST = ruta({
  acceso: "sesion",
  permiso: "contabilidad.gestionar",
  cuerpo: z.object({ proveedor: esquemaProveedor }),
  manejar: async (c) => ({
    id: await guardarProveedor(c.db, c.sesion!, null, c.cuerpo.proveedor, c.ahora),
  }),
});
