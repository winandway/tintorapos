import { esquemaReimpresion, registrarReimpresion } from "@/server/ordenes/acciones";
import { ruta } from "@/server/ruta";

export const POST = ruta({
  acceso: "sesion",
  permiso: "ordenes.ver",
  cuerpo: esquemaReimpresion,
  manejar: async (c) => {
    await registrarReimpresion(
      c.db,
      c.sesion!,
      c.params.id ?? "",
      c.cuerpo.tipo,
      c.cuerpo.autorizacion,
      c.ahora,
    );
    return { ok: true };
  },
});
