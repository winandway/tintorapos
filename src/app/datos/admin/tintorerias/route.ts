import { listarTintorerias } from "@/server/admin";
import { ruta } from "@/server/ruta";
import { exigirAdmin } from "../_admin";

export const GET = ruta({
  acceso: "sesion",
  manejar: async (c) => {
    exigirAdmin(c);
    const u = new URL(c.req.url).searchParams;
    return { tintorerias: await listarTintorerias(c.db, { q: u.get("q") ?? undefined }, c.ahora) };
  },
});
