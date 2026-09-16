import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { GET as ventas } from "@/app/datos/reportes/route";
import { GET as operacion } from "@/app/datos/reportes/operacion/route";
import { nuevoId } from "@/lib/codigos";
import { fechaLocal } from "@/lib/fechas";
import { crearOrden } from "@/server/ordenes/crear";
import { anularOrden } from "@/server/ordenes/acciones";
import { cambiarEstado } from "@/server/ordenes/estados";
import { fechasDelRango, rangoPreset, type ReporteOperacion, type ReporteVentas } from "@/server/reportes";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { escenarioAislamiento, type Escenario } from "../ayuda/escenario";
import { sesionPara } from "../ayuda/fabrica";
import { sesionDe } from "../ayuda/sesion";

describe("reportes", () => {
  let e: EntornoPrueba;
  let esc: Escenario;
  let dueno: Navegador;

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioAislamiento(e);
    const s = await sesionDe(e.env.DB, esc.a.sesionDueno);
    const pieza = () => ({
      id: nuevoId(),
      prendaId: esc.a.ids.prendaId!,
      servicioId: esc.a.ids.servicioId!,
      cantidad: 1,
    });
    await crearOrden(e.env.DB, s, {
      id: nuevoId(),
      cliente: { id: esc.a.ids.clienteId! },
      prendas: [pieza(), pieza()],
      urgente: false,
      pago: { id: nuevoId(), metodo: "tarjeta_externa", montoCents: 1554 },
    });
    const anular = nuevoId();
    await crearOrden(e.env.DB, s, {
      id: anular,
      cliente: { id: esc.a.ids.clienteId! },
      prendas: [pieza()],
      urgente: false,
      descuento: { tipo: "monto", cents: 77 },
    });
    await anularOrden(e.env.DB, s, anular, "Prueba", undefined);
    dueno = new Navegador();
    dueno.cookies.set("tp_sesion", esc.a.sesionDueno);
  });
  afterAll(() => e.cerrar());

  it("rangos y días del rango", () => {
    expect(rangoPreset("hoy", "2026-09-16")).toEqual(["2026-09-16", "2026-09-16"]);
    expect(rangoPreset("ayer", "2026-09-16")).toEqual(["2026-09-15", "2026-09-15"]);
    expect(rangoPreset("7", "2026-09-16")).toEqual(["2026-09-10", "2026-09-16"]);
    expect(rangoPreset("30", "2026-09-16")[0]).toBe("2026-08-18");
    expect(rangoPreset("mes", "2026-09-16")).toEqual(["2026-09-01", "2026-09-16"]);
    expect(fechasDelRango("2026-12-30", "2027-01-02")).toEqual([
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });

  it("ventas: cobrado, vendido, ticket promedio, métodos, servicios y empleados", async () => {
    const r = await dueno.llamar<ReporteVentas>(ventas, { ruta: "/datos/reportes?preset=hoy" });
    expect(r.estado).toBe(200);
    const hoy = fechaLocal(Date.now(), "America/New_York");
    // Escenario: orden con abono en efectivo de 1.00 + orden con tarjeta 15.54 + orden anulada.
    expect(r.datos).toMatchObject({
      desde: hoy,
      hasta: hoy,
      cobradoCents: 100 + 1554,
      pagos: 2,
      ordenes: 3,
      anuladas: 1,
      descuentosCents: 77,
    });
    expect(r.datos.vendidoCents).toBe(777 + 1554 + 700);
    expect(r.datos.ticketPromedioCents).toBe(Math.round((777 + 1554 + 700) / 2));
    expect(r.datos.porMetodo).toEqual([
      { metodo: "tarjeta_externa", cents: 1554, pagos: 1 },
      { metodo: "efectivo", cents: 100, pagos: 1 },
    ]);
    expect(r.datos.porServicio[0]).toMatchObject({ servicioEs: "Lavado en seco", piezas: 3 });
    expect(r.datos.porEmpleado[0]).toMatchObject({
      nombre: expect.stringContaining("Dueño"),
      cobradoCents: 1654,
      ordenes: 3,
      anuladas: 1,
    });
    expect(r.datos.porDia).toEqual([{ fecha: hoy, cobradoCents: 1654, ordenes: 3 }]);
    expect(JSON.stringify(r.datos)).not.toContain("marca-unica-bbbb");
  });

  it("CSV por día y fechas inválidas", async () => {
    const csv = await dueno.llamar<string>(ventas, {
      ruta: "/datos/reportes?desde=2026-01-01&hasta=2026-01-03&formato=csv",
    });
    expect(String(csv.datos)).toBe(
      "fecha,cobrado,ordenes\r\n2026-01-01,0.00,0\r\n2026-01-02,0.00,0\r\n2026-01-03,0.00,0\r\n",
    );
    expect(
      (await dueno.llamar(ventas, { ruta: "/datos/reportes?desde=2026-02-01&hasta=2026-01-01" })).estado,
    ).toBe(400);
    expect((await dueno.llamar(ventas, { ruta: "/datos/reportes?desde=ayer&hasta=hoy" })).estado).toBe(400);
    const cajero = new Navegador();
    cajero.cookies.set(
      "tp_sesion",
      await sesionPara(e.env.DB, esc.a.id, esc.a.ids.empleadoId!, {
        tipo: "pin",
        dispositivoId: esc.a.dispositivoId,
      }),
    );
    expect((await cajero.llamar(ventas)).estado).toBe(403);
    expect((await cajero.llamar(operacion)).estado).toBe(200);
  });

  it("operación: atrasadas, sin recoger y candidatas a abandono", async () => {
    await e.env.DB.prepare("update ordenes set fecha_promesa = 1 where id = ?").bind(esc.a.ids.ordenId).run();
    let r = await dueno.llamar<ReporteOperacion>(operacion);
    expect(r.datos.atrasadas.map((o) => o.id)).toContain(esc.a.ids.ordenId);
    const s = await sesionDe(e.env.DB, esc.a.sesionDueno);
    await cambiarEstado(e.env.DB, s, esc.a.ids.ordenId!, { estado: "lista" });
    await e.env.DB.prepare("update ordenes set lista_en = ? where id = ?")
      .bind(Date.now() - 100 * 86_400_000, esc.a.ids.ordenId)
      .run();
    r = await dueno.llamar<ReporteOperacion>(operacion);
    expect(r.datos.atrasadas.map((o) => o.id)).not.toContain(esc.a.ids.ordenId);
    expect(r.datos.sinRecoger[0]).toMatchObject({ id: esc.a.ids.ordenId, saldoCents: 677 });
    expect(r.datos.paraAbandono.map((o) => o.id)).toEqual([esc.a.ids.ordenId]);
  });
});
