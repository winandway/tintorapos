import type { Variables } from "@/env";
import type { Idioma } from "@/lib/i18n";
import { abrirTicket } from "@/server/soporte/tickets";

/**
 * El formulario de contacto del sitio abre un BILLETE de soporte: se guarda
 * siempre (aunque el correo falle), llega el aviso al correo de soporte y se
 * responde desde el panel de Windoce, que le manda el correo al cliente.
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
): Promise<{ id: string; numero: number; enviado: boolean }> {
  const r = await abrirTicket(
    db,
    vars,
    { nombre: m.nombre, correo: m.correo, asunto: m.asunto ?? null, mensaje: m.mensaje },
    idioma,
    ipHash,
    ahora,
  );
  return { id: r.id, numero: r.numero, enviado: r.avisado };
}
