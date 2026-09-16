import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "datos.exportar",
  manejar: async (c) => {
    const { results } = await c.db
      .prepare(
        "select id, bytes, filas, creado_en from respaldos where tintoreria_id = ? and borrado_en is null order by creado_en desc limit 40",
      )
      .bind(c.sesion!.tintoreria.id)
      .all();
    return { respaldos: results };
  },
});
