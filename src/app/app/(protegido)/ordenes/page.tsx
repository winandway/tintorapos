import { ListaOrdenes } from "@/components/ordenes/lista-ordenes";
import { exigirSesion } from "@/server/pagina";
import { usuarioPuede } from "@/server/permisos";

export default async function PaginaOrdenes() {
  const { sesion } = await exigirSesion("ordenes.ver");
  return (
    <ListaOrdenes
      moneda={sesion.tintoreria.moneda}
      zona={sesion.tintoreria.zonaHoraria}
      montos={usuarioPuede(sesion.usuario, "ordenes.ver_montos")}
    />
  );
}
