import { encolarAvisos, procesarCola } from "@/server/avisos";
import { cambiarEstado, esquemaCambioEstado } from "@/server/ordenes/estados";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "sesion",
  permiso: "ordenes.cambiar_estado",
  cuerpo: esquemaCambioEstado,
  manejar: async (c) => {
    const ordenId = c.params.id ?? "";
    const r = await cambiarEstado(c.db, c.sesion!, ordenId, c.cuerpo, c.ahora);
    if (r.quedoLista) {
      const ids = await encolarAvisos(
        c.db,
        c.vars.APP_URL,
        { tintoreriaId: c.sesion!.tintoreria.id, ordenId, tipo: "lista" },
        c.ahora,
      );
      if (ids.length) c.esperarLuego(procesarCola(c.env, c.vars, { ids }));
    }
    return r;
  },
});
