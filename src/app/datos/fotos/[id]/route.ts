import { borrarFoto } from "@/server/fotos";
import { ruta } from "@/server/ruta";

/** Borrar una foto (evidencia de daños): solo gerente o dueño, dentro del menú de 3 puntos. */
export const DELETE = ruta({
  acceso: "sesion",
  permiso: "ordenes.anular",
  manejar: async (c) => {
    await borrarFoto(c.db, c.env.BUCKET, c.sesion!, c.params.id ?? "", c.ahora);
    return { ok: true };
  },
});
