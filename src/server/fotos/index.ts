import { nuevoId } from "@/lib/codigos";
import { sentenciaAuditoria } from "@/server/auditoria";
import type { Sesion } from "@/server/auth/sesiones";
import { ErrorApp, noEncontrado } from "@/server/errores";

export const TAMANO_MAX_FOTO = 5 * 1024 * 1024;

/** Tipo real de la imagen por sus primeros bytes (no se confía en lo que dice el navegador). */
export function tipoImagen(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return { mime: "image/jpeg", ext: "jpg" };
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b))
    return { mime: "image/png", ext: "png" };
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

export async function guardarFoto(
  db: D1Database,
  bucket: R2Bucket,
  s: Sesion,
  datos: { ordenId: string; prendaId: string | null; bytes: Uint8Array; id?: string },
  ahora = Date.now(),
): Promise<string> {
  if (datos.bytes.length > TAMANO_MAX_FOTO) throw new ErrorApp(413, "archivo_grande", { mb: 5 });
  const tipo = tipoImagen(datos.bytes);
  if (!tipo) throw new ErrorApp(400, "tipo_archivo");
  const orden = await db
    .prepare("select id from ordenes where tintoreria_id = ? and id = ?")
    .bind(s.tintoreria.id, datos.ordenId)
    .first();
  if (!orden) throw noEncontrado();
  if (datos.prendaId) {
    const p = await db
      .prepare("select id from orden_prendas where tintoreria_id = ? and orden_id = ? and id = ?")
      .bind(s.tintoreria.id, datos.ordenId, datos.prendaId)
      .first();
    if (!p) throw noEncontrado();
  }
  const id = datos.id ?? nuevoId();
  const ya = await db
    .prepare("select id from fotos where tintoreria_id = ? and id = ?")
    .bind(s.tintoreria.id, id)
    .first();
  if (ya) return id;
  const clave = `fotos/${s.tintoreria.id}/${datos.ordenId}/${id}.${tipo.ext}`;
  await bucket.put(clave, datos.bytes, { httpMetadata: { contentType: tipo.mime } });
  try {
    await db.batch([
      db
        .prepare(
          "insert into fotos (id, tintoreria_id, orden_id, prenda_id, clave_objeto, bytes, tipo, creado_por, creado_en) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          id,
          s.tintoreria.id,
          datos.ordenId,
          datos.prendaId,
          clave,
          datos.bytes.length,
          tipo.mime,
          s.usuario.id,
          ahora,
        ),
      db
        .prepare("update ordenes set actualizada_en = ? where tintoreria_id = ? and id = ?")
        .bind(ahora, s.tintoreria.id, datos.ordenId),
    ]);
  } catch (e) {
    await bucket.delete(clave);
    if (e instanceof Error && /UNIQUE|PRIMARY/i.test(e.message)) throw new ErrorApp(409, "conflicto");
    throw e;
  }
  return id;
}

export async function leerFoto(
  db: D1Database,
  bucket: R2Bucket,
  tintoreriaId: string,
  id: string,
): Promise<R2ObjectBody> {
  const f = await db
    .prepare("select clave_objeto from fotos where tintoreria_id = ? and id = ?")
    .bind(tintoreriaId, id)
    .first<{ clave_objeto: string }>();
  if (!f) throw noEncontrado();
  // Defensa extra: la clave siempre empieza por la carpeta de la tintorería.
  if (!f.clave_objeto.startsWith(`fotos/${tintoreriaId}/`)) throw noEncontrado();
  const objeto = await bucket.get(f.clave_objeto);
  if (!objeto) throw noEncontrado();
  return objeto;
}

export async function borrarFoto(
  db: D1Database,
  bucket: R2Bucket,
  s: Sesion,
  id: string,
  ahora = Date.now(),
): Promise<void> {
  const f = await db
    .prepare("select clave_objeto, orden_id from fotos where tintoreria_id = ? and id = ?")
    .bind(s.tintoreria.id, id)
    .first<{ clave_objeto: string; orden_id: string }>();
  if (!f) throw noEncontrado();
  await db.batch([
    db.prepare("delete from fotos where tintoreria_id = ? and id = ?").bind(s.tintoreria.id, id),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        dispositivoId: s.dispositivoId,
        accion: "foto.borrada",
        entidad: "orden",
        entidadId: f.orden_id,
        detalle: { fotoId: id },
      },
      ahora,
    ),
  ]);
  await bucket.delete(f.clave_objeto);
}
