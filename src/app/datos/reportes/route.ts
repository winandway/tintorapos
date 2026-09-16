import { fechaLocal } from "@/lib/fechas";
import { ErrorApp } from "@/server/errores";
import { aCsv } from "@/server/respaldos";
import { rangoPreset, reporteVentas } from "@/server/reportes";
import { ruta } from "@/server/ruta";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export const GET = ruta({
  acceso: "sesion",
  permiso: "reportes.ver",
  manejar: async (c) => {
    const u = new URL(c.req.url).searchParams;
    const s = c.sesion!;
    const hoy = fechaLocal(c.ahora, s.tintoreria.zonaHoraria);
    let [desde, hasta] = rangoPreset(u.get("preset") ?? "7", hoy);
    if (u.get("desde") || u.get("hasta")) {
      desde = u.get("desde") ?? "";
      hasta = u.get("hasta") ?? "";
      if (!FECHA.test(desde) || !FECHA.test(hasta) || desde > hasta)
        throw new ErrorApp(400, "datos_invalidos");
    }
    const r = await reporteVentas(c.db, s.tintoreria.id, desde, hasta);
    if (u.get("formato") === "csv") {
      return new Response(
        aCsv(
          r.porDia.map((d) => ({
            fecha: d.fecha,
            cobrado: (d.cobradoCents / 100).toFixed(2),
            ordenes: d.ordenes,
          })),
          ["fecha", "cobrado", "ordenes"],
        ),
        {
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": `attachment; filename="tintora-ventas-${desde}-${hasta}.csv"`,
            "cache-control": "no-store",
          },
        },
      );
    }
    return r;
  },
});
