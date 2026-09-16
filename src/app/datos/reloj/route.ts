import { correrReloj } from "@/server/reloj";
import { ruta } from "@/server/ruta";

/**
 * YaDominios Cloud no tiene tareas programadas: un Cron Trigger externo llama
 * aquí cada 5 minutos con «Authorization: Bearer RELOJ_SECRETO».
 */
export const POST = ruta({
  acceso: "reloj",
  csrf: false,
  manejar: async (c) => correrReloj(c.env, c.vars, c.ahora),
});
