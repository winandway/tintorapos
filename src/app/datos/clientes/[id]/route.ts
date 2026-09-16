import { editarCliente, eliminarCliente, esquemaCliente, verCliente } from "@/server/clientes";
import { sinPermiso } from "@/server/errores";
import { tienePermiso } from "@/server/permisos";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "clientes.ver",
  manejar: async (c) => {
    const ficha = await verCliente(c.db, c.sesion!.tintoreria.id, c.params.id ?? "");
    // Quien no ve montos (planta) no recibe saldos ni totales.
    if (!tienePermiso(c.sesion!.usuario.rol, "ordenes.ver_montos")) throw sinPermiso();
    return { cliente: ficha };
  },
});

export const PUT = ruta({
  acceso: "sesion",
  permiso: "clientes.editar",
  cuerpo: esquemaCliente,
  manejar: async (c) => {
    await editarCliente(c.db, c.sesion!, c.params.id ?? "", c.cuerpo, c.ahora);
    return { ok: true };
  },
});

export const DELETE = ruta({
  acceso: "sesion",
  permiso: "clientes.eliminar",
  manejar: async (c) => {
    await eliminarCliente(c.db, c.sesion!, c.params.id ?? "", c.ahora);
    return { ok: true };
  },
});
