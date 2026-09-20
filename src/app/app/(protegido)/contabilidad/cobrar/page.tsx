import { PantallaCobrar } from "@/components/contabilidad/pantalla-cobrar";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaCobrar() {
  const { sesion } = await exigirSesion("contabilidad.ver");
  return <PantallaCobrar moneda={sesion.tintoreria.moneda} />;
}
