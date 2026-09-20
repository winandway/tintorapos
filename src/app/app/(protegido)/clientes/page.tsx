import { ListaClientes } from "@/components/clientes/lista-clientes";
import { exigirSesion } from "@/server/pagina";
import { usuarioPuede } from "@/server/permisos";

export default async function PaginaClientes() {
  const { sesion } = await exigirSesion("clientes.ver");
  return (
    <ListaClientes
      moneda={sesion.tintoreria.moneda}
      puedeEditar={usuarioPuede(sesion.usuario, "clientes.editar")}
      puedeEliminar={usuarioPuede(sesion.usuario, "clientes.eliminar")}
    />
  );
}
