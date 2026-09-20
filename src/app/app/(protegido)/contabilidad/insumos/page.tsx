import { PantallaInsumos } from "@/components/contabilidad/pantalla-insumos";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaInsumos() {
  const { sesion } = await exigirSesion("contabilidad.ver");
  return <PantallaInsumos moneda={sesion.tintoreria.moneda} />;
}
