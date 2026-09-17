import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { http, HttpResponse } from "msw";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { POST as crearOrdenRuta } from "@/app/datos/ordenes/route";
import { POST as estadoRuta } from "@/app/datos/ordenes/[id]/estado/route";
import { GET as verAvisos } from "@/app/datos/avisos/route";
import { PUT as guardarPlantillas } from "@/app/datos/avisos/plantillas/route";
import { POST as prueba } from "@/app/datos/avisos/prueba/route";
import { POST as webhook } from "@/app/datos/webhooks/twilio/route";
import { nuevoId } from "@/lib/codigos";
import { encolarAvisos, procesarCola, programarRecordatorios } from "@/server/avisos";
import { componerAviso, configuracionAvisos } from "@/server/avisos/plantillas";
import { enviarSms, firmaTwilio } from "@/server/avisos/twilio";
import { variablesDe } from "@/server/entorno";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { enviados, servidorMsw, TOKEN_CORREO_PRUEBA } from "../ayuda/msw";
import { Navegador } from "../ayuda/cliente-http";
import { escenarioAislamiento, type Escenario } from "../ayuda/escenario";

describe("avisos por SMS y correo", () => {
  let e: EntornoPrueba;
  let esc: Escenario;
  let dueno: Navegador;

  beforeAll(async () => {
    e = await crearEntorno({
      TWILIO_ACCOUNT_SID: "AC" + "1".repeat(32),
      TWILIO_AUTH_TOKEN: "token-de-prueba-twilio",
      TWILIO_FROM: "+13055550100",
      YADOMINIOS_TOKEN: TOKEN_CORREO_PRUEBA,
      EMAIL_FROM: "avisos@tintora.prueba",
    });
    usarEntorno(e);
    esc = await escenarioAislamiento(e);
    await e.env.DB.prepare(
      "update clientes set nombre = 'Rosa Elena', idioma = 'en', acepta_sms = 1, acepta_correo = 1, correo = 'rosa@correo.com' where id = ?",
    )
      .bind(esc.a.ids.clienteId)
      .run();
    dueno = new Navegador();
    dueno.cookies.set("tp_sesion", esc.a.sesionDueno);
  });
  beforeEach(() => {
    enviados.twilio.length = 0;
    enviados.correo.length = 0;
  });
  afterAll(() => e.cerrar());

  it("plantillas: de fábrica, personalizadas y composición", () => {
    const base = configuracionAvisos("{}");
    expect(base.recibida.activo).toBe(false);
    expect(base.lista.activo).toBe(true);
    const propia = configuracionAvisos(JSON.stringify({ lista: { activo: true, es: "Lista {numero}" } }));
    expect(propia.lista).toMatchObject({ es: "Lista {numero}", personalizado: true });
    expect(configuracionAvisos("roto").lista.personalizado).toBe(false);
    expect(
      componerAviso("Hola  {nombre}\\n #{numero}", {
        tienda: "T",
        nombre: "Ana",
        numero: 7,
        fecha: "x",
        enlace: "y",
      }),
    ).toBe("Hola Ana\\n #7");
  });

  it("marcar lista manda SMS y correo en el idioma del cliente, con el enlace público", async () => {
    const r = await dueno.llamar<{ quedoLista: boolean }>(estadoRuta, {
      params: { id: esc.a.ids.ordenId! },
      cuerpo: { estado: "lista" },
    });
    expect(r.datos.quedoLista).toBe(true);
    await e.esperar();
    expect(enviados.twilio).toHaveLength(1);
    const sms = enviados.twilio[0]!;
    expect(sms.get("To")).toBe("+13125550199");
    expect(sms.get("From")).toBe("+13055550100");
    expect(sms.get("Body")).toContain("Hi Rosa!");
    expect(sms.get("Body")).toContain(`/t/${esc.a.ids.codigoPublico}`);
    expect(enviados.correo).toHaveLength(1);
    expect(enviados.correo[0]).toMatchObject({
      sitio: "tintorapos",
      to: [{ address: "rosa@correo.com" }],
      from: { address: "avisos@tintora.prueba" },
    });
    const lista = await dueno.llamar<{
      avisos: { estado: string; canal: string }[];
      canales: { sms: boolean; correo: boolean };
    }>(verAvisos);
    expect(lista.datos.canales).toEqual({ sms: true, correo: true });
    expect(lista.datos.avisos.filter((a) => a.estado === "enviado")).toHaveLength(2);
  });

  it("orden nueva no avisa si «recibida» está apagado; al encenderlo, sí", async () => {
    const nueva = () => ({
      id: nuevoId(),
      cliente: { id: esc.a.ids.clienteId },
      prendas: [
        { id: nuevoId(), prendaId: esc.a.ids.prendaId, servicioId: esc.a.ids.servicioId, cantidad: 1 },
      ],
    });
    await dueno.llamar(crearOrdenRuta, { cuerpo: nueva() });
    await e.esperar();
    expect(enviados.twilio).toHaveLength(0);
    expect(
      (
        await dueno.llamar(guardarPlantillas, {
          metodo: "PUT",
          cuerpo: { recibida: { activo: true, en: "{tienda}: got #{numero}, ready {fecha}" } },
        })
      ).estado,
    ).toBe(200);
    await dueno.llamar(crearOrdenRuta, { cuerpo: nueva() });
    await e.esperar();
    expect(enviados.twilio[0]?.get("Body")).toMatch(/^Tintoreria A marca-unica-aaaa: got #1003, ready /);
  });

  it("sin permiso del cliente o dado de baja no se encola nada", async () => {
    await e.env.DB.prepare("update clientes set sms_baja_en = 1, acepta_correo = 0 where id = ?")
      .bind(esc.a.ids.clienteId)
      .run();
    expect(
      await encolarAvisos(e.env.DB, "https://x", {
        tintoreriaId: esc.a.id,
        ordenId: esc.a.ids.ordenId!,
        tipo: "lista",
      }),
    ).toEqual([]);
    expect(
      await encolarAvisos(e.env.DB, "https://x", {
        tintoreriaId: esc.b.id,
        ordenId: esc.a.ids.ordenId!,
        tipo: "lista",
      }),
    ).toEqual([]);
    await e.env.DB.prepare("update clientes set sms_baja_en = null, acepta_correo = 1 where id = ?")
      .bind(esc.a.ids.clienteId)
      .run();
  });

  it("reintenta con espera cuando Twilio falla y marca fallido al agotar intentos o si el número no sirve", async () => {
    const vars = variablesDe(e.env);
    servidorMsw.use(
      http.post("https://api.twilio.com/2010-04-01/Accounts/:sid/Messages.json", () =>
        HttpResponse.json({ message: "caído" }, { status: 503 }),
      ),
    );
    const ids = await encolarAvisos(e.env.DB, "https://x", {
      tintoreriaId: esc.a.id,
      ordenId: esc.a.ids.ordenId!,
      tipo: "recordatorio",
    });
    const ahora = Date.now();
    let r = await procesarCola(e.env, vars, { ids }, ahora);
    expect(r).toMatchObject({ reintentos: 1, enviados: 1 });
    const fila = await e.env.DB.prepare("select estado, intentos, programado_en from avisos where id = ?")
      .bind(ids[0])
      .first<{ estado: string; intentos: number; programado_en: number }>();
    expect(fila).toMatchObject({ estado: "pendiente", intentos: 1 });
    expect(fila!.programado_en).toBe(ahora + 2 * 60_000);
    // Antes de su hora no sale; después, se agota y queda fallido.
    expect((await procesarCola(e.env, vars, {}, ahora)).reintentos).toBe(0);
    for (let i = 0; i < 4; i++) r = await procesarCola(e.env, vars, {}, ahora + 3600_000 * (i + 1));
    expect(
      (await e.env.DB.prepare("select estado from avisos where id = ?").bind(ids[0]).first())?.estado,
    ).toBe("fallido");

    servidorMsw.use(
      http.post("https://api.twilio.com/2010-04-01/Accounts/:sid/Messages.json", () =>
        HttpResponse.json({ message: "invalid To" }, { status: 400 }),
      ),
    );
    expect(await enviarSms({ sid: "AC1", token: "t", desde: "MG123" }, "+1", "x")).toMatchObject({
      ok: false,
      reintentar: false,
    });
    servidorMsw.use(
      http.post("https://api.twilio.com/2010-04-01/Accounts/:sid/Messages.json", () => HttpResponse.error()),
    );
    expect(await enviarSms({ sid: "AC1", token: "t", desde: "+1" }, "+1", "x")).toMatchObject({
      ok: false,
      reintentar: true,
    });
    expect(await enviarSms({}, "+1", "x")).toMatchObject({ ok: false, error: "no_configurado" });
  });

  it("aviso de prueba a un número del dueño y validación del destino", async () => {
    const ok = await dueno.llamar<{ estado: string }>(prueba, {
      cuerpo: { canal: "sms", destino: "(786) 555-0199" },
    });
    expect(ok.datos.estado).toBe("enviado");
    expect(enviados.twilio.at(-1)?.get("To")).toBe("+17865550199");
    expect((await dueno.llamar(prueba, { cuerpo: { canal: "sms", destino: "12" } })).estado).toBe(400);
    expect((await dueno.llamar(prueba, { cuerpo: { canal: "correo", destino: "no-es" } })).estado).toBe(400);
    expect(
      (
        await dueno.llamar<{ estado: string }>(prueba, {
          cuerpo: { canal: "correo", destino: "dueno@tienda.com" },
        })
      ).datos.estado,
    ).toBe("enviado");
  });

  it("webhook de Twilio: firma igual a la oficial; STOP da de baja; firma falsa no toca nada", async () => {
    const url = "https://tintora.prueba/datos/webhooks/twilio";
    const params = { From: "+13125550199", Body: "stop please", MessageSid: "SM1" };
    const oficial = createHmac("sha1", "token-de-prueba-twilio")
      .update(
        url +
          Object.keys(params)
            .sort()
            .map((k) => k + params[k as keyof typeof params])
            .join(""),
      )
      .digest("base64");
    expect(await firmaTwilio("token-de-prueba-twilio", url, params)).toBe(oficial);

    const n = new Navegador();
    const cuerpo = new URLSearchParams(params).toString();
    const falsa = await n.llamar(webhook, {
      metodo: "POST",
      cuerpoCrudo: cuerpo,
      cabeceras: { "x-twilio-signature": "falsa", "content-type": "application/x-www-form-urlencoded" },
      sinCsrf: true,
    });
    expect(falsa.estado).toBe(403);
    expect(
      (
        await e.env.DB.prepare("select sms_baja_en from clientes where id = ?")
          .bind(esc.a.ids.clienteId)
          .first()
      )?.sms_baja_en,
    ).toBeNull();

    const r = await n.llamar(webhook, {
      metodo: "POST",
      cuerpoCrudo: cuerpo,
      cabeceras: { "x-twilio-signature": oficial, "content-type": "application/x-www-form-urlencoded" },
      sinCsrf: true,
    });
    expect(r.estado).toBe(200);
    expect(r.respuesta.headers.get("content-type")).toBe("text/xml");
    const fila = await e.env.DB.prepare("select acepta_sms, sms_baja_en from clientes where id = ?")
      .bind(esc.a.ids.clienteId)
      .first<{ acepta_sms: number; sms_baja_en: number | null }>();
    expect(fila?.acepta_sms).toBe(0);
    expect(fila?.sms_baja_en).toBeTypeOf("number");
    // La misma persona es cliente de la tintorería B con el mismo número: también queda de baja.
    expect(
      (
        await e.env.DB.prepare("select sms_baja_en from clientes where id = ?")
          .bind(esc.b.ids.clienteId)
          .first()
      )?.sms_baja_en,
    ).toBeTypeOf("number");

    const alta = { From: "+13125550199", Body: "START" };
    const firmaAlta = await firmaTwilio("token-de-prueba-twilio", url, alta);
    await n.llamar(webhook, {
      metodo: "POST",
      cuerpoCrudo: new URLSearchParams(alta).toString(),
      cabeceras: { "x-twilio-signature": firmaAlta, "content-type": "application/x-www-form-urlencoded" },
      sinCsrf: true,
    });
    const trasAlta = await e.env.DB.prepare("select acepta_sms, sms_baja_en from clientes where id = ?")
      .bind(esc.a.ids.clienteId)
      .first();
    expect(trasAlta).toEqual({ acepta_sms: 0, sms_baja_en: null });

    const raro = { From: "no-es-numero", Body: "STOP" };
    const firmaRaro = await firmaTwilio("token-de-prueba-twilio", url, raro);
    expect(
      (
        await n.llamar(webhook, {
          metodo: "POST",
          cuerpoCrudo: new URLSearchParams(raro).toString(),
          cabeceras: { "x-twilio-signature": firmaRaro },
          sinCsrf: true,
        })
      ).estado,
    ).toBe(200);
  });

  it("recordatorios: respeta días y máximo de la tienda", async () => {
    await e.env.DB.prepare("update clientes set acepta_sms = 1, sms_baja_en = null where id = ?")
      .bind(esc.a.ids.clienteId)
      .run();
    const ahora = Date.now();
    expect(await programarRecordatorios(e.env.DB, "https://x", ahora)).toBe(0);
    const dentroDe8 = ahora + 8 * 86_400_000;
    expect(await programarRecordatorios(e.env.DB, "https://x", dentroDe8)).toBe(1);
    expect(await programarRecordatorios(e.env.DB, "https://x", dentroDe8 + 1000)).toBe(0);
    expect(await programarRecordatorios(e.env.DB, "https://x", dentroDe8 + 8 * 86_400_000)).toBe(1);
    await programarRecordatorios(e.env.DB, "https://x", dentroDe8 + 16 * 86_400_000);
    expect(await programarRecordatorios(e.env.DB, "https://x", dentroDe8 + 30 * 86_400_000)).toBe(0);
    const o = await e.env.DB.prepare("select recordatorios_enviados from ordenes where id = ?")
      .bind(esc.a.ids.ordenId)
      .first();
    expect(o?.recordatorios_enviados).toBe(3);
  });
});
