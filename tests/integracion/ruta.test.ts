import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { ruta } from "@/server/ruta";
import { ErrorApp } from "@/server/errores";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import {
  crearDispositivo,
  crearTintoreria,
  crearUsuario,
  sesionPara,
  type TintoreriaPrueba,
} from "../ayuda/fabrica";

describe("envoltura de rutas /datos (candado de seguridad)", () => {
  let e: EntornoPrueba;
  let t: TintoreriaPrueba;

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    t = await crearTintoreria(e.env.DB);
  });
  afterAll(() => e.cerrar());

  const publica = ruta({
    acceso: "publico",
    cuerpo: z.object({ nombre: z.string().min(1).max(5), correo: z.email().optional() }),
    manejar: async (c) => ({ hola: c.cuerpo.nombre, idioma: c.idioma, conSesion: Boolean(c.sesion) }),
  });

  it("valida el cuerpo y responde errores por campo en el idioma del navegador", async () => {
    const n = new Navegador();
    const ok = await n.llamar(publica, { cuerpo: { nombre: "Ana" } });
    expect(ok.estado).toBe(200);
    expect(ok.datos).toMatchObject({ hola: "Ana", idioma: "es", conSesion: false });

    const mal = await n.llamar<{
      error: { codigo: string; mensaje: string; campos: Record<string, string> };
    }>(publica, {
      cuerpo: { nombre: "Nombre muy largo", correo: "no-es-correo" },
      cabeceras: { "accept-language": "en-US" },
    });
    expect(mal.estado).toBe(400);
    expect(mal.datos.error.codigo).toBe("datos_invalidos");
    expect(mal.datos.error.mensaje).toBe("Please check the highlighted fields.");
    expect(mal.datos.error.campos).toEqual({ nombre: "muy_largo", correo: "correo" });

    const falta = await n.llamar<{ error: { campos: Record<string, string> } }>(publica, { cuerpo: {} });
    expect(falta.datos.error.campos).toEqual({ nombre: "requerido" });

    const roto = await n.llamar(publica, { cuerpoCrudo: "{no es json", metodo: "POST" });
    expect(roto.estado).toBe(400);
  });

  it("rechaza escrituras sin CSRF o desde otro origen", async () => {
    const n = new Navegador();
    expect((await n.llamar(publica, { cuerpo: { nombre: "Ana" }, sinCsrf: true })).estado).toBe(403);
    expect(
      (
        await n.llamar(publica, {
          cuerpo: { nombre: "Ana" },
          cabeceras: { origin: "https://malicioso.example" },
        })
      ).estado,
    ).toBe(403);
    n.cookies.set("tp_csrf", "otro-valor-distinto-000000");
    expect(
      (
        await n.llamar(publica, {
          cuerpo: { nombre: "Ana" },
          cabeceras: { "x-csrf": "valor-que-no-coincide-0000" },
        })
      ).estado,
    ).toBe(403);
  });

  const privada = ruta({
    acceso: "sesion",
    permiso: "reportes.ver",
    manejar: async (c) => ({ tintoreria: c.sesion?.tintoreria.id, rol: c.sesion?.usuario.rol }),
  });

  it("exige sesión, dos pasos del dueño y permiso", async () => {
    const n = new Navegador();
    expect((await n.llamar(privada)).estado).toBe(401);

    n.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, t.duenoId, { dosPasos: false }));
    const sinDosPasos = await n.llamar<{ error: { codigo: string } }>(privada);
    expect(sinDosPasos.estado).toBe(401);
    expect(sinDosPasos.datos.error.codigo).toBe("requiere_dos_pasos");

    n.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, t.duenoId));
    const ok = await n.llamar(privada);
    expect(ok.estado).toBe(200);
    expect(ok.datos).toEqual({ tintoreria: t.id, rol: "dueno" });

    const cajero = await crearUsuario(e.env.DB, t.id, "cajero");
    n.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, cajero, { tipo: "pin" }));
    expect((await n.llamar(privada)).estado).toBe(403);
  });

  it("una sesión borrada, vencida o de usuario desactivado ya no sirve", async () => {
    const n = new Navegador();
    const gerente = await crearUsuario(e.env.DB, t.id, "gerente");
    const token = await sesionPara(e.env.DB, t.id, gerente);
    n.cookies.set("tp_sesion", token);
    expect((await n.llamar(privada)).estado).toBe(200);
    await e.env.DB.prepare("update usuarios set activo = 0 where id = ?").bind(gerente).run();
    expect((await n.llamar(privada)).estado).toBe(401);
    // La fila se borró al detectar el problema.
    const { results } = await e.env.DB.prepare("select * from sesiones where usuario_id = ?")
      .bind(gerente)
      .all();
    expect(results).toHaveLength(0);

    const otro = await crearUsuario(e.env.DB, t.id, "gerente");
    n.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, otro));
    await e.env.DB.prepare("update sesiones set expira_en = 1 where usuario_id = ?").bind(otro).run();
    expect((await n.llamar(privada)).estado).toBe(401);

    n.cookies.set("tp_sesion", "x".repeat(43));
    expect((await n.llamar(privada)).estado).toBe(401);
  });

  it("una cuenta suspendida no opera", async () => {
    const t2 = await crearTintoreria(e.env.DB, "Suspendida");
    await e.env.DB.prepare("update tintorerias set estado = 'suspendida' where id = ?").bind(t2.id).run();
    const n = new Navegador();
    n.cookies.set("tp_sesion", await sesionPara(e.env.DB, t2.id, t2.duenoId));
    const r = await n.llamar<{ error: { codigo: string } }>(privada);
    expect(r.estado).toBe(403);
    expect(r.datos.error.codigo).toBe("cuenta_suspendida");
  });

  it("acceso de cuenta rechaza sesiones de PIN y un dispositivo revocado corta la sesión", async () => {
    const soloCuenta = ruta({ acceso: "cuenta", manejar: async () => ({ ok: true }) });
    const disp = await crearDispositivo(e.env.DB, t);
    const cajero = await crearUsuario(e.env.DB, t.id, "cajero");
    const n = new Navegador();
    n.cookies.set(
      "tp_sesion",
      await sesionPara(e.env.DB, t.id, cajero, { tipo: "pin", dispositivoId: disp.id }),
    );
    expect((await n.llamar(soloCuenta)).estado).toBe(403);
    const cualquiera = ruta({ acceso: "sesion", manejar: async (c) => ({ sucursal: c.sesion?.sucursalId }) });
    expect((await n.llamar(cualquiera)).datos).toEqual({ sucursal: t.sucursalId });
    await e.env.DB.prepare("update dispositivos set revocado_en = ? where id = ?")
      .bind(Date.now(), disp.id)
      .run();
    expect((await n.llamar(cualquiera)).estado).toBe(401);
  });

  it("acceso de dispositivo exige la cookie del dispositivo registrado", async () => {
    const r = ruta({
      acceso: "dispositivo",
      manejar: async (c) => ({ tienda: c.dispositivo?.tintoreriaNombre }),
    });
    const n = new Navegador();
    const sin = await n.llamar<{ error: { codigo: string } }>(r);
    expect(sin.datos.error.codigo).toBe("dispositivo_no_registrado");
    const disp = await crearDispositivo(e.env.DB, t);
    n.cookies.set("tp_disp", disp.token);
    expect((await n.llamar(r)).datos).toEqual({ tienda: "Tintorería de prueba" });
  });

  it("el reloj solo entra con su secreto", async () => {
    const r = ruta({ acceso: "reloj", csrf: false, manejar: async () => ({ ok: true }) });
    const n = new Navegador();
    expect((await n.llamar(r, { metodo: "POST" })).estado).toBe(401);
    const ok = await n.llamar(r, {
      metodo: "POST",
      cabeceras: { authorization: `Bearer ${e.env.RELOJ_SECRETO}` },
    });
    expect(ok.estado).toBe(200);
  });

  it("limita intentos y avisa cuánto esperar", async () => {
    const limitada = ruta({
      acceso: "publico",
      limite: { clave: (c) => `prueba:${c.ipHash}`, max: 2, ventanaSeg: 60 },
      manejar: async () => ({ ok: true }),
    });
    const n = new Navegador();
    n.cabecerasExtra["cf-connecting-ip"] = "203.0.113.9";
    expect((await n.llamar(limitada)).estado).toBe(200);
    expect((await n.llamar(limitada)).estado).toBe(200);
    const tercero = await n.llamar<{ error: { mensaje: string } }>(limitada);
    expect(tercero.estado).toBe(429);
    expect(tercero.respuesta.headers.get("retry-after")).toBeTruthy();
    expect(tercero.datos.error.mensaje).toContain("1 min");
  });

  it("errores de la app salen bilingües y los inesperados no filtran detalles", async () => {
    const conError = ruta({
      acceso: "publico",
      manejar: async (c) => {
        c.ponerCookie("x=1; Path=/");
        throw new ErrorApp(409, "saldo_pendiente", { monto: "$10.00" });
      },
    });
    const n = new Navegador();
    const r = await n.llamar<{ error: { mensaje: string } }>(conError);
    expect(r.estado).toBe(409);
    expect(r.datos.error.mensaje).toBe(
      "La orden tiene un saldo pendiente de $10.00. Cóbralo antes de entregar.",
    );
    expect(n.cookies.get("x")).toBe("1");

    const espia = vi.spyOn(console, "error").mockImplementation(() => {});
    const roto = ruta({
      acceso: "publico",
      manejar: async () => {
        throw new Error("detalle interno secreto");
      },
    });
    const r2 = await n.llamar<{ error: { mensaje: string } }>(roto);
    expect(r2.estado).toBe(500);
    expect(JSON.stringify(r2.datos)).not.toContain("secreto");
    expect(espia).toHaveBeenCalled();
  });

  it("los parámetros de la URL llegan al manejador", async () => {
    const conParams = ruta({
      acceso: "publico",
      manejar: async (c) => ({ id: c.params.id, resto: c.params.resto }),
    });
    const r = await new Navegador().llamar(conParams, { params: { id: "abc" } });
    expect(r.datos).toEqual({ id: "abc" });
    const req = new Request("https://tintora.prueba/x", { headers: { origin: "https://tintora.prueba" } });
    const r2 = await conParams(req, { params: Promise.resolve({ id: "1", resto: ["a", "b"] }) });
    expect(await r2.json()).toEqual({ id: "1", resto: "a/b" });
  });
});
