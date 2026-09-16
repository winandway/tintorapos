import { cambiarEstado, esquemaCambioEstado } from "@/server/ordenes/estados";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "sesion",
  permiso: "ordenes.cambiar_estado",
  cuerpo: esquemaCambioEstado,
  manejar: async (c) => cambiarEstado(c.db, c.sesion!, c.params.id ?? "", c.cuerpo, c.ahora),
});
