import { PantallaReportes } from "@/components/reportes/pantalla-reportes";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaReportes() {
  const { sesion } = await exigirSesion("reportes.ver");
  return <PantallaReportes moneda={sesion.tintoreria.moneda} zona={sesion.tintoreria.zonaHoraria} />;
}
