import { PantallaPendientes } from "@/components/app/pantalla-pendientes";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaPendientes() {
  const { sesion } = await exigirSesion();
  return <PantallaPendientes zona={sesion.tintoreria.zonaHoraria} />;
}
