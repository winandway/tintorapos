import { DetalleOrden } from "@/components/ordenes/detalle-orden";
import { exigirSesion } from "@/server/pagina";
import { permisosDe } from "@/server/permisos";

export default async function PaginaOrden({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sesion } = await exigirSesion("ordenes.ver");
  return (
    <DetalleOrden
      id={id}
      moneda={sesion.tintoreria.moneda}
      zona={sesion.tintoreria.zonaHoraria}
      permisos={permisosDe(sesion.usuario.rol)}
    />
  );
}
