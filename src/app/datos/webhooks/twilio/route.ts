import { igualesSeguro } from "@/lib/codigos";
import { firmaTwilio, PALABRAS_ALTA, PALABRAS_BAJA } from "@/server/avisos/twilio";
import { ruta } from "@/server/ruta";

const TWIML = () => new Response("<Response></Response>", { headers: { "content-type": "text/xml" } });

/**
 * Mensajes entrantes de Twilio. Solo se atiende la baja (STOP) y el alta (START).
 * La firma se verifica SIEMPRE antes de tocar nada.
 */
export const POST = ruta({
  acceso: "publico",
  csrf: false,
  limite: { clave: (c) => `twilio:${c.ipHash}`, max: 300, ventanaSeg: 60 },
  manejar: async (c) => {
    const token = c.vars.TWILIO_AUTH_TOKEN;
    if (!token) return new Response("no configurado", { status: 503 });
    const texto = await c.req.text();
    const params: Record<string, string> = {};
    for (const [k, v] of new URLSearchParams(texto)) params[k] = v;
    const esperada = await firmaTwilio(token, `${c.vars.APP_URL}/datos/webhooks/twilio`, params);
    if (!igualesSeguro(c.req.headers.get("x-twilio-signature") ?? "", esperada))
      return new Response("firma inválida", { status: 403 });

    const palabra = (params.Body ?? "").trim().toUpperCase().split(/\s+/)[0] ?? "";
    const telefono = params.From ?? "";
    if (!/^\+\d{8,15}$/.test(telefono)) return TWIML();
    if (PALABRAS_BAJA.includes(palabra)) {
      await c.db
        .prepare(
          "update clientes /* sistema: baja de SMS del número en todas las tintorerías */ set acepta_sms = 0, sms_baja_en = ? where telefono = ?",
        )
        .bind(c.ahora, telefono)
        .run();
    } else if (PALABRAS_ALTA.includes(palabra)) {
      // El alta no vuelve a encender los avisos solo: la tienda tiene que marcar el permiso otra vez.
      await c.db
        .prepare("update clientes /* sistema: alta del número */ set sms_baja_en = null where telefono = ?")
        .bind(telefono)
        .run();
    }
    return TWIML();
  },
});
