import { PantallaGanancia } from "@/components/contabilidad/pantalla-ganancia";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaGanancia() {
  const { sesion } = await exigirSesion("contabilidad.ver");
  return <PantallaGanancia moneda={sesion.tintoreria.moneda} />;
}
