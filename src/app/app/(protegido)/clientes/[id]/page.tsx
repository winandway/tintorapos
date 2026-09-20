import { FichaCliente } from "@/components/clientes/ficha-cliente";
import { exigirSesion } from "@/server/pagina";
import { usuarioPuede } from "@/server/permisos";

export default async function PaginaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sesion } = await exigirSesion("clientes.ver");
  return (
    <FichaCliente
      id={id}
      moneda={sesion.tintoreria.moneda}
      zona={sesion.tintoreria.zonaHoraria}
      puedeEditar={usuarioPuede(sesion.usuario, "clientes.editar")}
      puedeEliminar={usuarioPuede(sesion.usuario, "clientes.eliminar")}
      puedeCrearOrden={usuarioPuede(sesion.usuario, "ordenes.crear")}
    />
  );
}
