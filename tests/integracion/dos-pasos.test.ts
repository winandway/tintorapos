import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { POST as iniciar } from "@/app/datos/sesion/dos-pasos/iniciar/route";
import { POST as activar } from "@/app/datos/sesion/dos-pasos/activar/route";
import { codigoTotp, pasoActual, PASO_SEG } from "@/server/auth/totp";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { crearTintoreria, crearUsuario, sesionPara } from "../ayuda/fabrica";

type Err = { error: { codigo: string; mensaje: string } };

/**
 * CANDADO DEL SEGUNDO PASO. Le pasó a un dueño de verdad el 19 de septiembre de
 * 2026: escaneó el QR, la página dio una vuelta y a partir de ahí el sistema le
 * dijo «el código no es correcto» para siempre. Sin este paso NADIE puede
 * terminar de registrarse.
 */
describe("verificación en dos pasos: activarla nunca puede dejar a nadie afuera", () => {
  let e: EntornoPrueba;
  const n = new Navegador();

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    const t = await crearTintoreria(e.env.DB, "Tintorería del candado");
    const duenoId = await crearUsuario(e.env.DB, t.id, "dueno", { correo: "duena@ejemplo.com" });
    n.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, duenoId));
  }, 120_000);
  afterAll(() => e.cerrar());

  const secretoDe = (texto: string) => texto.replace(/\s/g, "");

  it("volver a abrir la pantalla NO invalida el código que ya se escaneó", async () => {
    const primera = await n.llamar<{ secreto: string }>(iniciar, { metodo: "POST" });
    expect(primera.estado).toBe(200);
    const segunda = await n.llamar<{ secreto: string }>(iniciar, { metodo: "POST" });
    expect(segunda.datos.secreto).toBe(primera.datos.secreto);

    // El código de la app (del secreto escaneado la primera vez) sigue sirviendo.
    const codigo = await codigoTotp(secretoDe(primera.datos.secreto), pasoActual(Date.now()));
    const r = await n.llamar<{ codigosRespaldo: string[] }>(activar, { cuerpo: { codigo } });
    expect(r.estado).toBe(200);
    expect(r.datos.codigosRespaldo).toHaveLength(10);
  });

  it("si de verdad quiere empezar de cero, el código viejo deja de servir", async () => {
    const t = await crearTintoreria(e.env.DB, "Tintorería que vuelve a empezar");
    const duenoId = await crearUsuario(e.env.DB, t.id, "dueno", { correo: "otra@ejemplo.com" });
    const otro = new Navegador();
    otro.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, duenoId));

    const viejo = await otro.llamar<{ secreto: string }>(iniciar, { metodo: "POST" });
    const nuevo = await otro.llamar<{ secreto: string }>(iniciar, { cuerpo: { regenerar: true } });
    expect(nuevo.datos.secreto).not.toBe(viejo.datos.secreto);

    const conElViejo = await otro.llamar<Err>(activar, {
      cuerpo: { codigo: await codigoTotp(secretoDe(viejo.datos.secreto), pasoActual(Date.now())) },
    });
    expect(conElViejo.estado).toBe(400);
    const conElNuevo = await otro.llamar(activar, {
      cuerpo: { codigo: await codigoTotp(secretoDe(nuevo.datos.secreto), pasoActual(Date.now())) },
    });
    expect(conElNuevo.estado).toBe(200);
  });

  it("con el reloj del celular corrido, el sistema lo DICE en vez de culpar al código", async () => {
    const t = await crearTintoreria(e.env.DB, "Tintorería con el reloj malo");
    const duenoId = await crearUsuario(e.env.DB, t.id, "dueno", { correo: "reloj@ejemplo.com" });
    const otro = new Navegador();
    otro.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, duenoId));
    const r = await otro.llamar<{ secreto: string }>(iniciar, { metodo: "POST" });

    // Un código de hace diez minutos: fuera de toda ventana razonable.
    const atrasado = await codigoTotp(secretoDe(r.datos.secreto), pasoActual(Date.now() - 10 * 60_000));
    const fallo = await otro.llamar<Err>(activar, { cuerpo: { codigo: atrasado } });
    expect(fallo.estado).toBe(400);
    expect(fallo.datos.error.codigo).toBe("reloj_desfasado");
    expect(fallo.datos.error.mensaje).toContain("10");
  });

  it("un desfase de un minuto y medio SÍ deja activar (la ventana de activación es ancha)", async () => {
    const t = await crearTintoreria(e.env.DB, "Tintorería con el reloj casi bien");
    const duenoId = await crearUsuario(e.env.DB, t.id, "dueno", { correo: "casi@ejemplo.com" });
    const otro = new Navegador();
    otro.cookies.set("tp_sesion", await sesionPara(e.env.DB, t.id, duenoId));
    const r = await otro.llamar<{ secreto: string }>(iniciar, { metodo: "POST" });
    const codigo = await codigoTotp(secretoDe(r.datos.secreto), pasoActual(Date.now()) + 3);
    expect((await otro.llamar(activar, { cuerpo: { codigo } })).estado).toBe(200);
    expect(PASO_SEG).toBe(30);
  });
});
