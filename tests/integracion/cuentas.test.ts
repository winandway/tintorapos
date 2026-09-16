import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { POST as registrar } from "@/app/datos/registro/route";
import { POST as entrar } from "@/app/datos/sesion/entrar/route";
import { POST as salir } from "@/app/datos/sesion/salir/route";
import { GET as sesionActual } from "@/app/datos/sesion/route";
import { POST as iniciarDosPasos } from "@/app/datos/sesion/dos-pasos/iniciar/route";
import { POST as activarDosPasos } from "@/app/datos/sesion/dos-pasos/activar/route";
import { POST as verificarDosPasos } from "@/app/datos/sesion/dos-pasos/verificar/route";
import { POST as cambiarClave } from "@/app/datos/clave/cambiar/route";
import { POST as recuperar } from "@/app/datos/clave/recuperar/route";
import { POST as restablecer } from "@/app/datos/clave/restablecer/route";
import { codigoTotp, pasoActual } from "@/server/auth/totp";
import { ruta } from "@/server/ruta";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { crearUsuario } from "../ayuda/fabrica";

type Err = { error: { codigo: string; campos?: Record<string, string> } };

const datosRegistro = (correo: string) => ({
  negocio: "Lavandería Central",
  nombre: "Dueña de la tienda",
  correo,
  clave: "Perchas-2026-seguras",
  zonaHoraria: "America/Chicago",
  idioma: "es",
  pais: "US",
  moneda: "USD",
  telefono: "(312) 555-0100",
  aceptaTerminos: true,
});

const privada = ruta({ acceso: "sesion", manejar: async (c) => ({ usuario: c.sesion?.usuario.nombre }) });

describe("cuentas: registro, dos pasos, entrar y salir", () => {
  let e: EntornoPrueba;
  const enviados: { to: string; text: string }[] = [];

  beforeAll(async () => {
    e = await crearEntorno({
      EMAIL: { send: async (m: { to: string; text: string }) => void enviados.push(m) },
      EMAIL_FROM: "avisos@tintora.prueba",
    });
    usarEntorno(e);
  });
  afterAll(() => e.cerrar());

  it("registro completo con activación de dos pasos obligatoria para el dueño", async () => {
    const n = new Navegador();
    const r = await n.llamar(registrar, { cuerpo: datosRegistro("duena@lavanderia.com") });
    expect(r.estado).toBe(200);
    expect(r.datos).toEqual({ ok: true, siguiente: "dos_pasos_activar" });
    expect(n.cookies.get("tp_sesion")).toBeTruthy();

    // Catálogo estándar creado sin precios inventados.
    const t = await e.env.DB.prepare(
      "select id, plan, prueba_hasta, moneda from tintorerias where correo = ?",
    )
      .bind("duena@lavanderia.com")
      .first<{ id: string; plan: string; prueba_hasta: number; moneda: string }>();
    expect(t?.plan).toBe("prueba");
    expect(t!.prueba_hasta - Date.now()).toBeGreaterThan(13 * 24 * 3600_000);
    const conteos = await e.env.DB.prepare(
      "select (select count(*) from catalogo_servicios where tintoreria_id = ?1) as s, (select count(*) from catalogo_prendas where tintoreria_id = ?1) as p, (select count(*) from precios where tintoreria_id = ?1) as precios",
    )
      .bind(t!.id)
      .first();
    expect(conteos).toEqual({ s: 5, p: 20, precios: 0 });

    // Sin dos pasos no entra a nada.
    expect(((await n.llamar<Err>(privada)).datos as Err).error.codigo).toBe("requiere_dos_pasos");
    expect((await n.llamar(sesionActual)).datos).toMatchObject({
      sesion: { siguiente: "dos_pasos_activar" },
    });

    const ini = await n.llamar<{ secreto: string; uri: string; qrSvg: string }>(iniciarDosPasos, {
      metodo: "POST",
    });
    expect(ini.estado).toBe(200);
    expect(ini.datos.qrSvg).toContain("<svg");
    const secreto = ini.datos.secreto.replace(/\s/g, "");
    const mal = await n.llamar<Err>(activarDosPasos, { cuerpo: { codigo: "000000" } });
    expect(mal.datos.error.codigo).toBe("codigo_incorrecto");
    const act = await n.llamar<{ codigosRespaldo: string[] }>(activarDosPasos, {
      cuerpo: { codigo: await codigoTotp(secreto, pasoActual(Date.now())) },
    });
    expect(act.estado).toBe(200);
    expect(act.datos.codigosRespaldo).toHaveLength(10);
    expect((await n.llamar(privada)).datos).toEqual({ usuario: "Dueña de la tienda" });
    expect((await n.llamar(sesionActual)).datos).toMatchObject({
      sesion: { siguiente: "app", usuario: { rol: "dueno" }, tintoreria: { moneda: "USD" } },
    });
    // Ya activo: no se puede reiniciar sin pasar por ajustes.
    expect((await n.llamar(iniciarDosPasos, { metodo: "POST" })).estado).toBe(409);

    // Salir borra la sesión en el servidor.
    const token = n.cookies.get("tp_sesion")!;
    expect((await n.llamar(salir, { metodo: "POST" })).estado).toBe(200);
    expect(n.cookies.has("tp_sesion")).toBe(false);
    n.cookies.set("tp_sesion", token);
    expect((await n.llamar(privada)).estado).toBe(401);

    // Entrar de nuevo: clave mala, luego buena + código de la app, luego respaldo.
    const n2 = new Navegador();
    const malo = await n2.llamar<Err>(entrar, {
      cuerpo: { correo: "duena@lavanderia.com", clave: "otra-clave-2026" },
    });
    expect(malo.estado).toBe(401);
    expect(malo.datos.error.codigo).toBe("credenciales");
    const bueno = await n2.llamar(entrar, {
      cuerpo: { correo: "DUENA@lavanderia.com ", clave: "Perchas-2026-seguras" },
    });
    expect(bueno.datos).toEqual({ ok: true, siguiente: "dos_pasos" });
    expect((await n2.llamar(privada)).estado).toBe(401);
    const v = await n2.llamar(verificarDosPasos, {
      cuerpo: { codigo: await codigoTotp(secreto, pasoActual(Date.now()) + 1) },
    });
    expect(v.estado).toBe(200);
    expect((await n2.llamar(privada)).estado).toBe(200);

    const n3 = new Navegador();
    await n3.llamar(entrar, { cuerpo: { correo: "duena@lavanderia.com", clave: "Perchas-2026-seguras" } });
    const conRespaldo = await n3.llamar(verificarDosPasos, {
      cuerpo: { respaldo: act.datos.codigosRespaldo[0]!.toLowerCase() },
    });
    expect(conRespaldo.datos).toEqual({ ok: true, respaldosRestantes: 9 });
    const n4 = new Navegador();
    await n4.llamar(entrar, { cuerpo: { correo: "duena@lavanderia.com", clave: "Perchas-2026-seguras" } });
    expect(
      (await n4.llamar(verificarDosPasos, { cuerpo: { respaldo: act.datos.codigosRespaldo[0] } })).estado,
    ).toBe(400);
    expect((await n4.llamar(verificarDosPasos, { cuerpo: {} })).estado).toBe(400);
  });

  it("valida el registro: correo repetido, clave débil, regla Soporte y términos", async () => {
    const n = new Navegador();
    const repetido = await n.llamar<Err>(registrar, { cuerpo: datosRegistro("duena@lavanderia.com") });
    expect(repetido.estado).toBe(409);
    expect(repetido.datos.error.codigo).toBe("correo_en_uso");
    const debil = await n.llamar<Err>(registrar, {
      cuerpo: { ...datosRegistro("nuevo@tienda.com"), clave: "corta1" },
    });
    expect(debil.datos.error).toMatchObject({ codigo: "clave_corta", campos: { clave: "clave_corta" } });
    const soporte = await n.llamar<Err>(registrar, {
      cuerpo: { ...datosRegistro("jose@windoce.com"), nombre: "José" },
    });
    expect(soporte.datos.error.codigo).toBe("soporte_nombre");
    const conSoporte = await n.llamar(registrar, {
      cuerpo: { ...datosRegistro("soporte@windoce.com"), nombre: "Soporte Windoce" },
    });
    expect(conSoporte.estado).toBe(200);
    const sinTerminos = await n.llamar<Err>(registrar, {
      cuerpo: { ...datosRegistro("otro@tienda.com"), aceptaTerminos: false, zonaHoraria: "Luna/Base" },
    });
    expect(sinTerminos.datos.error.campos).toMatchObject({
      aceptaTerminos: "acepta_terminos",
      zonaHoraria: "zona",
    });
  });

  it("limita los intentos por correo aunque cambie la IP", async () => {
    let ultimo = 0;
    for (let i = 0; i < 9; i++) {
      const n = new Navegador();
      n.cabecerasExtra["cf-connecting-ip"] = `198.51.100.${i}`;
      ultimo = (
        await n.llamar(entrar, { cuerpo: { correo: "duena@lavanderia.com", clave: "mala-clave-000" } })
      ).estado;
    }
    expect(ultimo).toBe(429);
  });

  it("recuperar y restablecer la contraseña cierra las sesiones viejas", async () => {
    const n = new Navegador();
    const reg = await n.llamar(registrar, { cuerpo: datosRegistro("recupera@tienda.com") });
    expect(reg.estado).toBe(200);
    const sesionVieja = n.cookies.get("tp_sesion")!;

    expect((await n.llamar(recuperar, { cuerpo: { correo: "nadie@ninguna.com" } })).datos).toEqual({
      ok: true,
    });
    expect(enviados).toHaveLength(0);
    expect((await n.llamar(recuperar, { cuerpo: { correo: "recupera@tienda.com" } })).datos).toEqual({
      ok: true,
    });
    expect(enviados).toHaveLength(1);
    const token = decodeURIComponent(enviados[0]!.text.match(/token=([^\s]+)/)![1]!);

    const debil = await n.llamar<Err>(restablecer, { cuerpo: { token, clave: "123" } });
    expect(debil.datos.error.codigo).toBe("clave_corta");
    expect((await n.llamar(restablecer, { cuerpo: { token, clave: "Nueva-Clave-2026" } })).estado).toBe(200);
    const otra = await n.llamar<Err>(restablecer, { cuerpo: { token, clave: "Nueva-Clave-2027" } });
    expect(otra.datos.error.codigo).toBe("enlace_vencido");

    const vieja = new Navegador();
    vieja.cookies.set("tp_sesion", sesionVieja);
    expect((await vieja.llamar(sesionActual)).datos).toMatchObject({ sesion: null });
    const nueva = await new Navegador().llamar(entrar, {
      cuerpo: { correo: "recupera@tienda.com", clave: "Nueva-Clave-2026" },
    });
    expect(nueva.estado).toBe(200);
  });

  it("gerente con clave temporal debe cambiarla antes de operar", async () => {
    const t = await e.env.DB.prepare("select id from tintorerias where correo = ?")
      .bind("duena@lavanderia.com")
      .first<{ id: string }>();
    const gerente = await crearUsuario(e.env.DB, t!.id, "gerente", {
      correo: "gerente@lavanderia.com",
      clave: "Temporal-2026-x",
    });
    await e.env.DB.prepare("update usuarios set debe_cambiar_clave = 1 where id = ?").bind(gerente).run();
    const n = new Navegador();
    const r = await n.llamar(entrar, {
      cuerpo: { correo: "gerente@lavanderia.com", clave: "Temporal-2026-x" },
    });
    expect(r.datos).toEqual({ ok: true, siguiente: "cambiar_clave" });
    const bloqueada = await n.llamar<Err>(privada);
    expect(bloqueada.datos.error.campos).toEqual({ _: "debe_cambiar_clave" });
    expect(
      (await n.llamar<Err>(cambiarClave, { cuerpo: { actual: "no-es", nueva: "Propia-Clave-2026" } })).estado,
    ).toBe(400);
    const otraSesion = new Navegador();
    await otraSesion.llamar(entrar, {
      cuerpo: { correo: "gerente@lavanderia.com", clave: "Temporal-2026-x" },
    });
    expect(
      (await n.llamar(cambiarClave, { cuerpo: { actual: "Temporal-2026-x", nueva: "Propia-Clave-2026" } }))
        .estado,
    ).toBe(200);
    expect((await n.llamar(privada)).estado).toBe(200);
    expect((await otraSesion.llamar(sesionActual)).datos).toMatchObject({ sesion: null });
  });

  it("un cajero sin correo no puede entrar por contraseña", async () => {
    const t = await e.env.DB.prepare("select id from tintorerias where correo = ?")
      .bind("duena@lavanderia.com")
      .first<{ id: string }>();
    await crearUsuario(e.env.DB, t!.id, "cajero", {
      correo: "cajero@lavanderia.com",
      clave: "Cajero-Clave-2026",
    });
    const r = await new Navegador().llamar<Err>(entrar, {
      cuerpo: { correo: "cajero@lavanderia.com", clave: "Cajero-Clave-2026" },
    });
    expect(r.datos.error.codigo).toBe("credenciales");
  });
});

describe("escudo anti-robots encendido", () => {
  let e: EntornoPrueba;
  beforeAll(async () => {
    e = await crearEntorno({
      TURNSTILE_SECRET_KEY: "clave-secreta-turnstile",
      TURNSTILE_SITE_KEY: "clave-sitio",
    });
    usarEntorno(e);
  });
  afterAll(() => e.cerrar());

  it("sin pase o con pase falso no registra; con pase válido sí", async () => {
    const n = new Navegador();
    expect(
      ((await n.llamar<Err>(registrar, { cuerpo: datosRegistro("t1@tienda.com") })).datos as Err).error
        .codigo,
    ).toBe("turnstile");
    const falso = await n.llamar<Err>(registrar, {
      cuerpo: datosRegistro("t1@tienda.com"),
      cabeceras: { "x-turnstile": "falso" },
    });
    expect(falso.datos.error.codigo).toBe("turnstile");
    const ok = await n.llamar(registrar, {
      cuerpo: datosRegistro("t1@tienda.com"),
      cabeceras: { "x-turnstile": "pase-valido" },
    });
    expect(ok.estado).toBe(200);
    const login = await new Navegador().llamar<Err>(entrar, {
      cuerpo: { correo: "t1@tienda.com", clave: "Perchas-2026-seguras" },
    });
    expect(login.datos.error.codigo).toBe("turnstile");
    const rec = await new Navegador().llamar<Err>(recuperar, { cuerpo: { correo: "t1@tienda.com" } });
    expect(rec.datos.error.codigo).toBe("turnstile");
  });
});
