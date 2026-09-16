import { PantallaProduccion } from "@/components/produccion/pantalla-produccion";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaProduccion() {
  const { sesion } = await exigirSesion("ordenes.cambiar_estado");
  return <PantallaProduccion zona={sesion.tintoreria.zonaHoraria} />;
}
