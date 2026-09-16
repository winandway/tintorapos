import { renderSVG } from "uqr";
import { sentenciaAuditoria } from "@/server/auditoria";
import { ErrorApp } from "@/server/errores";
import { cifrarTexto, descifrarTexto } from "./cifrado";
import type { Sesion } from "./sesiones";
import { hashRespaldo, nuevoSecretoTotp, nuevosCodigosRespaldo, uriOtpauth, verificarTotp } from "./totp";

const PROPOSITO = "totp";

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

/** Genera (o regenera mientras no esté activo) el secreto y devuelve el QR para la app autenticadora. */
export async function iniciarDosPasos(db: D1Database, appSecret: string, s: Sesion) {
  const f = await filaTotp(db, s);
  if (f.totp_activo) throw new ErrorApp(409, "no_aplica");
  const secreto = nuevoSecretoTotp();
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
  const paso = await verificarTotp(await secretoDe(appSecret, f), codigo, ahora, null);
  if (paso === null) throw new ErrorApp(400, "codigo_incorrecto", {}, { codigo: "invalido" });
  const codigos = nuevosCodigosRespaldo();
  const hashes = await Promise.all(codigos.map(hashRespaldo));
  await db.batch([
    db
      .prepare(
        `update usuarios set totp_activo = 1, totp_ultimo_paso = ?, codigos_respaldo = ?, actualizado_en = ?
         where id = ? and tintoreria_id = ?`,
      )
      .bind(paso, JSON.stringify(hashes), ahora, s.usuario.id, s.tintoreria.id),
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
    const paso = await verificarTotp(
      await secretoDe(appSecret, f),
      entrada.codigo ?? "",
      ahora,
      f.totp_ultimo_paso,
    );
    if (paso === null) throw new ErrorApp(400, "codigo_incorrecto", {}, { codigo: "invalido" });
    sentencias.push(
      db
        .prepare("update usuarios set totp_ultimo_paso = ? where id = ? and tintoreria_id = ?")
        .bind(paso, s.usuario.id, s.tintoreria.id),
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
  const paso = await verificarTotp(await secretoDe(appSecret, f), codigo, ahora, f.totp_ultimo_paso);
  if (paso === null) throw new ErrorApp(400, "codigo_incorrecto", {}, { codigo: "invalido" });
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
