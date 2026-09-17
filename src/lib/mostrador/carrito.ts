/**
 * Carrito del mostrador: lógica pura (sin React) para poder probarla y usarla
 * igual con y sin conexión. Cada pieza física es una fila con su id y su código
 * de etiqueta generados en el dispositivo (así se imprime aunque no haya internet).
 */
import { codigoEtiqueta, nuevoId } from "@/lib/codigos";
import {
  calcularTotales,
  totalLinea,
  type Descuento,
  type ReglasPrecio,
  type Totales,
  type Unidad,
} from "@/lib/dinero";

export interface ServicioCarrito {
  id: string;
  nombreEs: string;
  nombreEn: string | null;
  unidad: Unidad;
  aplicaImpuesto: boolean;
  diasEntrega: number | null;
}

export interface PrendaCarrito {
  id: string;
  nombreEs: string;
  nombreEn: string | null;
}

export interface Pieza {
  id: string;
  codigoEtiqueta: string;
  prendaId: string | null;
  servicioId: string;
  cantidad: number;
  precioUnitCents: number;
  /** El precio se escribió a mano (no es el de la lista). */
  precioManual: boolean;
  color: string;
  marca: string;
  /** Daños y manchas marcados con un toque en el mostrador (ya en el idioma de la tienda). */
  marcas: string[];
  notas: string;
}

export interface Carrito {
  piezas: Pieza[];
  urgente: boolean;
  descuento: Descuento;
  descuentoMotivo: string;
  notas: string;
  fechaPromesa: number | null;
}

export const carritoVacio = (): Carrito => ({
  piezas: [],
  urgente: false,
  descuento: null,
  descuentoMotivo: "",
  notas: "",
  fechaPromesa: null,
});

export type Accion =
  | {
      tipo: "agregar";
      prendaId: string | null;
      servicioId: string;
      precioUnitCents: number;
      precioManual: boolean;
      cantidad?: number;
      unidad: Unidad;
    }
  | { tipo: "marcarPieza"; id: string; marca: string }
  | { tipo: "quitarUna"; clave: string }
  | { tipo: "quitarUltimaDe"; servicioId: string; prendaId: string | null }
  | { tipo: "quitarGrupo"; clave: string }
  | { tipo: "precioGrupo"; clave: string; precioUnitCents: number; precioManual: boolean }
  | {
      tipo: "editarPieza";
      id: string;
      cambios: Partial<Pick<Pieza, "color" | "marca" | "notas" | "cantidad">>;
    }
  | { tipo: "urgente"; valor: boolean }
  | { tipo: "descuento"; valor: Descuento; motivo?: string }
  | { tipo: "notas"; valor: string }
  | { tipo: "fechaPromesa"; valor: number | null }
  | { tipo: "vaciar" };

export function claveGrupo(p: Pick<Pieza, "prendaId" | "servicioId" | "precioUnitCents">): string {
  return `${p.servicioId}|${p.prendaId ?? ""}|${p.precioUnitCents}`;
}

export function reducirCarrito(c: Carrito, a: Accion): Carrito {
  switch (a.tipo) {
    case "agregar": {
      const nueva: Pieza = {
        id: nuevoId(),
        codigoEtiqueta: codigoEtiqueta(),
        prendaId: a.prendaId,
        servicioId: a.servicioId,
        cantidad: a.unidad === "libra" ? Math.round((a.cantidad ?? 1) * 100) / 100 : 1,
        precioUnitCents: a.precioUnitCents,
        precioManual: a.precioManual,
        color: "",
        marca: "",
        marcas: [],
        notas: "",
      };
      return { ...c, piezas: [...c.piezas, nueva] };
    }
    case "quitarUna": {
      const i = c.piezas.map((p) => claveGrupo(p)).lastIndexOf(a.clave);
      if (i < 0) return c;
      return { ...c, piezas: c.piezas.filter((_, j) => j !== i) };
    }
    case "quitarUltimaDe": {
      const i = c.piezas.findLastIndex((p) => p.servicioId === a.servicioId && p.prendaId === a.prendaId);
      if (i < 0) return c;
      return { ...c, piezas: c.piezas.filter((_, j) => j !== i) };
    }
    case "quitarGrupo":
      return { ...c, piezas: c.piezas.filter((p) => claveGrupo(p) !== a.clave) };
    case "precioGrupo":
      return {
        ...c,
        piezas: c.piezas.map((p) =>
          claveGrupo(p) === a.clave
            ? { ...p, precioUnitCents: a.precioUnitCents, precioManual: a.precioManual }
            : p,
        ),
      };
    case "marcarPieza":
      return {
        ...c,
        piezas: c.piezas.map((p) =>
          p.id === a.id
            ? {
                ...p,
                marcas: p.marcas.includes(a.marca)
                  ? p.marcas.filter((m) => m !== a.marca)
                  : [...p.marcas, a.marca],
              }
            : p,
        ),
      };
    case "editarPieza":
      return { ...c, piezas: c.piezas.map((p) => (p.id === a.id ? { ...p, ...a.cambios } : p)) };
    case "urgente":
      return { ...c, urgente: a.valor };
    case "descuento":
      return { ...c, descuento: a.valor, descuentoMotivo: a.motivo ?? c.descuentoMotivo };
    case "notas":
      return { ...c, notas: a.valor };
    case "fechaPromesa":
      return { ...c, fechaPromesa: a.valor };
    case "vaciar":
      return carritoVacio();
  }
}

export interface Grupo {
  clave: string;
  prendaId: string | null;
  servicioId: string;
  precioUnitCents: number;
  precioManual: boolean;
  piezas: Pieza[];
  cantidadTotal: number;
  totalCents: number;
}

export function agrupar(piezas: Pieza[]): Grupo[] {
  const mapa = new Map<string, Grupo>();
  for (const p of piezas) {
    const clave = claveGrupo(p);
    let g = mapa.get(clave);
    if (!g) {
      g = {
        clave,
        prendaId: p.prendaId,
        servicioId: p.servicioId,
        precioUnitCents: p.precioUnitCents,
        precioManual: p.precioManual,
        piezas: [],
        cantidadTotal: 0,
        totalCents: 0,
      };
      mapa.set(clave, g);
    }
    g.piezas.push(p);
    g.cantidadTotal = Math.round((g.cantidadTotal + p.cantidad) * 100) / 100;
    g.totalCents += totalLinea(p);
  }
  return [...mapa.values()];
}

export function totalesCarrito(
  c: Carrito,
  servicios: Map<string, ServicioCarrito>,
  reglas: ReglasPrecio,
): Totales {
  return calcularTotales(
    c.piezas.map((p) => {
      const s = servicios.get(p.servicioId);
      return {
        precioUnitCents: p.precioUnitCents,
        cantidad: p.cantidad,
        unidad: s?.unidad ?? "pieza",
        aplicaImpuesto: s?.aplicaImpuesto ?? true,
      };
    }),
    c.urgente,
    c.descuento,
    reglas,
  );
}

/** Días de entrega de la orden: el servicio más lento manda. */
export function diasEntregaCarrito(
  c: Carrito,
  servicios: Map<string, ServicioCarrito>,
  diasTienda: number,
): number {
  return (
    c.piezas.reduce((max, p) => Math.max(max, servicios.get(p.servicioId)?.diasEntrega ?? diasTienda), 0) ||
    diasTienda
  );
}

/** Cuántas piezas de cada prenda+servicio hay (para los contadores sobre los botones). */
export function conteoPorBoton(piezas: Pieza[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of piezas) {
    const k = `${p.servicioId}|${p.prendaId ?? ""}`;
    m.set(k, (m.get(k) ?? 0) + (p.prendaId ? 1 : 0));
  }
  return m;
}

/**
 * Lo que se guarda en la orden como «manchas o daños»: primero lo marcado con
 * un toque, después lo que el empleado escribió a mano.
 */
export function notasDePieza(p: Pick<Pieza, "marcas" | "notas">): string {
  return [...p.marcas, p.notas.trim()].filter(Boolean).join(" · ");
}
