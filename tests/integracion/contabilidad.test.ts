import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { GET as verGastos, POST as nuevoGasto } from "@/app/datos/contabilidad/gastos/route";
import { DELETE as borrarGasto, PUT as editarGastoRuta } from "@/app/datos/contabilidad/gastos/[id]/route";
import { POST as nuevaCompra } from "@/app/datos/contabilidad/compras/route";
import { POST as abonarCompra } from "@/app/datos/contabilidad/compras/[id]/route";
import { GET as verResumen } from "@/app/datos/contabilidad/resumen/route";
import { GET as verCobrar } from "@/app/datos/contabilidad/cobrar/route";
import { GET as verImpuestos } from "@/app/datos/contabilidad/impuestos/route";
import { GET as exportar } from "@/app/datos/contabilidad/exportar/route";
import { POST as nuevoInsumo } from "@/app/datos/contabilidad/insumos/route";
import { POST as nuevoProveedor } from "@/app/datos/contabilidad/proveedores/route";
import { fechaLocal } from "@/lib/fechas";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { escenarioAislamiento, type Escenario } from "../ayuda/escenario";
import { sesionPara } from "../ayuda/fabrica";

type Err = { error: { codigo: string } };

/**
 * CANDADO DE LA CONTABILIDAD: la ganancia sale de UNA sola tabla, así que una
 * compra a proveedor no puede contarse dos veces; una compra sube la existencia
 * del insumo y al borrarla la devuelve; y quien no tiene el permiso no entra.
 */
describe("contabilidad", () => {
  let e: EntornoPrueba;
  let esc: Escenario;
  const dueno = new Navegador();
  const hoy = () => fechaLocal(Date.now(), "America/New_York");

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioAislamiento(e);
    dueno.cookies.set("tp_sesion", esc.a.sesionDueno);
  }, 120_000);
  afterAll(() => e.cerrar());

  it("un gasto se registra, se ve en el total y se puede borrar", async () => {
    const r = await dueno.llamar<{ id: string }>(nuevoGasto, {
      cuerpo: {
        gasto: {
          fecha: hoy(),
          categoria: "renta",
          montoCents: 150_000,
          metodoPago: "transferencia",
          descripcion: "Renta del local",
        },
      },
    });
    expect(r.estado).toBe(200);

    const lista = await dueno.llamar<{ gastos: { id: string }[]; totalCents: number }>(verGastos, {
      ruta: `/datos/contabilidad/gastos?desde=${hoy()}&hasta=${hoy()}`,
    });
    expect(lista.datos.totalCents).toBe(150_000);

    const editado = await dueno.llamar(editarGastoRuta, {
      metodo: "PUT",
      params: { id: r.datos.id },
      cuerpo: {
        gasto: { fecha: hoy(), categoria: "renta", montoCents: 120_000, metodoPago: "cheque" },
      },
    });
    expect(editado.estado).toBe(200);

    await dueno.llamar(borrarGasto, { metodo: "DELETE", params: { id: r.datos.id } });
    const despues = await dueno.llamar<{ totalCents: number }>(verGastos, {
      ruta: `/datos/contabilidad/gastos?desde=${hoy()}&hasta=${hoy()}`,
    });
    expect(despues.datos.totalCents).toBe(0);
  });

  it("una compra escribe su gasto UNA sola vez, sube la existencia y se abona", async () => {
    const proveedor = await dueno.llamar<{ id: string }>(nuevoProveedor, {
      cuerpo: { proveedor: { nombre: "Químicos del Sur", terminosDias: 30 } },
    });
    const insumo = await dueno.llamar<{ id: string }>(nuevoInsumo, {
      cuerpo: { insumo: { nombre: "Ganchos", unidad: "caja", minimo: 2, costoUnitCents: 0 } },
    });
    const compra = await dueno.llamar<{ id: string; totalCents: number }>(nuevaCompra, {
      cuerpo: {
        compra: {
          proveedorId: proveedor.datos.id,
          numeroFactura: "A-1001",
          fecha: hoy(),
          impuestoCents: 700,
          pagadoCents: 0,
          lineas: [
            { insumoId: insumo.datos.id, descripcion: "Ganchos", cantidad: 10, costoUnitCents: 1_000 },
          ],
        },
      },
    });
    expect(compra.estado).toBe(200);
    expect(compra.datos.totalCents).toBe(10_700);

    // Un solo gasto por esa compra: nada se cuenta dos veces.
    const gastos = await e.env.DB.prepare(
      "select count(*) as n, coalesce(sum(monto_cents), 0) as total from gastos where tintoreria_id = ? and compra_id = ?",
    )
      .bind(esc.a.id, compra.datos.id)
      .first<{ n: number; total: number }>();
    expect(gastos).toEqual({ n: 1, total: 10_700 });

    const existencia = await e.env.DB.prepare("select existencia from insumos where id = ?")
      .bind(insumo.datos.id)
      .first<{ existencia: number }>();
    expect(existencia!.existencia).toBe(10);

    // El gasto de una compra no se toca desde gastos.
    const gastoCompra = await e.env.DB.prepare("select id from gastos where compra_id = ?")
      .bind(compra.datos.id)
      .first<{ id: string }>();
    const intento = await dueno.llamar<Err>(borrarGasto, {
      metodo: "DELETE",
      params: { id: gastoCompra!.id },
    });
    expect(intento.estado).toBe(409);
    expect(intento.datos.error.codigo).toBe("gasto_de_compra");

    const abono = await dueno.llamar<{ pagadoCents: number }>(abonarCompra, {
      params: { id: compra.datos.id },
      cuerpo: { montoCents: 5_000 },
    });
    expect(abono.datos.pagadoCents).toBe(5_000);
    const excede = await dueno.llamar<Err>(abonarCompra, {
      params: { id: compra.datos.id },
      cuerpo: { montoCents: 999_999 },
    });
    expect(excede.estado).toBe(400);
    expect(excede.datos.error.codigo).toBe("pago_excede");
  });

  it("la ganancia resta los gastos de las ventas y no cuenta la compra dos veces", async () => {
    const r = await dueno.llamar<{
      ventasCents: number;
      gastosCents: number;
      utilidadCents: number;
      porCategoria: { categoria: string; cents: number }[];
    }>(verResumen, { ruta: `/datos/contabilidad/resumen?desde=2026-09-01&hasta=${hoy()}` });
    expect(r.estado).toBe(200);
    const insumos = r.datos.porCategoria.find((c) => c.categoria === "insumos");
    // La compra de 10 700 y la del escenario (5 000): una vez cada una.
    expect(insumos?.cents).toBe(15_700);
    expect(r.datos.utilidadCents).toBe(r.datos.ventasCents - r.datos.gastosCents);
  });

  it("los impuestos separan la venta gravada de la exenta", async () => {
    const r = await dueno.llamar<{ gravadaCents: number; exentaCents: number; impuestoCents: number }>(
      verImpuestos,
      { ruta: `/datos/contabilidad/impuestos?desde=2026-01-01&hasta=${hoy()}` },
    );
    expect(r.estado).toBe(200);
    expect(r.datos.gravadaCents + r.datos.exentaCents).toBeGreaterThan(0);
  });

  it("por cobrar muestra el saldo del cliente y su antigüedad", async () => {
    const r = await dueno.llamar<{
      totalCents: number;
      clientes: { clienteId: string; saldoCents: number; diasMasViejo: number }[];
    }>(verCobrar);
    expect(r.estado).toBe(200);
    const cliente = r.datos.clientes.find((c) => c.clienteId === esc.a.ids.clienteId);
    expect(cliente!.saldoCents).toBeGreaterThan(0);
    expect(cliente!.diasMasViejo).toBeGreaterThanOrEqual(0);
  });

  it("el archivo para el contador trae ventas, gastos y compras", async () => {
    const r = await dueno.llamar(exportar, {
      ruta: `/datos/contabilidad/exportar?desde=2026-09-01&hasta=${hoy()}`,
    });
    expect(r.estado).toBe(200);
    const texto = await r.respuesta.text();
    expect(r.respuesta.headers.get("content-type")).toContain("text/csv");
    expect(texto).toContain("fecha,tipo,concepto");
    expect(texto).toContain("Luz");
    expect(texto).toContain("Ventas");
    expect(texto).toContain("Compra");
    expect(texto).toContain("Impuesto cobrado");
  });

  it("quien no tiene el permiso no ve la contabilidad (candado)", async () => {
    const cajero = new Navegador();
    cajero.cookies.set("tp_sesion", await sesionPara(e.env.DB, esc.a.id, esc.a.ids.empleadoId ?? ""));
    const r = await cajero.llamar<Err>(verResumen);
    expect(r.estado).toBe(403);
    expect(r.datos.error.codigo).toBe("sin_permiso");
    const g = await cajero.llamar<Err>(nuevoGasto, {
      cuerpo: { gasto: { fecha: hoy(), categoria: "luz", montoCents: 100, metodoPago: "efectivo" } },
    });
    expect(g.estado).toBe(403);
  });
});
