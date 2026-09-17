import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { GET as listar, POST as registrar } from "@/app/datos/dispositivos/route";
import { POST as crearEnlace } from "@/app/datos/dispositivos/enlace/route";
import { GET as abrirEnlace } from "@/app/v/[token]/route";
import { DELETE as revocar } from "@/app/datos/dispositivos/[id]/route";
import { GET as empleados } from "@/app/datos/pin/empleados/route";
import { POST as entrarPin } from "@/app/datos/pin/entrar/route";
import { GET as auditoria } from "@/app/datos/auditoria/route";
import { GET as sesionActual } from "@/app/datos/sesion/route";
import { POST as salir } from "@/app/datos/sesion/salir/route";
import { ruta } from "@/server/ruta";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { crearTintoreria, crearUsuario, sesionPara, type TintoreriaPrueba } from "../ayuda/fabrica";

type Err = { error: { codigo: string; mensaje: string } };
const privada = ruta({
  acceso: "sesion",
  manejar: async (c) => ({ nombre: c.sesion?.usuario.nombre, tipo: c.sesion?.tipo }),
});

describe("dispositivos de la tienda y entrada con PIN", () => {
  let e: EntornoPrueba;
  let t: TintoreriaPrueba;
  let cajera: string;

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    t = await crearTintoreria(e.env.DB);
    cajera = await crearUsuario(e.env.DB, t.id, "cajero", { pin: "5820", nombre: "Cajera turno mañana" });
    await crearUsuario(e.env.DB, t.id, "planta", { pin: "3917", nombre: "Planchador" });
    await crearUsuario(e.env.DB, t.id, "planta", { nombre: "Sin PIN" });
  });
  afterAll(() => e.cerrar());

  it("el dueño registra la tablet; los empleados entran con PIN; salir vuelve a la pantalla de PIN", async () => {
    const tablet = new Navegador();
    // Sin registrar: la pantalla de PIN no abre.
    expect(((await tablet.llamar<Err>(empleados)).datos as Err).error.codigo).toBe(
      "dispositivo_no_registrado",
    );

    tablet.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, t.duenoId));
    const reg = await tablet.llamar<{ id: string }>(registrar, { cuerpo: { nombre: "Tablet mostrador" } });
    expect(reg.estado).toBe(200);
    expect(tablet.cookies.get("tp_disp")).toBeTruthy();
    const lista = await tablet.llamar<{ dispositivos: { nombre: string }[] }>(listar);
    expect(lista.datos.dispositivos.map((d) => d.nombre)).toContain("Tablet mostrador");

    await tablet.llamar(salir, { metodo: "POST" });
    expect(tablet.cookies.has("tp_sesion")).toBe(false);
    const pantalla = await tablet.llamar<{ empleados: { id: string; nombre: string }[]; tienda: string }>(
      empleados,
    );
    expect(pantalla.datos.tienda).toBe("Tintorería de prueba");
    expect(pantalla.datos.empleados.map((x) => x.nombre)).toEqual(["Cajera turno mañana", "Planchador"]);

    const mal = await tablet.llamar<Err>(entrarPin, { cuerpo: { usuarioId: cajera, pin: "0000" } });
    expect(mal.estado).toBe(401);
    expect(mal.datos.error.mensaje).toBe("PIN incorrecto. Te quedan 4 intentos.");
    expect((await tablet.llamar(entrarPin, { cuerpo: { usuarioId: cajera, pin: "5820" } })).estado).toBe(200);
    expect((await tablet.llamar(privada)).datos).toEqual({ nombre: "Cajera turno mañana", tipo: "pin" });
    expect((await tablet.llamar(sesionActual)).datos).toMatchObject({
      sesion: { tipo: "pin", usuario: { rol: "cajero" } },
      dispositivo: { nombre: "Tablet mostrador" },
    });
    // La cajera no gestiona dispositivos ni ve la auditoría.
    expect((await tablet.llamar(listar)).estado).toBe(403);
    expect((await tablet.llamar(auditoria)).estado).toBe(403);

    // Un PIN de otro usuario inexistente no revela nada.
    expect(
      (await tablet.llamar<Err>(entrarPin, { cuerpo: { usuarioId: "no-existe", pin: "5820" } })).estado,
    ).toBe(401);
  });

  it("revocar la tablet cierra en el acto la sesión del empleado y apaga la pantalla de PIN", async () => {
    const tablet = new Navegador();
    tablet.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, t.duenoId));
    const reg = await tablet.llamar<{ id: string }>(registrar, {
      cuerpo: { nombre: "Tablet que se pierde" },
    });
    await tablet.llamar(salir, { metodo: "POST" });
    await tablet.llamar(entrarPin, { cuerpo: { usuarioId: cajera, pin: "5820" } });
    expect((await tablet.llamar(privada)).estado).toBe(200);

    const dueno = new Navegador();
    dueno.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, t.duenoId));
    expect((await dueno.llamar(revocar, { metodo: "DELETE", params: { id: reg.datos.id } })).estado).toBe(
      200,
    );
    expect((await dueno.llamar(revocar, { metodo: "DELETE", params: { id: reg.datos.id } })).estado).toBe(
      200,
    );
    expect((await dueno.llamar(revocar, { metodo: "DELETE", params: { id: "no-existe" } })).estado).toBe(404);

    expect((await tablet.llamar(privada)).estado).toBe(401);
    expect((await tablet.llamar(empleados)).estado).toBe(401);

    const registros = await dueno.llamar<{ registros: { accion: string }[] }>(auditoria);
    const acciones = registros.datos.registros.map((r) => r.accion);
    expect(acciones).toContain("dispositivo.revocado");
    expect(acciones).toContain("sesion.pin_fallido");
    const filtrado = await dueno.llamar<{ registros: { accion: string }[] }>(auditoria, {
      ruta: "/datos/auditoria?accion=dispositivo.registrado",
    });
    expect(new Set(filtrado.datos.registros.map((r) => r.accion))).toEqual(
      new Set(["dispositivo.registrado"]),
    );
  });

  it("un empleado bloqueado aparece marcado en la pantalla de PIN", async () => {
    const tablet = new Navegador();
    tablet.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, t.duenoId));
    await tablet.llamar(registrar, { cuerpo: { nombre: "Tablet 3" } });
    const planta = await crearUsuario(e.env.DB, t.id, "planta", { pin: "6284", nombre: "Planta 2" });
    for (let i = 0; i < 5; i++)
      await tablet.llamar(entrarPin, { cuerpo: { usuarioId: planta, pin: "1110" } });
    const bloqueado = await tablet.llamar<Err>(entrarPin, { cuerpo: { usuarioId: planta, pin: "6284" } });
    expect(bloqueado.estado).toBe(429);
    const pantalla = await tablet.llamar<{ empleados: { nombre: string; bloqueado: boolean }[] }>(empleados);
    expect(pantalla.datos.empleados.find((x) => x.nombre === "Planta 2")?.bloqueado).toBe(true);
  });

  it("conectar un celular con el QR: sirve una sola vez, registra el teléfono y el enlace vencido no sirve", async () => {
    const tablet = new Navegador();
    tablet.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, t.duenoId));
    const r = await tablet.llamar<{ url: string; expiraEn: number; minutos: number }>(crearEnlace, {
      cuerpo: { nombre: "Celular de planta" },
    });
    expect(r.estado).toBe(200);
    expect(r.datos.minutos).toBe(10);
    const token = r.datos.url.split("/v/")[1]!;

    // El celular abre el enlace: queda registrado y va a la pantalla de PIN.
    const celular = new Navegador();
    const uno = await abrirEnlace(new Request(`https://tintorapos.com/v/${token}`), {
      params: Promise.resolve({ token }),
    });
    expect(uno.status).toBe(303);
    expect(uno.headers.get("location")).toBe("https://tintorapos.com/app/pin");
    const cookie = uno.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("tp_disp=");
    celular.cookies.set("tp_disp", cookie.split("tp_disp=")[1]!.split(";")[0]!);
    const pantalla = await celular.llamar<{ empleados: { nombre: string }[] }>(empleados);
    expect(pantalla.estado).toBe(200);
    expect(pantalla.datos.empleados.map((x) => x.nombre)).toContain("Cajera turno mañana");

    // El MISMO enlace no vuelve a servir: nadie más registra un teléfono con él.
    const dos = await abrirEnlace(new Request(`https://tintorapos.com/v/${token}`), {
      params: Promise.resolve({ token }),
    });
    expect(dos.status).toBe(303);
    expect(dos.headers.get("location")).toBe("https://tintorapos.com/entrar?vinculo=vencido");
    expect(dos.headers.get("set-cookie")).toBeNull();

    // Un enlace inventado tampoco.
    const falso = await abrirEnlace(new Request("https://tintorapos.com/v/inventado"), {
      params: Promise.resolve({ token: "inventado" }),
    });
    expect(falso.headers.get("location")).toBe("https://tintorapos.com/entrar?vinculo=vencido");

    // Y uno vencido tampoco: se le cambia la fecha a mano en la base.
    const r2 = await tablet.llamar<{ url: string }>(crearEnlace, { cuerpo: { nombre: "Otro celular" } });
    const token2 = r2.datos.url.split("/v/")[1]!;
    await e.env.DB.prepare("update enlaces_dispositivo set expira_en = ? where usado_en is null")
      .bind(Date.now() - 1000)
      .run();
    const vencido = await abrirEnlace(new Request(`https://tintorapos.com/v/${token2}`), {
      params: Promise.resolve({ token: token2 }),
    });
    expect(vencido.headers.get("location")).toBe("https://tintorapos.com/entrar?vinculo=vencido");

    // Solo quedó registrado el teléfono del primer enlace.
    const nombres = await tablet.llamar<{ dispositivos: { nombre: string }[] }>(listar);
    expect(nombres.datos.dispositivos.filter((d) => d.nombre === "Celular de planta")).toHaveLength(1);
    expect(nombres.datos.dispositivos.some((d) => d.nombre === "Otro celular")).toBe(false);
  });

  it("un cajero no puede crear el enlace para conectar un celular", async () => {
    const caja = new Navegador();
    caja.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, cajera, { tipo: "pin" }));
    expect((await caja.llamar(crearEnlace, { cuerpo: { nombre: "Mi celular" } })).estado).toBe(403);
  });
});
