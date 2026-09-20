import type { Variables } from "@/env";
import { nuevoId } from "@/lib/codigos";
import type { Idioma } from "@/lib/i18n";
import { enviarCorreo } from "@/server/correo";

/**
 * El formulario de contacto del sitio. El mensaje se GUARDA siempre (así no se
 * pierde aunque el correo falle o no haya buzón de soporte configurado) y, si
 * hay `SUPPORT_EMAIL`, además se manda por correo con el remitente del sitio y
 * `reply_to` de quien escribe.
 */
export interface MensajeContacto {
  nombre: string;
  correo: string;
  asunto?: string;
  mensaje: string;
}

export async function guardarMensaje(
  db: D1Database,
  vars: Variables,
  m: MensajeContacto,
  idioma: Idioma,
  ipHash: string,
  ahora = Date.now(),
): Promise<{ id: string; enviado: boolean }> {
  const id = nuevoId();
  await db
    .prepare(
      `insert into mensajes_contacto /* global: mensajes del sitio, no de una tintorería */
         (id, nombre, correo, asunto, mensaje, idioma, ip_hash, creado_en)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, m.nombre, m.correo, m.asunto ?? null, m.mensaje, idioma, ipHash, ahora)
    .run();

  if (!vars.SUPPORT_EMAIL) return { id, enviado: false };
  const r = await enviarCorreo(
    { ...vars, SUPPORT_EMAIL: m.correo },
    {
      para: vars.SUPPORT_EMAIL,
      asunto: `Tintora POS · ${m.asunto?.trim() || "Mensaje del sitio"} — ${m.nombre}`,
      texto: [`De: ${m.nombre} <${m.correo}>`, `Idioma: ${idioma}`, "", m.mensaje, "", `Mensaje ${id}`].join(
        "\n",
      ),
    },
    db,
  );
  const enviado = r.estado === "enviado";
  if (enviado)
    await db
      .prepare("update mensajes_contacto /* global: mensajes del sitio */ set enviado_en = ? where id = ?")
      .bind(ahora, id)
      .run();
  return { id, enviado };
}
