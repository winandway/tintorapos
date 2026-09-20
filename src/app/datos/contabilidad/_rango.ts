import { fechaLocal } from "@/lib/fechas";
import { ErrorApp } from "@/server/errores";
import { rangoPreset } from "@/server/reportes";
import type { Sesion } from "@/server/auth/sesiones";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** El rango de fechas que pide la pantalla, en la zona horaria de la tienda. */
export function rangoDe(url: string, sesion: Sesion, ahora: number): [string, string, string] {
  const u = new URL(url).searchParams;
  const hoy = fechaLocal(ahora, sesion.tintoreria.zonaHoraria);
  let [desde, hasta] = rangoPreset(u.get("preset") ?? "mes", hoy);
  if (u.get("desde") || u.get("hasta")) {
    desde = u.get("desde") ?? "";
    hasta = u.get("hasta") ?? "";
    if (!FECHA.test(desde) || !FECHA.test(hasta) || desde > hasta) throw new ErrorApp(400, "datos_invalidos");
  }
  return [desde, hasta, hoy];
}
