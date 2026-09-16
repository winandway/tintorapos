import { restaurarCliente } from "@/server/clientes";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "sesion",
  permiso: "clientes.eliminar",
  manejar: async (c) => {
    await restaurarCliente(c.db, c.sesion!, c.params.id ?? "", c.ahora);
    return { ok: true };
  },
});
