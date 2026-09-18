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
import { guardarSistema } from "@/server/sistema";

/** Dónde queda el resultado del último envío, para que el canario lo vea. */
export const CLAVE_ULTIMO_CORREO = "correo_ultimo";

/**
 * Errores que no se arreglan reintentando: son de configuración (dominio sin
 * activar, token cambiado, remitente ajeno, plan sin correo). El 17 sep 2026 el
 * proveedor respondía 502 `sender_not_configured` y el canario decía «ok» porque
 * solo miraba las variables: ahora estos errores quedan anotados y lo ponen en rojo.
 */
const DE_CONFIGURACION = [
  "sender_not_configured",
  "token_invalido",
  "sin_token",
  "token_reemplazado",
  "plan_sin_correo",
  "from_ajeno",
];

export function esErrorDeConfiguracion(texto: string): boolean {
  return DE_CONFIGURACION.some((c) => texto.includes(c));
}

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
  | { estado: "fallido"; error: string; reintentar: boolean; configuracion?: boolean };

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

/**
 * Envía y, si se pasa la base, anota el resultado (sin destinatario ni contenido)
 * para el canario de /datos/salud.
 */
export async function enviarCorreo(vars: Variables, c: Correo, db?: D1Database): Promise<ResultadoCorreo> {
  const r = await enviarSinAnotar(vars, c);
  if (db && r.estado !== "no_configurado") {
    const valor =
      r.estado === "enviado"
        ? { ok: true }
        : { ok: false, error: r.error, configuracion: Boolean(r.configuracion) };
    await guardarSistema(db, CLAVE_ULTIMO_CORREO, JSON.stringify(valor)).catch((e) =>
      console.error("[correo] no se pudo anotar el resultado:", e),
    );
  }
  return r;
}

async function enviarSinAnotar(vars: Variables, c: Correo): Promise<ResultadoCorreo> {
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

  // La plataforma responde { error: "<mensaje>", codigo: "<código>" }; a veces el
  // código viene solo en `error`. Si `error` trae espacios es un mensaje, no un código.
  const error = typeof datos?.error === "string" ? datos.error : "";
  const errorEsCodigo = error !== "" && !/\s/.test(error);
  const codigo =
    String(datos?.codigo ?? datos?.code ?? (errorEsCodigo ? error : rebotado ? "rebote_permanente" : "")) ||
    `http_${r.status}`;
  const detalle = errorEsCodigo ? "" : error;
  const configuracion = esErrorDeConfiguracion(`${codigo} ${detalle}`);
  console.error(`Correo no enviado (${r.status}):`, codigo, detalle);
  // Solo se reintenta lo pasajero (fallo del proveedor o del servidor). Un token malo, un
  // remitente sin activar, el límite del día o un rebote permanente no se arreglan insistiendo.
  const pasajero = r.status >= 500 && codigo !== "rebote_permanente" && !configuracion;
  return {
    estado: "fallido",
    error: `${r.status} ${codigo}${detalle ? `: ${detalle}` : ""}`.slice(0, 300),
    reintentar: pasajero,
    configuracion,
  };
}
