import { ruta } from "@/server/ruta";

/** Gerentes y dueños con PIN que pueden autorizar una acción en esta tintorería. */
export const GET = ruta({
  acceso: "sesion",
  manejar: async (c) => {
    const { results } = await c.db
      .prepare(
        `select id, nombre, rol from usuarios
         where tintoreria_id = ? and activo = 1 and pin_hash is not null and rol in ('dueno', 'gerente')
         order by rol desc, nombre`,
      )
      .bind(c.sesion!.tintoreria.id)
      .all<{ id: string; nombre: string; rol: string }>();
    return { autorizadores: results };
  },
});
