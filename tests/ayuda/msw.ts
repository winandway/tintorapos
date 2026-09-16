import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

/** Registro de lo que las pruebas mandaron a servicios externos simulados. */
export const enviados: { twilio: URLSearchParams[]; turnstile: URLSearchParams[] } = {
  twilio: [],
  turnstile: [],
};

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

export const servidorMsw = setupServer(...manejadoresBase);
