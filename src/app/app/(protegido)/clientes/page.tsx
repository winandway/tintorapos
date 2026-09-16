import { ListaClientes } from "@/components/clientes/lista-clientes";
import { exigirSesion } from "@/server/pagina";
import { tienePermiso } from "@/server/permisos";

export default async function PaginaClientes() {
  const { sesion } = await exigirSesion("clientes.ver");
  return (
    <ListaClientes
      moneda={sesion.tintoreria.moneda}
      puedeEditar={tienePermiso(sesion.usuario.rol, "clientes.editar")}
      puedeEliminar={tienePermiso(sesion.usuario.rol, "clientes.eliminar")}
    />
  );
}
