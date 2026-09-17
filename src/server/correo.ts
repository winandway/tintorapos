/**
 * Correo saliente por la API de YaDominios Cloud («Correos desde tu dominio»):
 *   POST https://yapanel.yadominios.com/api/hosting/correo/enviar
 * con el token del sitio. Formato verificado en la guía oficial:
 * https://yadominios.com/docs/correos-desde-tu-dominio
 * (`reply_to` en texto plano, `text` siempre, remitente del dominio conectado al sitio).
 *
 * Requiere: dominio propio conectado al sitio, «Activar correos de mi dominio» en el
 * panel y las variables YADOMINIOS_TOKEN y EMAIL_FROM. Si falta algo NO se finge el
 * envío: devuelve «no_configurado» y el canario /datos/salud lo marca.
 */
import type { Variables } from "@/env";

export const URL_CORREO_YADOMINIOS = "https://yapanel.yadominios.com/api/hosting/correo/enviar";
export const SITIO_POR_DEFECTO = "tintorapos";

export interface Correo {
  para: string;
  asunto: string;
  texto: string;
  html?: string;
}

export type ResultadoCorreo =
  | { estado: "enviado" }
  | { estado: "no_configurado" }
  | { estado: "fallido"; error: string; reintentar: boolean };

export function correoConfigurado(vars: Variables): boolean {
  return Boolean(vars.YADOMINIOS_TOKEN && vars.EMAIL_FROM);
}

interface RespuestaCorreo {
  success?: boolean;
  error?: unknown;
  codigo?: unknown;
  code?: unknown;
  rebotados?: string[];
}

export async function enviarCorreo(vars: Variables, c: Correo): Promise<ResultadoCorreo> {
  if (!correoConfigurado(vars)) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[correo sin configurar] Para: ${c.para}\nAsunto: ${c.asunto}\n${c.texto}`);
    }
    return { estado: "no_configurado" };
  }
  let r: Response;
  try {
    r = await fetch(URL_CORREO_YADOMINIOS, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sitio: vars.YADOMINIOS_SITIO ?? SITIO_POR_DEFECTO,
        token: vars.YADOMINIOS_TOKEN,
        from: { address: vars.EMAIL_FROM, name: "Tintora POS" },
        to: [{ address: c.para }],
        ...(vars.SUPPORT_EMAIL ? { reply_to: vars.SUPPORT_EMAIL } : {}),
        subject: c.asunto,
        text: c.texto,
        ...(c.html ? { html: c.html } : {}),
      }),
    });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("No se pudo contactar el servicio de correo:", error);
    return { estado: "fallido", error: `red: ${error}`.slice(0, 300), reintentar: true };
  }
  const datos = (await r.json().catch(() => null)) as RespuestaCorreo | null;
  const rebotado = datos?.rebotados?.some((d) => d.toLowerCase() === c.para.toLowerCase()) ?? false;
  if (r.ok && datos?.success && !rebotado) return { estado: "enviado" };

  const codigo =
    String(datos?.codigo ?? datos?.code ?? datos?.error ?? (rebotado ? "rebote_permanente" : "")) ||
    `http_${r.status}`;
  console.error(`Correo no enviado (${r.status}):`, codigo);
  // Solo se reintenta lo pasajero (fallo del proveedor o del servidor). Un token malo, un
  // remitente ajeno, el límite del día o un rebote permanente no se arreglan insistiendo.
  const pasajero = r.status >= 500 && codigo !== "rebote_permanente";
  return { estado: "fallido", error: `${r.status} ${codigo}`.slice(0, 300), reintentar: pasajero };
}
