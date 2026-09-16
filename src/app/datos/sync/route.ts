import { ruta } from "@/server/ruta";
import { esquemaSync, sincronizar } from "@/server/sync";

/** Sube lo que el dispositivo hizo sin conexión (en orden e idempotente). */
export const POST = ruta({
  acceso: "sesion",
  cuerpo: esquemaSync,
  limite: { clave: (c) => `sync:${c.sesion?.usuario.id}`, max: 120, ventanaSeg: 60 },
  manejar: async (c) =>
    sincronizar(c.env, c.vars, c.sesion!, c.idioma, c.cuerpo.ops, c.esperarLuego, c.ahora),
});
