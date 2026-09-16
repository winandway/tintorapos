import { z } from "zod";
import { esquemaAutorizacion } from "@/server/caja";
import { marcarAbandonada } from "@/server/ordenes/acciones";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "sesion",
  permiso: "ordenes.entregar",
  cuerpo: z.object({ autorizacion: esquemaAutorizacion.optional() }),
  manejar: async (c) => {
    await marcarAbandonada(c.db, c.sesion!, c.params.id ?? "", c.cuerpo.autorizacion, c.ahora);
    return { ok: true };
  },
});
