/**
 * Billetes de soporte. Todo lo que escribe alguien —desde el formulario del
 * sitio o desde la app— abre un billete que NO se pierde: se guarda en la base
 * aunque el correo falle. El aviso va al correo de soporte; la respuesta se
 * escribe desde el panel de Windoce y le llega al cliente por correo.
 */
import type { Variables } from "@/env";
import { nuevoId } from "@/lib/codigos";
import { diccionario, fmt, type Idioma } from "@/lib/i18n";
import { correoSoporte } from "@/lib/soporte";
import { enviarCorreo } from "@/server/correo";
import { noEncontrado } from "@/server/errores";

export interface NuevoTicket {
  nombre: string;
  correo: string;
  asunto?: string | null;
  mensaje: string;
  tintoreriaId?: string | null;
}

export interface Ticket {
  id: string;
  numero: number;
  nombre: string;
  correo: string;
  asunto: string | null;
  idioma: Idioma;
  estado: "abierto" | "respondido" | "cerrado";
  tintoreriaId: string | null;
  tintoreria?: string | null;
  creadoEn: number;
  ultimaRespuestaEn: number | null;
  mensajes?: MensajeTicket[];
}

export interface MensajeTicket {
  id: string;
  de: "cliente" | "soporte";
  cuerpo: string;
  autor: string | null;
  enviadoEn: number | null;
  error: string | null;
  creadoEn: number;
}

/** Abre el billete y avisa a soporte. Nunca lanza por culpa del correo. */
export async function abrirTicket(
  db: D1Database,
  vars: Variables,
  t: NuevoTicket,
  idioma: Idioma,
  ipHash: string,
  ahora = Date.now(),
): Promise<{ id: string; numero: number; avisado: boolean }> {
  const id = nuevoId();
  const fila = await db
    .prepare(
      "select coalesce(max(numero), 1000) + 1 as n from tickets /* global: los billetes son de Windoce */",
    )
    .first<{ n: number }>();
  const numero = fila?.n ?? 1001;
  await db.batch([
    db
      .prepare(
        `insert into tickets /* global: los billetes son de Windoce, no de una tintorería */
           (id, numero, nombre, correo, asunto, idioma, tintoreria_id, estado, ip_hash, creado_en, actualizado_en)
         values (?, ?, ?, ?, ?, ?, ?, 'abierto', ?, ?, ?)`,
      )
      .bind(
        id,
        numero,
        t.nombre,
        t.correo.toLowerCase(),
        t.asunto ?? null,
        idioma,
        t.tintoreriaId ?? null,
        ipHash,
        ahora,
        ahora,
      ),
    db
      .prepare(
        `insert into ticket_mensajes /* global: billetes de Windoce */
           (id, ticket_id, de, cuerpo, autor, creado_en) values (?, ?, 'cliente', ?, ?, ?)`,
      )
      .bind(nuevoId(), id, t.mensaje, t.nombre, ahora),
  ]);

  const r = await enviarCorreo(
    { ...vars, SUPPORT_EMAIL: t.correo },
    {
      para: correoSoporte(vars),
      asunto: `Tintora POS · billete #${numero} — ${t.asunto?.trim() || t.nombre}`,
      texto: [
        `Billete #${numero}`,
        `De: ${t.nombre} <${t.correo}>`,
        `Idioma: ${idioma}`,
        "",
        t.mensaje,
        "",
        `Respóndelo aquí: ${vars.APP_URL}/app/admin/tickets`,
      ].join("\n"),
    },
    db,
  );
  const avisado = r.estado === "enviado";
  if (avisado)
    await db
      .prepare(
        "update ticket_mensajes /* global: billetes de Windoce */ set enviado_en = ? where ticket_id = ? and de = 'cliente'",
      )
      .bind(ahora, id)
      .run();
  return { id, numero, avisado };
}

export interface FiltroTickets {
  estado?: "abierto" | "respondido" | "cerrado" | "todos";
  limite?: number;
}

export async function listarTickets(db: D1Database, f: FiltroTickets = {}): Promise<Ticket[]> {
  const estado = f.estado && f.estado !== "todos" ? f.estado : null;
  const { results } = await db
    .prepare(
      `select t.id, t.numero, t.nombre, t.correo, t.asunto, t.idioma, t.estado, t.tintoreria_id,
         t.creado_en, t.ultima_respuesta_en, ti.nombre as tintoreria
       from tickets t /* global: los billetes son de Windoce */
       left join tintorerias ti on ti.id = t.tintoreria_id
       where (?1 is null or t.estado = ?1)
       order by case t.estado when 'abierto' then 0 when 'respondido' then 1 else 2 end, t.creado_en desc
       limit ?2`,
    )
    .bind(estado, Math.min(200, f.limite ?? 100))
    .all<{
      id: string;
      numero: number;
      nombre: string;
      correo: string;
      asunto: string | null;
      idioma: Idioma;
      estado: Ticket["estado"];
      tintoreria_id: string | null;
      creado_en: number;
      ultima_respuesta_en: number | null;
      tintoreria: string | null;
    }>();
  return results.map((r) => ({
    id: r.id,
    numero: r.numero,
    nombre: r.nombre,
    correo: r.correo,
    asunto: r.asunto,
    idioma: r.idioma,
    estado: r.estado,
    tintoreriaId: r.tintoreria_id,
    tintoreria: r.tintoreria,
    creadoEn: r.creado_en,
    ultimaRespuestaEn: r.ultima_respuesta_en,
  }));
}

export async function verTicket(db: D1Database, id: string): Promise<Ticket> {
  const lista = await db
    .prepare(
      `select t.id, t.numero, t.nombre, t.correo, t.asunto, t.idioma, t.estado, t.tintoreria_id,
         t.creado_en, t.ultima_respuesta_en, ti.nombre as tintoreria
       from tickets t /* global: los billetes son de Windoce */
       left join tintorerias ti on ti.id = t.tintoreria_id where t.id = ?`,
    )
    .bind(id)
    .first<{
      id: string;
      numero: number;
      nombre: string;
      correo: string;
      asunto: string | null;
      idioma: Idioma;
      estado: Ticket["estado"];
      tintoreria_id: string | null;
      creado_en: number;
      ultima_respuesta_en: number | null;
      tintoreria: string | null;
    }>();
  if (!lista) throw noEncontrado();
  const { results } = await db
    .prepare(
      "select id, de, cuerpo, autor, enviado_en, error, creado_en from ticket_mensajes /* global: billetes de Windoce */ where ticket_id = ? order by creado_en",
    )
    .bind(id)
    .all<{
      id: string;
      de: "cliente" | "soporte";
      cuerpo: string;
      autor: string | null;
      enviado_en: number | null;
      error: string | null;
      creado_en: number;
    }>();
  return {
    id: lista.id,
    numero: lista.numero,
    nombre: lista.nombre,
    correo: lista.correo,
    asunto: lista.asunto,
    idioma: lista.idioma,
    estado: lista.estado,
    tintoreriaId: lista.tintoreria_id,
    tintoreria: lista.tintoreria,
    creadoEn: lista.creado_en,
    ultimaRespuestaEn: lista.ultima_respuesta_en,
    mensajes: results.map((m) => ({
      id: m.id,
      de: m.de,
      cuerpo: m.cuerpo,
      autor: m.autor,
      enviadoEn: m.enviado_en,
      error: m.error,
      creadoEn: m.creado_en,
    })),
  };
}

/**
 * Responde el billete: guarda la respuesta y se la manda al cliente por correo,
 * en SU idioma. Si el correo falla, la respuesta queda guardada con el error a
 * la vista (nunca se pierde en silencio).
 */
export async function responderTicket(
  db: D1Database,
  vars: Variables,
  id: string,
  cuerpo: string,
  autor: string,
  ahora = Date.now(),
): Promise<{ enviado: boolean; error: string | null }> {
  const t = await verTicket(db, id);
  const d = diccionario(t.idioma).correos;
  const r = await enviarCorreo(
    { ...vars, SUPPORT_EMAIL: correoSoporte(vars) },
    {
      para: t.correo,
      asunto: fmt(d.ticketAsunto, { numero: t.numero }),
      texto: [
        fmt(d.ticketHola, { nombre: t.nombre.split(/\s+/)[0] ?? t.nombre }),
        "",
        cuerpo,
        "",
        d.ticketPie,
      ].join("\n"),
    },
    db,
  );
  const enviado = r.estado === "enviado";
  const error = r.estado === "fallido" ? r.error : r.estado === "no_configurado" ? "no_configurado" : null;
  await db.batch([
    db
      .prepare(
        `insert into ticket_mensajes /* global: billetes de Windoce */
           (id, ticket_id, de, cuerpo, autor, enviado_en, error, creado_en) values (?, ?, 'soporte', ?, ?, ?, ?, ?)`,
      )
      .bind(nuevoId(), id, cuerpo, autor, enviado ? ahora : null, error, ahora),
    db
      .prepare(
        "update tickets /* global: billetes de Windoce */ set estado = 'respondido', ultima_respuesta_en = ?, actualizado_en = ? where id = ?",
      )
      .bind(ahora, ahora, id),
  ]);
  return { enviado, error };
}

export async function cambiarEstadoTicket(
  db: D1Database,
  id: string,
  estado: Ticket["estado"],
  ahora = Date.now(),
): Promise<void> {
  const r = await db
    .prepare(
      "update tickets /* global: billetes de Windoce */ set estado = ?, actualizado_en = ? where id = ?",
    )
    .bind(estado, ahora, id)
    .run();
  if (!r.meta.changes) throw noEncontrado();
}

export async function ticketsAbiertos(db: D1Database): Promise<number> {
  const f = await db
    .prepare("select count(*) as n from tickets /* global: billetes de Windoce */ where estado = 'abierto'")
    .first<{ n: number }>();
  return f?.n ?? 0;
}
