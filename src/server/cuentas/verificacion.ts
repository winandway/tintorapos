/**
 * Verificación del correo. Al registrarse se manda un enlace; mientras no se
 * toque, el panel lo recuerda. Sirve para dos cosas: que el dueño no se quede
 * fuera por haber escrito mal su correo, y que la recuperación de contraseña
 * llegue a una dirección que existe de verdad.
 */
import type { Variables } from "@/env";
import { sha256Hex, tokenSecreto } from "@/lib/codigos";
import { diccionario, fmt, type Idioma } from "@/lib/i18n";
import { sentenciaAuditoria } from "@/server/auditoria";
import { enviarCorreo } from "@/server/correo";

export const VIGENCIA_VERIFICACION_MS = 7 * 24 * 3600_000;

export interface EstadoVerificacion {
  correo: string | null;
  verificado: boolean;
}

/** Guarda el token (cifrado) y manda el correo. No falla si el correo no sale. */
export async function pedirVerificacion(
  db: D1Database,
  vars: Variables,
  u: { id: string; tintoreriaId: string; nombre: string; correo: string },
  idioma: Idioma,
  ahora = Date.now(),
): Promise<void> {
  const token = tokenSecreto();
  await db
    .prepare(
      `insert into verificacion_correo (usuario_id, tintoreria_id, correo, hash, creado_en, expira_en, verificado_en)
       values (?, ?, ?, ?, ?, ?, null)
       on conflict (usuario_id) do update set correo = excluded.correo, hash = excluded.hash,
         creado_en = excluded.creado_en, expira_en = excluded.expira_en, verificado_en = null`,
    )
    .bind(u.id, u.tintoreriaId, u.correo, await sha256Hex(token), ahora, ahora + VIGENCIA_VERIFICACION_MS)
    .run();
  const d = diccionario(idioma).correos;
  const enlace = `${vars.APP_URL}/entrar/verificar?token=${encodeURIComponent(token)}`;
  await enviarCorreo(
    vars,
    {
      para: u.correo,
      asunto: d.verificarAsunto,
      texto: fmt(d.verificarTexto, { nombre: u.nombre, enlace }),
    },
    db,
  );
}

/** Marca el correo como verificado. Devuelve false si el enlace ya no sirve. */
export async function verificarCorreo(db: D1Database, token: string, ahora = Date.now()): Promise<boolean> {
  if (!token || token.length < 20 || token.length > 200) return false;
  const hash = await sha256Hex(token);
  const f = await db
    .prepare(
      `select usuario_id, tintoreria_id, expira_en, verificado_en from verificacion_correo
       /* token secreto: verificación de correo */ where hash = ?`,
    )
    .bind(hash)
    .first<{
      usuario_id: string;
      tintoreria_id: string;
      expira_en: number | null;
      verificado_en: number | null;
    }>();
  if (!f || f.verificado_en || !f.expira_en || ahora > f.expira_en) return false;
  await db.batch([
    db
      .prepare("update verificacion_correo set verificado_en = ?, hash = null where usuario_id = ?")
      .bind(ahora, f.usuario_id),
    sentenciaAuditoria(
      db,
      { tintoreriaId: f.tintoreria_id, usuarioId: f.usuario_id, accion: "seguridad.correo_verificado" },
      ahora,
    ),
  ]);
  return true;
}

/** Lo que necesita el panel para decidir si recuerda la verificación. */
export async function estadoVerificacion(
  db: D1Database,
  usuarioId: string,
  tintoreriaId: string,
): Promise<EstadoVerificacion> {
  const f = await db
    .prepare(
      "select correo, verificado_en from verificacion_correo where usuario_id = ? and tintoreria_id = ?",
    )
    .bind(usuarioId, tintoreriaId)
    .first<{ correo: string; verificado_en: number | null }>();
  return { correo: f?.correo ?? null, verificado: Boolean(f?.verificado_en) };
}
