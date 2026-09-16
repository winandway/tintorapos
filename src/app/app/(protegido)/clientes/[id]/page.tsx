import { FichaCliente } from "@/components/clientes/ficha-cliente";
import { exigirSesion } from "@/server/pagina";
import { tienePermiso } from "@/server/permisos";

export default async function PaginaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sesion } = await exigirSesion("clientes.ver");
  return (
    <FichaCliente
      id={id}
      moneda={sesion.tintoreria.moneda}
      zona={sesion.tintoreria.zonaHoraria}
      puedeEditar={tienePermiso(sesion.usuario.rol, "clientes.editar")}
      puedeEliminar={tienePermiso(sesion.usuario.rol, "clientes.eliminar")}
      puedeCrearOrden={tienePermiso(sesion.usuario.rol, "ordenes.crear")}
    />
  );
}
