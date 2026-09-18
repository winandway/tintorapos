import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import type { Variables } from "@/env";
import {
  correoConfigurado,
  enviarCorreo,
  esErrorDeConfiguracion,
  URL_CORREO_YADOMINIOS,
} from "@/server/correo";
import { enviados, servidorMsw, TOKEN_CORREO_PRUEBA } from "../ayuda/msw";

const base = {
  APP_SECRET: "x".repeat(40),
  APP_URL: "https://tintorapos.sitios.dev",
  YADOMINIOS_TOKEN: TOKEN_CORREO_PRUEBA,
  EMAIL_FROM: "avisos@tintorapos.com",
} as Variables;
const correo = { para: "cliente@ejemplo.com", asunto: "Tu orden", texto: "Ya está lista." };

describe("correo por la API de YaDominios Cloud (candado)", () => {
  beforeEach(() => {
    enviados.correo.length = 0;
  });

  it("manda el formato que exige la plataforma: sitio, remitente del dominio, text siempre y reply_to en texto plano", async () => {
    const r = await enviarCorreo({ ...base, SUPPORT_EMAIL: "soporte@tintorapos.com" }, correo);
    expect(r).toEqual({ estado: "enviado" });
    expect(enviados.correo).toHaveLength(1);
    expect(enviados.correo[0]).toEqual({
      sitio: "tintorapos",
      token: TOKEN_CORREO_PRUEBA,
      from: { address: "avisos@tintorapos.com", name: "Tintora POS" },
      to: [{ address: "cliente@ejemplo.com" }],
      reply_to: "soporte@tintorapos.com",
      subject: "Tu orden",
      text: "Ya está lista.",
    });
  });

  it("sin token o sin remitente no finge el envío ni llama a nadie", async () => {
    expect(correoConfigurado({ ...base, YADOMINIOS_TOKEN: undefined })).toBe(false);
    expect(await enviarCorreo({ ...base, EMAIL_FROM: undefined }, correo)).toEqual({
      estado: "no_configurado",
    });
    expect(enviados.correo).toHaveLength(0);
  });

  it("token malo y rebote permanente fallan sin reintentar; un 5xx del proveedor sí se reintenta", async () => {
    expect(await enviarCorreo({ ...base, YADOMINIOS_TOKEN: "otro" }, correo)).toEqual({
      estado: "fallido",
      error: "401 token_invalido",
      reintentar: false,
      configuracion: true,
    });
    expect(await enviarCorreo(base, { ...correo, para: "rebota@ejemplo.com" })).toMatchObject({
      estado: "fallido",
      reintentar: false,
    });
    servidorMsw.use(
      http.post(URL_CORREO_YADOMINIOS, () =>
        HttpResponse.json({ success: false, error: "proveedor" }, { status: 502 }),
      ),
    );
    expect(await enviarCorreo(base, correo)).toEqual({
      estado: "fallido",
      error: "502 proveedor",
      reintentar: true,
      configuracion: false,
    });
    servidorMsw.use(http.post(URL_CORREO_YADOMINIOS, () => HttpResponse.error()));
    expect(await enviarCorreo(base, correo)).toMatchObject({ estado: "fallido", reintentar: true });
  });

  it("un «éxito» que rebotó para ese destinatario cuenta como fallido", async () => {
    servidorMsw.use(
      http.post(URL_CORREO_YADOMINIOS, () =>
        HttpResponse.json({ success: true, entregados: [], rebotados: ["cliente@ejemplo.com"] }),
      ),
    );
    expect(await enviarCorreo(base, correo)).toMatchObject({ estado: "fallido", reintentar: false });
  });

  it("dominio sin activar: 502 sender_not_configured NO se reintenta y se marca como error de configuración", async () => {
    // Respuesta real de la plataforma el 17 sep 2026, con EMAIL_FROM puesto pero el
    // botón «Activar correos de mi dominio» sin completar.
    servidorMsw.use(
      http.post(URL_CORREO_YADOMINIOS, () =>
        HttpResponse.json(
          {
            error: "El proveedor de correo rechazó el envío: email.sending.error.email.sender_not_configured",
            codigo: "proveedor",
          },
          { status: 502 },
        ),
      ),
    );
    const r = await enviarCorreo(base, correo);
    expect(r).toMatchObject({ estado: "fallido", reintentar: false, configuracion: true });
    expect(r.estado === "fallido" && r.error).toContain("sender_not_configured");
    expect(esErrorDeConfiguracion("502 proveedor")).toBe(false);
  });
});
