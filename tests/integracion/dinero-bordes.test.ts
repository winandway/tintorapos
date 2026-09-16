import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { randomUUID } from "node:crypto";
import { abrirTurno } from "@/server/caja";
import { leerCatalogo } from "@/server/catalogo";
import { ErrorApp } from "@/server/errores";
import { registrarPago } from "@/server/pagos";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { escenarioPantallas } from "../ayuda/pantallas";

/** Bordes del circuito de dinero que no se alcanzan desde la pantalla. */
describe("dinero: casos borde (candado)", () => {
  let e: EntornoPrueba;
  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
  }, 120_000);
  afterAll(() => e.cerrar());

  it("un pago con el id de un pago de OTRA tintorería es conflicto y no toca ese pago (comprobado en rojo)", async () => {
    const a = await escenarioPantallas(e.env.DB);
    const b = await escenarioPantallas(e.env.DB);
    await abrirTurno(e.env.DB, a.sesion, 0);
    await abrirTurno(e.env.DB, b.sesion, 0);
    const ordenA = await a.nuevaOrden();
    const ordenB = await b.nuevaOrden();
    const id = randomUUID();
    await registrarPago(e.env.DB, a.sesion, ordenA.id, { id, metodo: "efectivo", montoCents: 500 });
    await expect(
      registrarPago(e.env.DB, b.sesion, ordenB.id, { id, metodo: "efectivo", montoCents: 500 }),
    ).rejects.toMatchObject({ estado: 409, codigo: "conflicto" });
    const fila = await e.env.DB.prepare("select tintoreria_id, orden_id from pagos where id = ?")
      .bind(id)
      .first<{ tintoreria_id: string; orden_id: string }>();
    expect(fila).toEqual({ tintoreria_id: a.tintoreriaId, orden_id: ordenA.id });
    expect(await leerCatalogo(e.env.DB, b.tintoreriaId)).toBeTruthy();
  });

  it("los errores inesperados de la base al cobrar o abrir caja no se disfrazan de «repetido» ni de «caja abierta»", async () => {
    const c = await escenarioPantallas(e.env.DB);
    const orden = await c.nuevaOrden();
    const falla = new Error("disco lleno");
    const dbRota = new Proxy(e.env.DB, {
      get(obj, prop) {
        if (prop === "batch") return () => Promise.reject(falla);
        const v = Reflect.get(obj, prop) as unknown;
        return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(obj) : v;
      },
    });
    await expect(abrirTurno(dbRota, c.sesion, 0)).rejects.toBe(falla);
    await abrirTurno(e.env.DB, c.sesion, 0);
    await expect(
      registrarPago(dbRota, c.sesion, orden.id, {
        id: randomUUID(),
        metodo: "tarjeta_externa",
        montoCents: 100,
      }),
    ).rejects.toBe(falla);
    await expect(abrirTurno(e.env.DB, c.sesion, 0)).rejects.toBeInstanceOf(ErrorApp);
  });
});
