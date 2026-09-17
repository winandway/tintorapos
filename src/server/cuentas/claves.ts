import { sha256Hex, tokenSecreto } from "@/lib/codigos";
import { diccionario, fmt } from "@/lib/i18n";
import type { Idioma } from "@/lib/i18n/idiomas";
import type { Variables } from "@/env";
import { sentenciaAuditoria } from "@/server/auditoria";
import { hashClave, verificarClave } from "@/server/auth/claves";
import { cerrarSesionesUsuario, type Sesion } from "@/server/auth/sesiones";
import { enviarCorreo } from "@/server/correo";
import { ErrorApp } from "@/server/errores";
import { exigirClave } from "./validaciones";

export const VIGENCIA_RECUPERACION_MS = 60 * 60_000;

export async function cambiarClave(
  db: D1Database,
  s: Sesion,
  actual: string,
  nueva: string,
  ahora = Date.now(),
) {
  const f = await db
    .prepare("select clave_hash, correo from usuarios where id = ? and tintoreria_id = ?")
    .bind(s.usuario.id, s.tintoreria.id)
    .first<{ clave_hash: string | null; correo: string | null }>();
  if (!f || !(await verificarClave(actual, f.clave_hash))) {
    throw new ErrorApp(400, "credenciales", {}, { actual: "invalido" });
  }
  exigirClave(nueva, f.correo ?? undefined);
  await db.batch([
    db
      .prepare(
        "update usuarios set clave_hash = ?, debe_cambiar_clave = 0, actualizado_en = ? where id = ? and tintoreria_id = ?",
      )
      .bind(await hashClave(nueva), ahora, s.usuario.id, s.tintoreria.id),
    sentenciaAuditoria(
      db,
      { tintoreriaId: s.tintoreria.id, usuarioId: s.usuario.id, accion: "seguridad.clave_cambiada" },
      ahora,
    ),
  ]);
  // Las demás sesiones abiertas con la clave vieja se cierran.
  await cerrarSesionesUsuario(db, s.tintoreria.id, s.usuario.id, s.idHash);
}

/**
 * Pide el enlace para restablecer la contraseña. Responde IGUAL exista o no el
 * correo (no revela quién tiene cuenta).
 */
export async function solicitarRecuperacion(
  db: D1Database,
  env: CloudflareEnv,
  vars: Variables,
  correo: string,
  idioma: Idioma,
  ahora = Date.now(),
): Promise<void> {
  const u = await db
    .prepare(
      "select id, tintoreria_id, nombre from usuarios /* global: el correo de acceso es único */ where correo = ? and activo = 1 and rol in ('dueno', 'gerente')",
    )
    .bind(correo)
    .first<{ id: string; tintoreria_id: string; nombre: string }>();
  if (!u) return;
  const token = tokenSecreto();
  await db.batch([
    db
      .prepare(
        "insert into tokens_recuperacion (hash, tintoreria_id, usuario_id, creado_en, expira_en) values (?, ?, ?, ?, ?)",
      )
      .bind(await sha256Hex(token), u.tintoreria_id, u.id, ahora, ahora + VIGENCIA_RECUPERACION_MS),
    sentenciaAuditoria(
      db,
      { tintoreriaId: u.tintoreria_id, usuarioId: u.id, accion: "seguridad.recuperacion_pedida" },
      ahora,
    ),
  ]);
  const d = diccionario(idioma).correos;
  const enlace = `${vars.APP_URL}/entrar/restablecer?token=${encodeURIComponent(token)}`;
  await enviarCorreo(vars, {
    para: correo,
    asunto: d.recuperarAsunto,
    texto: fmt(d.recuperarTexto, { nombre: u.nombre, enlace }),
  });
}

export async function restablecerClave(db: D1Database, token: string, nueva: string, ahora = Date.now()) {
  const hash = await sha256Hex(token);
  const f = await db
    .prepare(
      `select r.tintoreria_id, r.usuario_id, r.expira_en, r.usado_en, u.correo
       from tokens_recuperacion r join usuarios u on u.id = r.usuario_id and u.tintoreria_id = r.tintoreria_id
       /* token secreto: enlace de recuperación */ where r.hash = ?`,
    )
    .bind(hash)
    .first<{
      tintoreria_id: string;
      usuario_id: string;
      expira_en: number;
      usado_en: number | null;
      correo: string | null;
    }>();
  if (!f || f.usado_en || f.expira_en <= ahora) throw new ErrorApp(400, "enlace_vencido");
  exigirClave(nueva, f.correo ?? undefined);
  await db.batch([
    db
      .prepare(
        "update usuarios set clave_hash = ?, debe_cambiar_clave = 0, actualizado_en = ? where id = ? and tintoreria_id = ?",
      )
      .bind(await hashClave(nueva), ahora, f.usuario_id, f.tintoreria_id),
    db
      .prepare("update tokens_recuperacion set usado_en = ? where hash = ? and tintoreria_id = ?")
      .bind(ahora, hash, f.tintoreria_id),
    sentenciaAuditoria(
      db,
      { tintoreriaId: f.tintoreria_id, usuarioId: f.usuario_id, accion: "seguridad.clave_restablecida" },
      ahora,
    ),
  ]);
  await cerrarSesionesUsuario(db, f.tintoreria_id, f.usuario_id);
}
