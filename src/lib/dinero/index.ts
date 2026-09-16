/**
 * Cálculos de dinero de Tintora POS. TODO en centavos enteros y puntos básicos
 * (1 bps = 0,01 %). Nunca se suman decimales flotantes.
 * Candado: tests/unit/dinero.test.ts (cobertura mínima 90 %).
 */

export type Unidad = "pieza" | "libra";

export interface LineaCalculo {
  precioUnitCents: number;
  /** Piezas (entero) o libras (hasta 2 decimales). */
  cantidad: number;
  unidad: Unidad;
  aplicaImpuesto: boolean;
}

export type Descuento = { tipo: "monto"; cents: number } | { tipo: "porcentaje"; bps: number } | null;

export interface ReglasPrecio {
  impuestoBps: number;
  recargoUrgenteBps: number;
  descuentoMaxBps: number;
}

export interface Totales {
  subtotalCents: number;
  recargoCents: number;
  descuentoCents: number;
  impuestoCents: number;
  totalCents: number;
  /** El descuento pasa el máximo permitido sin autorización de gerente. */
  requiereAutorizacion: boolean;
}

/** Redondeo al entero más cercano; las mitades suben (valores no negativos). */
export function redondear(n: number): number {
  return Math.round(n);
}

/** a × bps / 10 000, en enteros, redondeado. */
export function porcentaje(cents: number, bps: number): number {
  return redondear((cents * bps) / 10_000);
}

/** Cantidad válida: piezas enteras ≥ 1; libras > 0 con máximo 2 decimales. */
export function cantidadValida(cantidad: number, unidad: Unidad): boolean {
  if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 10_000) return false;
  if (unidad === "pieza") return Number.isInteger(cantidad);
  return Math.abs(Math.round(cantidad * 100) - cantidad * 100) < 1e-6;
}

export function totalLinea(l: Pick<LineaCalculo, "precioUnitCents" | "cantidad">): number {
  const centesimas = Math.round(l.cantidad * 100);
  return redondear((l.precioUnitCents * centesimas) / 100);
}

export function calcularTotales(
  lineas: LineaCalculo[],
  urgente: boolean,
  descuento: Descuento,
  reglas: ReglasPrecio,
): Totales {
  let subtotal = 0;
  let gravable = 0;
  for (const l of lineas) {
    if (!Number.isInteger(l.precioUnitCents) || l.precioUnitCents < 0)
      throw new RangeError("Precio inválido");
    if (!cantidadValida(l.cantidad, l.unidad)) throw new RangeError("Cantidad inválida");
    const t = totalLinea(l);
    subtotal += t;
    if (l.aplicaImpuesto) gravable += t;
  }
  const recargo = urgente ? porcentaje(subtotal, reglas.recargoUrgenteBps) : 0;
  const base = subtotal + recargo;

  let descuentoCents = 0;
  if (descuento?.tipo === "monto") descuentoCents = Math.max(0, Math.trunc(descuento.cents));
  if (descuento?.tipo === "porcentaje")
    descuentoCents = porcentaje(base, Math.max(0, Math.min(10_000, descuento.bps)));
  descuentoCents = Math.min(descuentoCents, base);

  const neto = base - descuentoCents;
  const gravableNeto = subtotal === 0 ? 0 : redondear((gravable * neto) / subtotal);
  const impuesto = porcentaje(gravableNeto, reglas.impuestoBps);
  const maximoSinAutorizacion = porcentaje(base, reglas.descuentoMaxBps);

  return {
    subtotalCents: subtotal,
    recargoCents: recargo,
    descuentoCents,
    impuestoCents: impuesto,
    totalCents: neto + impuesto,
    requiereAutorizacion: descuentoCents > maximoSinAutorizacion,
  };
}

export type EstadoPago = "pagada" | "abono" | "pendiente";

export function estadoPago(totalCents: number, pagadoCents: number): EstadoPago {
  if (pagadoCents >= totalCents) return "pagada";
  if (pagadoCents > 0) return "abono";
  return "pendiente";
}

export function saldo(totalCents: number, pagadoCents: number): number {
  return Math.max(0, totalCents - pagadoCents);
}

/** Vuelto a entregar cuando el cliente paga en efectivo con más de lo que debe. */
export function vuelto(recibidoCents: number, aCobrarCents: number): number {
  return Math.max(0, recibidoCents - aCobrarCents);
}

/**
 * Convierte lo que escribe una persona («12», «12.5», «12,50», «$1,234.56») a
 * centavos. Devuelve null si no es un importe válido.
 */
export function aCentavos(texto: string): number | null {
  let t = texto.trim().replace(/[\s$€]/g, "");
  if (t === "") return null;
  const ultimaComa = t.lastIndexOf(",");
  const ultimoPunto = t.lastIndexOf(".");
  if (ultimaComa > -1 && ultimoPunto > -1) {
    // El separador que va último es el decimal.
    t = ultimaComa > ultimoPunto ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else if (ultimaComa > -1) {
    const dec = t.length - ultimaComa - 1;
    t = dec === 3 ? t.replace(/,/g, "") : t.replace(",", ".");
  }
  const trozos = t.split(".");
  const [entero = "", dec = ""] = trozos;
  if (trozos.length > 2 || !/^\d+$/.test(entero) || (trozos.length === 2 && !/^\d{1,2}$/.test(dec)))
    return null;
  const cents = Number(entero) * 100 + Number(dec.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Centavos a texto editable simple, sin símbolo: 1234 → «12.34». */
export function aTextoEditable(cents: number): string {
  return (cents / 100).toFixed(2);
}
