import { turnoAbierto } from "@/server/caja";
import { usuarioPuede } from "@/server/permisos";
import { ruta } from "@/server/ruta";

/**
 * ¿Hay caja abierta? Lo necesita quien cobra (entregar, mostrador), tenga o no
 * permiso de abrirla. Antes se preguntaba a /datos/caja, que exige «caja.abrir»:
 * a un repartidor le respondía 403 y la pantalla creía que la caja estaba
 * cerrada aunque estuviera abierta (candado B44).
 */
export const GET = ruta({
  acceso: "sesion",
  permiso: "pagos.cobrar",
  manejar: async (c) => {
    const s = c.sesion!;
    const turno = await turnoAbierto(c.db, s.tintoreria.id, s.sucursalId);
    return { abierta: Boolean(turno), puedeAbrir: usuarioPuede(s.usuario, "caja.abrir") };
  },
});
