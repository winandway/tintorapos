import { z } from "zod";
import { crearGasto, esquemaGasto, listarGastos } from "@/server/contabilidad";
import { ruta } from "@/server/ruta";
import { rangoDe } from "../_rango";

export const GET = ruta({
  acceso: "sesion",
  permiso: "contabilidad.ver",
  manejar: async (c) => {
    const [desde, hasta] = rangoDe(c.req.url, c.sesion!, c.ahora);
    const u = new URL(c.req.url).searchParams;
    return listarGastos(c.db, c.sesion!.tintoreria.id, {
      desde,
      hasta,
      categoria: u.get("categoria") ?? undefined,
      proveedorId: u.get("proveedor") ?? undefined,
    });
  },
});

export const POST = ruta({
  acceso: "sesion",
  permiso: "contabilidad.gestionar",
  cuerpo: z.object({ gasto: esquemaGasto }),
  manejar: async (c) => ({ id: await crearGasto(c.db, c.sesion!, c.cuerpo.gasto, c.ahora) }),
});
