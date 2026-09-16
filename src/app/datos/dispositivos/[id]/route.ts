import { revocarDispositivo } from "@/server/dispositivos";
import { ruta } from "@/server/ruta";

/** Desactivar un dispositivo (va dentro del menú de 3 puntos, con confirmación). */
export const DELETE = ruta({
  acceso: "sesion",
  permiso: "dispositivos.gestionar",
  manejar: async (c) => {
    await revocarDispositivo(c.db, c.sesion!, c.params.id ?? "", c.ahora);
    return { ok: true };
  },
});
