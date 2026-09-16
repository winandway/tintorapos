import { noEncontrado } from "@/server/errores";
import { buscarPorCodigo } from "@/server/ordenes/consultas";
import { ruta } from "@/server/ruta";

/** Lo que lee el escáner (QR del ticket, de la etiqueta o el número) → orden. */
export const GET = ruta({
  acceso: "sesion",
  permiso: "ordenes.ver",
  manejar: async (c) => {
    const codigo = new URL(c.req.url).searchParams.get("codigo") ?? "";
    const r = await buscarPorCodigo(c.db, c.sesion!.tintoreria.id, codigo.slice(0, 200));
    if (!r) throw noEncontrado();
    return r;
  },
});
