import { ErrorApp } from "@/server/errores";
import { guardarFoto, TAMANO_MAX_FOTO } from "@/server/fotos";
import { ruta } from "@/server/ruta";

/** Sube la foto de una prenda (multipart: foto, ordenId, prendaId opcional, id opcional). */
export const POST = ruta({
  acceso: "sesion",
  permiso: "ordenes.crear",
  limite: { clave: (c) => `fotos:${c.sesion?.usuario.id}`, max: 120, ventanaSeg: 600 },
  manejar: async (c) => {
    const largo = Number(c.req.headers.get("content-length") ?? "0");
    if (largo > TAMANO_MAX_FOTO + 64_000) throw new ErrorApp(413, "archivo_grande", { mb: 5 });
    let formulario: FormData;
    try {
      formulario = await c.req.formData();
    } catch {
      throw new ErrorApp(400, "datos_invalidos");
    }
    const foto = formulario.get("foto");
    const ordenId = String(formulario.get("ordenId") ?? "");
    const prendaId = formulario.get("prendaId") ? String(formulario.get("prendaId")) : null;
    const id = formulario.get("id") ? String(formulario.get("id")) : undefined;
    if (!(foto instanceof Blob) || !ordenId || ordenId.length > 64 || (id && !/^[0-9a-f-]{36}$/.test(id))) {
      throw new ErrorApp(400, "datos_invalidos");
    }
    const bytes = new Uint8Array(await foto.arrayBuffer());
    return {
      id: await guardarFoto(c.db, c.env.BUCKET, c.sesion!, { ordenId, prendaId, bytes, id }, c.ahora),
    };
  },
});
