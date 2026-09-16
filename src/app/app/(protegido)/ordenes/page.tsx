import { ListaOrdenes } from "@/components/ordenes/lista-ordenes";
import { exigirSesion } from "@/server/pagina";
import { tienePermiso } from "@/server/permisos";

export default async function PaginaOrdenes() {
  const { sesion } = await exigirSesion("ordenes.ver");
  return (
    <ListaOrdenes
      moneda={sesion.tintoreria.moneda}
      zona={sesion.tintoreria.zonaHoraria}
      montos={tienePermiso(sesion.usuario.rol, "ordenes.ver_montos")}
    />
  );
}
