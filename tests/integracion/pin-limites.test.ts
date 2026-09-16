import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolverAutorizacion, verificarPinUsuario, PIN_BLOQUEO_MS } from "@/server/auth/autorizacion";
import {
  cerrarSesion,
  cerrarSesionesUsuario,
  leerSesion,
  limpiarSesionesVencidas,
  marcarDosPasosOk,
  DURACION,
} from "@/server/auth/sesiones";
import { limitar, limpiarLimitesVencidos, reiniciarLimite } from "@/server/limites";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { crearTintoreria, crearUsuario, sesionPara, type TintoreriaPrueba } from "../ayuda/fabrica";

describe("PIN, autorización de gerente, sesiones y límites", () => {
  let e: EntornoPrueba;
  let t: TintoreriaPrueba;
  beforeAll(async () => {
    e = await crearEntorno();
    t = await crearTintoreria(e.env.DB);
  });
  afterAll(() => e.cerrar());

  it("5 PIN equivocados bloquean 15 minutos y el correcto reinicia", async () => {
    const db = e.env.DB;
    const u = await crearUsuario(db, t.id, "cajero", { pin: "4829" });
    const ahora = Date.now();
    expect(await verificarPinUsuario(db, t.id, u, "4829", ahora)).toEqual({ ok: true, rol: "cajero" });
    for (let i = 1; i <= 4; i++) {
      expect(await verificarPinUsuario(db, t.id, u, "0000", ahora)).toEqual({
        ok: false,
        motivo: "incorrecto",
        restantes: 5 - i,
      });
    }
    expect(await verificarPinUsuario(db, t.id, u, "0000", ahora)).toEqual({
      ok: false,
      motivo: "bloqueado",
      minutos: 15,
    });
    // Bloqueado: ni el PIN correcto entra.
    expect((await verificarPinUsuario(db, t.id, u, "4829", ahora + 1000)).ok).toBe(false);
    // Pasado el bloqueo, entra y se limpia el contador.
    expect(await verificarPinUsuario(db, t.id, u, "4829", ahora + PIN_BLOQUEO_MS + 1)).toEqual({
      ok: true,
      rol: "cajero",
    });
    const fila = await db
      .prepare("select pin_intentos, pin_bloqueado_hasta from usuarios where id = ?")
      .bind(u)
      .first();
    expect(fila).toEqual({ pin_intentos: 0, pin_bloqueado_hasta: null });
  });

  it("un PIN de otra tintorería o de un usuario sin PIN no existe", async () => {
    const t2 = await crearTintoreria(e.env.DB, "Otra");
    const ajeno = await crearUsuario(e.env.DB, t2.id, "gerente", { pin: "7391" });
    expect(await verificarPinUsuario(e.env.DB, t.id, ajeno, "7391")).toEqual({
      ok: false,
      motivo: "no_existe",
    });
    const sinPin = await crearUsuario(e.env.DB, t.id, "planta");
    expect(await verificarPinUsuario(e.env.DB, t.id, sinPin, "7391")).toEqual({
      ok: false,
      motivo: "no_existe",
    });
  });

  it("autorización: el cajero necesita el PIN de un gerente; el gerente no", async () => {
    const db = e.env.DB;
    const cajero = await crearUsuario(db, t.id, "cajero", { pin: "5820" });
    const gerente = await crearUsuario(db, t.id, "gerente", { pin: "6931" });
    const otroCajero = await crearUsuario(db, t.id, "cajero", { pin: "2468" });
    const sCajero = (await leerSesion(db, await sesionPara(db, t.id, cajero, { tipo: "pin" })))!;
    const sGerente = (await leerSesion(db, await sesionPara(db, t.id, gerente, { tipo: "pin" })))!;

    expect(await resolverAutorizacion(db, sGerente, "ordenes.anular", null)).toBeNull();
    await expect(resolverAutorizacion(db, sCajero, "ordenes.anular", null)).rejects.toMatchObject({
      codigo: "requiere_autorizacion",
    });
    expect(
      await resolverAutorizacion(db, sCajero, "ordenes.anular", { usuarioId: gerente, pin: "6931" }),
    ).toBe(gerente);
    await expect(
      resolverAutorizacion(db, sCajero, "ordenes.anular", { usuarioId: gerente, pin: "1111" }),
    ).rejects.toMatchObject({ codigo: "autorizacion_invalida" });
    await expect(
      resolverAutorizacion(db, sCajero, "ordenes.anular", { usuarioId: otroCajero, pin: "2468" }),
    ).rejects.toMatchObject({ codigo: "autorizacion_invalida" });
    for (let i = 0; i < 4; i++) {
      await resolverAutorizacion(db, sCajero, "ordenes.anular", { usuarioId: gerente, pin: "0001" }).catch(
        () => {},
      );
    }
    await expect(
      resolverAutorizacion(db, sCajero, "ordenes.anular", { usuarioId: gerente, pin: "6931" }),
    ).rejects.toMatchObject({ codigo: "pin_bloqueado" });
  });

  it("sesiones: dos pasos pendiente vence a los 15 min, cierre y limpieza", async () => {
    const db = e.env.DB;
    const token = await sesionPara(db, t.id, t.duenoId, { dosPasos: false });
    const s = (await leerSesion(db, token))!;
    expect(s.segundoFactorOk).toBe(false);
    expect(await leerSesion(db, token, Date.now() + DURACION.pendienteDosPasos + 1000)).toBeNull();

    const token2 = await sesionPara(db, t.id, t.duenoId, { dosPasos: false });
    await marcarDosPasosOk(db, (await leerSesion(db, token2))!);
    expect((await leerSesion(db, token2))!.segundoFactorOk).toBe(true);
    // Actividad: pasado un minuto se actualiza la última actividad.
    expect(await leerSesion(db, token2, Date.now() + 120_000)).not.toBeNull();
    await cerrarSesion(db, token2);
    await cerrarSesion(db, undefined);
    expect(await leerSesion(db, token2)).toBeNull();

    const a = await sesionPara(db, t.id, t.duenoId);
    const b = await sesionPara(db, t.id, t.duenoId);
    const sa = (await leerSesion(db, a))!;
    await cerrarSesionesUsuario(db, t.id, t.duenoId, sa.idHash);
    expect(await leerSesion(db, a)).not.toBeNull();
    expect(await leerSesion(db, b)).toBeNull();

    await db.prepare("update sesiones set expira_en = 1").run();
    expect(await limpiarSesionesVencidas(db)).toBeGreaterThan(0);
  });

  it("límite de intentos por ventana", async () => {
    const db = e.env.DB;
    const ahora = 1_000_000;
    expect((await limitar(db, "k", 2, 60, ahora)).permitido).toBe(true);
    expect((await limitar(db, "k", 2, 60, ahora + 1)).permitido).toBe(true);
    const tercero = await limitar(db, "k", 2, 60, ahora + 2);
    expect(tercero).toEqual({ permitido: false, conteo: 3, reiniciaEn: ahora + 60_000 });
    expect((await limitar(db, "k", 2, 60, ahora + 60_000)).permitido).toBe(true);
    await reiniciarLimite(db, "k");
    expect((await limitar(db, "k", 2, 60, ahora)).conteo).toBe(1);
    expect(await limpiarLimitesVencidos(db, ahora + 10_000_000)).toBeGreaterThan(0);
  });
});
