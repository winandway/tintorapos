import { listarTurnos } from "@/server/caja";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "caja.ver_diferencias",
  manejar: async (c) => ({ turnos: await listarTurnos(c.db, c.sesion!.tintoreria.id) }),
});
