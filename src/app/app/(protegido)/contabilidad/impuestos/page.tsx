import { PantallaImpuestos } from "@/components/contabilidad/pantalla-impuestos";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaImpuestos() {
  const { sesion } = await exigirSesion("contabilidad.ver");
  return <PantallaImpuestos moneda={sesion.tintoreria.moneda} />;
}
