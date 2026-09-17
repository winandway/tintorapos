import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

/** Registro de lo que las pruebas mandaron a servicios externos simulados. */
export interface CorreoYaDominios {
  sitio: string;
  token: string;
  from: { address: string; name?: string };
  to: { address: string }[];
  reply_to?: string;
  subject: string;
  text: string;
  html?: string;
}

export const enviados: {
  twilio: URLSearchParams[];
  turnstile: URLSearchParams[];
  correo: CorreoYaDominios[];
} = {
  twilio: [],
  turnstile: [],
  correo: [],
};

/** Token que el servicio de correo simulado acepta. */
export const TOKEN_CORREO_PRUEBA = "token-de-prueba-yadominios";

export const manejadoresBase = [
  http.post("https://api.twilio.com/2010-04-01/Accounts/:sid/Messages.json", async ({ request }) => {
    const cuerpo = new URLSearchParams(await request.text());
    enviados.twilio.push(cuerpo);
    return HttpResponse.json({ sid: "SM" + "0".repeat(32), status: "queued" }, { status: 201 });
  }),
  http.post("https://challenges.cloudflare.com/turnstile/v0/siteverify", async ({ request }) => {
    const cuerpo = new URLSearchParams(await request.text());
    enviados.turnstile.push(cuerpo);
    const ok = cuerpo.get("response") === "pase-valido";
    return HttpResponse.json({ success: ok, "error-codes": ok ? [] : ["invalid-input-response"] });
  }),
];

export const manejadorCorreo = http.post(
  "https://yapanel.yadominios.com/api/hosting/correo/enviar",
  async ({ request }) => {
    const c = (await request.json()) as CorreoYaDominios;
    // Las mismas reglas del servicio real que ya rompieron integraciones.
    const valido =
      typeof c.sitio === "string" &&
      typeof c.subject === "string" &&
      typeof c.text === "string" &&
      typeof c.from?.address === "string" &&
      Array.isArray(c.to) &&
      (c.reply_to === undefined || typeof c.reply_to === "string");
    if (!valido)
      return HttpResponse.json({ success: false, error: "invalid_request_schema" }, { status: 400 });
    if (c.token !== TOKEN_CORREO_PRUEBA)
      return HttpResponse.json({ success: false, error: "token_invalido" }, { status: 401 });
    const rebotados = c.to.map((t) => t.address).filter((a) => a.startsWith("rebota@"));
    if (rebotados.length === c.to.length)
      return HttpResponse.json({ success: false, error: "rebote_permanente", rebotados }, { status: 502 });
    enviados.correo.push(c);
    return HttpResponse.json({
      success: true,
      message_id: "msg-prueba",
      enviados_hoy: enviados.correo.length,
      incluidos_por_dia: 300,
      es_extra: false,
      entregados: c.to.map((t) => t.address).filter((a) => !rebotados.includes(a)),
      rebotados,
      en_cola: [],
    });
  },
);

manejadoresBase.push(manejadorCorreo);

export const servidorMsw = setupServer(...manejadoresBase);
