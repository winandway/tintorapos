import { z } from "zod";
import { crearCompra, esquemaCompra, listarCompras } from "@/server/contabilidad";
import { ruta } from "@/server/ruta";
import { rangoDe } from "../_rango";

export const GET = ruta({
  acceso: "sesion",
  permiso: "contabilidad.ver",
  manejar: async (c) => {
    const [desde, hasta] = rangoDe(c.req.url, c.sesion!, c.ahora);
    const u = new URL(c.req.url).searchParams;
    return listarCompras(c.db, c.sesion!.tintoreria.id, {
      desde,
      hasta,
      proveedorId: u.get("proveedor") ?? undefined,
      soloPendientes: u.get("pendientes") === "1",
    });
  },
});

export const POST = ruta({
  acceso: "sesion",
  permiso: "contabilidad.gestionar",
  cuerpo: z.object({ compra: esquemaCompra }),
  manejar: async (c) => crearCompra(c.db, c.sesion!, c.cuerpo.compra, c.ahora),
});
