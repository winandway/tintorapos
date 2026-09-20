import { renderSVG } from "uqr";
import { sentenciaAuditoria } from "@/server/auditoria";
import { ErrorApp } from "@/server/errores";
import { cifrarTexto, descifrarTexto } from "./cifrado";
import type { Sesion } from "./sesiones";
import {
  desfaseDeReloj,
  hashRespaldo,
  nuevoSecretoTotp,
  nuevosCodigosRespaldo,
  uriOtpauth,
  verificarTotp,
  VENTANA_ACTIVAR,
} from "./totp";

const PROPOSITO = "totp";

/**
 * Cuando un código no entra, se mira si es bueno pero de otro minuto: eso es un
 * reloj de celular corrido, y la persona tiene que saberlo. Decirle «el código
 * no es correcto» cuando lo que está mal es la hora la deja dando vueltas para
 * siempre (le pasó a un dueño de verdad el 19 de septiembre de 2026).
 */
async function fallarConDiagnostico(secreto: string, codigo: string, ahora: number): Promise<never> {
  const minutos = await desfaseDeReloj(secreto, codigo, ahora);
  if (minutos !== null && minutos !== 0)
    throw new ErrorApp(400, "reloj_desfasado", { minutos: Math.abs(minutos) }, { codigo: "invalido" });
  throw new ErrorApp(400, "codigo_incorrecto", {}, { codigo: "invalido" });
}

interface FilaTotp {
  correo: string | null;
  totp_secreto: string | null;
  totp_activo: number;
  totp_ultimo_paso: number | null;
  codigos_respaldo: string;
}

async function filaTotp(db: D1Database, s: Sesion): Promise<FilaTotp> {
  const f = await db
    .prepare(
      "select correo, totp_secreto, totp_activo, totp_ultimo_paso, codigos_respaldo from usuarios where id = ? and tintoreria_id = ?",
    )
    .bind(s.usuario.id, s.tintoreria.id)
    .first<FilaTotp>();
  if (!f) throw new ErrorApp(401, "no_autenticado");
  return f;
}

/**
 * Devuelve el QR para la app autenticadora.
 *
 * CANDADO: mientras los dos pasos no estén activos se CONSERVA el secreto que
 * ya se generó. Antes se creaba uno nuevo en cada visita: quien escaneaba el
 * código, recargaba la página y volvía, se quedaba con una app que generaba
 * códigos de un secreto muerto y el sistema le decía «el código no es
 * correcto» para siempre. Con `regenerar: true` se empieza de cero a propósito.
 */
export async function iniciarDosPasos(
  db: D1Database,
  appSecret: string,
  s: Sesion,
  opciones: { regenerar?: boolean } = {},
) {
  const f = await filaTotp(db, s);
  if (f.totp_activo) throw new ErrorApp(409, "no_aplica");
  const guardado = f.totp_secreto
    ? await descifrarTexto(appSecret, PROPOSITO, f.totp_secreto).catch(() => null)
    : null;
  const secreto = !opciones.regenerar && guardado ? guardado : nuevoSecretoTotp();
  if (secreto !== guardado)
    await db
      .prepare("update usuarios set totp_secreto = ?, actualizado_en = ? where id = ? and tintoreria_id = ?")
      .bind(await cifrarTexto(appSecret, PROPOSITO, secreto), Date.now(), s.usuario.id, s.tintoreria.id)
      .run();
  const uri = uriOtpauth(secreto, f.correo ?? s.usuario.nombre);
  return {
    secreto: secreto.match(/.{1,4}/g)?.join(" ") ?? secreto,
    uri,
    qrSvg: renderSVG(uri, { border: 2, pixelSize: 6, ecc: "M" }),
  };
}

async function secretoDe(appSecret: string, f: FilaTotp): Promise<string> {
  if (!f.totp_secreto) throw new ErrorApp(409, "no_aplica");
  const secreto = await descifrarTexto(appSecret, PROPOSITO, f.totp_secreto);
  if (!secreto) throw new ErrorApp(500, "configuracion");
  return secreto;
}

/** Confirma el primer código, activa los dos pasos y entrega los códigos de respaldo (una sola vez). */
export async function activarDosPasos(
  db: D1Database,
  appSecret: string,
  s: Sesion,
  codigo: string,
  ahora = Date.now(),
) {
  const f = await filaTotp(db, s);
  if (f.totp_activo) throw new ErrorApp(409, "no_aplica");
  const secreto = await secretoDe(appSecret, f);
  const paso = await verificarTotp(secreto, codigo, ahora, null, VENTANA_ACTIVAR);
  if (paso === null) await fallarConDiagnostico(secreto, codigo, ahora);
  const codigos = nuevosCodigosRespaldo();
  const hashes = await Promise.all(codigos.map(hashRespaldo));
  await db.batch([
    db
      .prepare(
        `update usuarios set totp_activo = 1, totp_ultimo_paso = ?, codigos_respaldo = ?, actualizado_en = ?
         where id = ? and tintoreria_id = ?`,
      )
      .bind(paso!, JSON.stringify(hashes), ahora, s.usuario.id, s.tintoreria.id),
    db
      .prepare("update sesiones set segundo_factor_ok = 1 where id_hash = ? and tintoreria_id = ?")
      .bind(s.idHash, s.tintoreria.id),
    sentenciaAuditoria(
      db,
      { tintoreriaId: s.tintoreria.id, usuarioId: s.usuario.id, accion: "seguridad.dos_pasos_activado" },
      ahora,
    ),
  ]);
  return { codigosRespaldo: codigos };
}

/** Verifica el código de la app o un código de respaldo (que se gasta). */
export async function verificarDosPasos(
  db: D1Database,
  appSecret: string,
  s: Sesion,
  entrada: { codigo?: string; respaldo?: string },
  ahora = Date.now(),
) {
  const f = await filaTotp(db, s);
  if (!f.totp_activo) throw new ErrorApp(409, "no_aplica");
  const sentencias: D1PreparedStatement[] = [];
  let metodo: "app" | "respaldo";
  if (entrada.respaldo) {
    const hash = await hashRespaldo(entrada.respaldo);
    const lista = JSON.parse(f.codigos_respaldo) as string[];
    if (!lista.includes(hash)) throw new ErrorApp(400, "codigo_incorrecto", {}, { respaldo: "invalido" });
    sentencias.push(
      db
        .prepare("update usuarios set codigos_respaldo = ? where id = ? and tintoreria_id = ?")
        .bind(JSON.stringify(lista.filter((h) => h !== hash)), s.usuario.id, s.tintoreria.id),
    );
    metodo = "respaldo";
  } else {
    const secreto = await secretoDe(appSecret, f);
    const paso = await verificarTotp(secreto, entrada.codigo ?? "", ahora, f.totp_ultimo_paso);
    if (paso === null) await fallarConDiagnostico(secreto, entrada.codigo ?? "", ahora);
    sentencias.push(
      db
        .prepare("update usuarios set totp_ultimo_paso = ? where id = ? and tintoreria_id = ?")
        .bind(paso!, s.usuario.id, s.tintoreria.id),
    );
    metodo = "app";
  }
  sentencias.push(
    db
      .prepare("update sesiones set segundo_factor_ok = 1 where id_hash = ? and tintoreria_id = ?")
      .bind(s.idHash, s.tintoreria.id),
    sentenciaAuditoria(
      db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        accion: "sesion.dos_pasos",
        detalle: { metodo },
      },
      ahora,
    ),
  );
  await db.batch(sentencias);
  const restantes = metodo === "respaldo" ? (JSON.parse(f.codigos_respaldo) as string[]).length - 1 : null;
  return { ok: true, respaldosRestantes: restantes };
}

/** Genera códigos de respaldo nuevos (invalida los anteriores). Pide un código actual de la app. */
export async function regenerarRespaldos(
  db: D1Database,
  appSecret: string,
  s: Sesion,
  codigo: string,
  ahora = Date.now(),
) {
  const f = await filaTotp(db, s);
  if (!f.totp_activo) throw new ErrorApp(409, "no_aplica");
  const secretoActual = await secretoDe(appSecret, f);
  const paso = await verificarTotp(secretoActual, codigo, ahora, f.totp_ultimo_paso);
  if (paso === null) await fallarConDiagnostico(secretoActual, codigo, ahora);
  const codigos = nuevosCodigosRespaldo();
  await db.batch([
    db
      .prepare(
        "update usuarios set codigos_respaldo = ?, totp_ultimo_paso = ? where id = ? and tintoreria_id = ?",
      )
      .bind(
        JSON.stringify(await Promise.all(codigos.map(hashRespaldo))),
        paso,
        s.usuario.id,
        s.tintoreria.id,
      ),
    sentenciaAuditoria(
      db,
      { tintoreriaId: s.tintoreria.id, usuarioId: s.usuario.id, accion: "seguridad.respaldos_regenerados" },
      ahora,
    ),
  ]);
  return { codigosRespaldo: codigos };
}
