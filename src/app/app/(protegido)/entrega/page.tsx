import { PantallaEntrega } from "@/components/entrega/pantalla-entrega";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaEntrega() {
  const { sesion } = await exigirSesion("ordenes.entregar");
  return <PantallaEntrega moneda={sesion.tintoreria.moneda} zona={sesion.tintoreria.zonaHoraria} />;
}
