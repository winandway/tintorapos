import { leerFoto } from "@/server/fotos";
import { ruta } from "@/server/ruta";

/** Sirve una foto solo a quien tiene sesión en la tintorería dueña de la foto. */
export const GET = ruta({
  acceso: "sesion",
  permiso: "ordenes.ver",
  manejar: async (c) => {
    const objeto = await leerFoto(c.db, c.env.BUCKET, c.sesion!.tintoreria.id, c.params.id ?? "");
    return new Response(objeto.body, {
      headers: {
        "content-type": objeto.httpMetadata?.contentType ?? "application/octet-stream",
        "cache-control": "private, max-age=86400",
        "x-content-type-options": "nosniff",
        "content-disposition": "inline",
      },
    });
  },
});
