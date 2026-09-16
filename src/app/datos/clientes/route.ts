import { buscarClientes, crearCliente, esquemaCliente } from "@/server/clientes";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "clientes.ver",
  manejar: async (c) => {
    const url = new URL(c.req.url);
    const papelera = url.searchParams.get("papelera") === "1";
    return {
      clientes: await buscarClientes(c.db, c.sesion!.tintoreria.id, url.searchParams.get("q") ?? "", {
        papelera,
      }),
    };
  },
});

export const POST = ruta({
  acceso: "sesion",
  permiso: "clientes.editar",
  cuerpo: esquemaCliente,
  manejar: async (c) => ({ id: await crearCliente(c.db, c.sesion!, c.cuerpo, c.ahora) }),
});
