/** Envío de SMS con la API REST de Twilio y verificación de la firma de sus webhooks. */

export interface ConfigTwilio {
  sid?: string;
  token?: string;
  desde?: string;
}

export type ResultadoSms = { ok: true; id: string } | { ok: false; error: string; reintentar: boolean };

export function twilioConfigurado(c: ConfigTwilio): boolean {
  return Boolean(c.sid && c.token && c.desde);
}

export async function enviarSms(c: ConfigTwilio, para: string, cuerpo: string): Promise<ResultadoSms> {
  if (!c.sid || !c.token || !c.desde) return { ok: false, error: "no_configurado", reintentar: false };
  const datos = new URLSearchParams({ To: para, Body: cuerpo });
  if (c.desde.startsWith("MG")) datos.set("MessagingServiceSid", c.desde);
  else datos.set("From", c.desde);
  try {
    const r = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(c.sid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          authorization: `Basic ${btoa(`${c.sid}:${c.token}`)}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: datos,
        signal: AbortSignal.timeout(10_000),
      },
    );
    const json = (await r.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number };
    if (r.ok && json.sid) return { ok: true, id: json.sid };
    // 4xx de Twilio (número inválido, bloqueado) no mejora reintentando; 429/5xx sí.
    return {
      ok: false,
      error: `twilio ${r.status}: ${json.message ?? ""}`.slice(0, 300),
      reintentar: r.status === 429 || r.status >= 500,
    };
  } catch (e) {
    return {
      ok: false,
      error: `red: ${e instanceof Error ? e.message : String(e)}`.slice(0, 300),
      reintentar: true,
    };
  }
}

/**
 * Firma de Twilio: base64(HMAC-SHA1(authToken, url + cada parámetro ordenado por
 * nombre con su valor)). Se compara en tiempo constante.
 */
export async function firmaTwilio(
  token: string,
  url: string,
  parametros: Record<string, string>,
): Promise<string> {
  const datos =
    url +
    Object.keys(parametros)
      .sort()
      .map((k) => k + parametros[k])
      .join("");
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(token),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const firma = new Uint8Array(await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(datos)));
  let bin = "";
  for (const b of firma) bin += String.fromCharCode(b);
  return btoa(bin);
}

export const PALABRAS_BAJA = [
  "STOP",
  "STOPALL",
  "UNSUBSCRIBE",
  "CANCEL",
  "END",
  "QUIT",
  "BAJA",
  "PARAR",
  "ALTO",
];
export const PALABRAS_ALTA = ["START", "UNSTOP", "YES"];
