import { describe, expect, it } from "vitest";
import {
  aCentavos,
  aTextoEditable,
  calcularTotales,
  cantidadValida,
  estadoPago,
  porcentaje,
  saldo,
  totalLinea,
  vuelto,
  type LineaCalculo,
} from "@/lib/dinero";

const reglas = { impuestoBps: 825, recargoUrgenteBps: 5000, descuentoMaxBps: 1000 };
const camisa = (n = 1): LineaCalculo => ({
  precioUnitCents: 399,
  cantidad: n,
  unidad: "pieza",
  aplicaImpuesto: true,
});

describe("cálculo de una orden (candado de dinero)", () => {
  it("suma líneas y calcula impuesto redondeado", () => {
    const t = calcularTotales(
      [camisa(3), { precioUnitCents: 1250, cantidad: 1, unidad: "pieza", aplicaImpuesto: true }],
      false,
      null,
      reglas,
    );
    expect(t.subtotalCents).toBe(2447);
    expect(t.recargoCents).toBe(0);
    expect(t.impuestoCents).toBe(202); // 2447 × 8.25 % = 201.8775
    expect(t.totalCents).toBe(2649);
    expect(t.requiereAutorizacion).toBe(false);
  });

  it("aplica recargo urgente antes del impuesto", () => {
    const t = calcularTotales([camisa(2)], true, null, reglas);
    expect(t.subtotalCents).toBe(798);
    expect(t.recargoCents).toBe(399);
    expect(t.impuestoCents).toBe(porcentaje(1197, 825));
    expect(t.totalCents).toBe(1197 + 99);
  });

  it("cobra por libra con decimales sin errores de flotante", () => {
    const l: LineaCalculo = { precioUnitCents: 175, cantidad: 12.35, unidad: "libra", aplicaImpuesto: false };
    expect(totalLinea(l)).toBe(2161); // 175 × 12.35 = 2161.25
    const t = calcularTotales([l], false, null, reglas);
    expect(t.impuestoCents).toBe(0);
    expect(t.totalCents).toBe(2161);
  });

  it("solo cobra impuesto sobre lo gravable, prorrateando el descuento", () => {
    const lineas: LineaCalculo[] = [
      { precioUnitCents: 1000, cantidad: 1, unidad: "pieza", aplicaImpuesto: true },
      { precioUnitCents: 1000, cantidad: 1, unidad: "pieza", aplicaImpuesto: false },
    ];
    const t = calcularTotales(lineas, false, { tipo: "monto", cents: 200 }, reglas);
    expect(t.descuentoCents).toBe(200);
    // gravable neto = 1000 × 1800 / 2000 = 900 → impuesto 74.25 → 74
    expect(t.impuestoCents).toBe(74);
    expect(t.totalCents).toBe(1874);
  });

  it("descuento en porcentaje y aviso de autorización cuando pasa el máximo", () => {
    const chico = calcularTotales([camisa(10)], false, { tipo: "porcentaje", bps: 1000 }, reglas);
    expect(chico.descuentoCents).toBe(399);
    expect(chico.requiereAutorizacion).toBe(false);
    const grande = calcularTotales([camisa(10)], false, { tipo: "porcentaje", bps: 1500 }, reglas);
    expect(grande.requiereAutorizacion).toBe(true);
  });

  it("un descuento nunca deja el total en negativo", () => {
    const t = calcularTotales([camisa()], false, { tipo: "monto", cents: 99_999 }, reglas);
    expect(t.descuentoCents).toBe(399);
    expect(t.totalCents).toBe(0);
    const pct = calcularTotales([camisa()], false, { tipo: "porcentaje", bps: 50_000 }, reglas);
    expect(pct.descuentoCents).toBe(399);
    const neg = calcularTotales([camisa()], false, { tipo: "monto", cents: -50 }, reglas);
    expect(neg.descuentoCents).toBe(0);
  });

  it("orden vacía da cero", () => {
    expect(calcularTotales([], true, null, reglas).totalCents).toBe(0);
  });

  it("rechaza precios o cantidades inválidas", () => {
    expect(() => calcularTotales([{ ...camisa(), precioUnitCents: -1 }], false, null, reglas)).toThrow(
      RangeError,
    );
    expect(() => calcularTotales([{ ...camisa(), precioUnitCents: 1.5 }], false, null, reglas)).toThrow(
      RangeError,
    );
    expect(() => calcularTotales([camisa(1.5)], false, null, reglas)).toThrow(RangeError);
  });
});

describe("cantidades", () => {
  it("valida piezas y libras", () => {
    expect(cantidadValida(2, "pieza")).toBe(true);
    expect(cantidadValida(2.5, "pieza")).toBe(false);
    expect(cantidadValida(0, "pieza")).toBe(false);
    expect(cantidadValida(2.55, "libra")).toBe(true);
    expect(cantidadValida(2.555, "libra")).toBe(false);
    expect(cantidadValida(Number.NaN, "libra")).toBe(false);
    expect(cantidadValida(20_000, "libra")).toBe(false);
  });
});

describe("pagos y saldo", () => {
  it("estado de pago", () => {
    expect(estadoPago(1000, 0)).toBe("pendiente");
    expect(estadoPago(1000, 400)).toBe("abono");
    expect(estadoPago(1000, 1000)).toBe("pagada");
    expect(estadoPago(0, 0)).toBe("pagada");
  });

  it("saldo y vuelto nunca negativos", () => {
    expect(saldo(1000, 400)).toBe(600);
    expect(saldo(1000, 1200)).toBe(0);
    expect(vuelto(2000, 1649)).toBe(351);
    expect(vuelto(1000, 1649)).toBe(0);
  });
});

describe("importes escritos por una persona", () => {
  it.each([
    ["12", 1200],
    ["12.5", 1250],
    ["12,50", 1250],
    ["$1,234.56", 123456],
    ["1.234,56", 123456],
    ["1,234", 123400],
    [" 0.99 ", 99],
  ])("%s → %i", (texto, esperado) => {
    expect(aCentavos(texto)).toBe(esperado);
  });

  it.each(["", "abc", "12.345", "-5", "1e3"])("rechaza %s", (texto) => {
    expect(aCentavos(texto)).toBeNull();
  });

  it("vuelve a texto editable", () => {
    expect(aTextoEditable(1250)).toBe("12.50");
  });
});
