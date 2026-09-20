import { listarTickets } from "@/server/soporte/tickets";
import { ruta } from "@/server/ruta";
import { exigirAdmin } from "../_admin";

export const GET = ruta({
  acceso: "sesion",
  manejar: async (c) => {
    exigirAdmin(c);
    const estado = new URL(c.req.url).searchParams.get("estado");
    return {
      tickets: await listarTickets(c.db, {
        estado: estado === "abierto" || estado === "respondido" || estado === "cerrado" ? estado : "todos",
      }),
    };
  },
});
