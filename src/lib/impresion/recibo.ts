/**
 * El recibo, en líneas. Se arma UNA vez aquí y de estas líneas sale el papel
 * de la impresora conectada directo (ESC/POS). Usa los mismos textos del
 * diccionario que el recibo de pantalla, para que los dos digan lo mismo.
 */
import { diccionario, fmt, formatoDinero, formatoFecha, textoBilingue, type Idioma } from "@/lib/i18n";
import { cantidadConPeso, resolverUnidadPeso } from "@/lib/peso";
import type { DatosTienda } from "@/server/ajustes/tienda";
import type { Orden, PrendaOrden } from "@/server/ordenes/consultas";
import { EscPos } from "./escpos";

export type LineaRecibo =
  | { t: "texto"; texto: string; alinear?: "izq" | "centro" | "der"; negrita?: boolean; grande?: 2 | 3 }
  | { t: "columnas"; izq: string; der: string; negrita?: boolean }
  | { t: "separador" }
  | { t: "qr"; datos: string }
  | { t: "espacio" };

function agrupar(prendas: PrendaOrden[]) {
  const m = new Map<string, { p: PrendaOrden; cantidad: number; total: number }>();
  for (const p of prendas.filter((x) => x.estado !== "anulada")) {
    const k = `${p.prendaEs}|${p.servicioEs}|${p.precioUnitCents}|${p.unidad}`;
    const g = m.get(k) ?? { p, cantidad: 0, total: 0 };
    g.cantidad = Math.round((g.cantidad + p.cantidad) * 100) / 100;
    g.total += p.totalCents;
    m.set(k, g);
  }
  return [...m.values()];
}

export function lineasRecibo(
  orden: Orden,
  tienda: DatosTienda,
  idioma: Idioma,
  opciones: { interna: boolean; enlace: string },
): LineaRecibo[] {
  const d = diccionario(idioma);
  const di = d.impresion;
  const dinero = (n: number) => formatoDinero(n, tienda.moneda, idioma, tienda.pais);
  const fecha = (n: number) =>
    formatoFecha(n, idioma, tienda.zonaHoraria, { dateStyle: "medium", timeStyle: "short" }, tienda.pais);
  const peso = resolverUnidadPeso(tienda.unidadPeso, tienda.pais);
  const l: LineaRecibo[] = [];
  const centro = (texto: string, extra: Partial<Extract<LineaRecibo, { t: "texto" }>> = {}) =>
    l.push({ t: "texto", texto, alinear: "centro", ...extra });

  centro(tienda.nombre, { negrita: true, grande: 2 });
  const direccion = [tienda.direccion, tienda.ciudad, tienda.estadoRegion].filter(Boolean).join(", ");
  if (direccion) centro(direccion);
  if (tienda.telefono) centro(tienda.telefono);
  if (opciones.interna) centro(di.copiaInterna, { negrita: true });
  l.push({ t: "espacio" });
  centro(di.orden.toUpperCase());
  centro(`#${orden.numero}`, { negrita: true, grande: 3 });
  centro(d.ordenes.dias[orden.dia] ?? "", { negrita: true });
  if (orden.urgente) centro(`** ${di.urgente} **`, { negrita: true });
  l.push({ t: "espacio" });

  const nombre = opciones.interna
    ? `${orden.cliente.nombre} ${orden.cliente.apellido ?? ""}`.trim()
    : orden.cliente.nombre;
  l.push({ t: "columnas", izq: `${di.cliente}:`, der: nombre, negrita: true });
  l.push({ t: "columnas", izq: `${di.recibida}:`, der: fecha(orden.creadaEn) });
  l.push({ t: "columnas", izq: `${di.lista}:`, der: fecha(orden.fechaPromesa), negrita: true });
  l.push({ t: "separador" });

  for (const { p, cantidad, total } of agrupar(orden.prendas)) {
    const cuanto = p.unidad === "libra" ? cantidadConPeso(cantidad, peso) : `${cantidad}x`;
    l.push({
      t: "columnas",
      izq: `${cuanto} ${textoBilingue(idioma, p.prendaEs, p.prendaEn)}`,
      der: dinero(total),
    });
    l.push({ t: "texto", texto: `   ${textoBilingue(idioma, p.servicioEs, p.servicioEn)}` });
  }

  const conMarcas = orden.prendas.filter((p) => p.estado !== "anulada" && (p.notas || p.color));
  if (conMarcas.length) {
    l.push({ t: "separador" });
    l.push({ t: "texto", texto: di.marcasPrendas, negrita: true });
    for (const p of conMarcas)
      l.push({
        t: "texto",
        texto: `* ${textoBilingue(idioma, p.prendaEs, p.prendaEn)} [${p.codigoEtiqueta}] ${[p.color, opciones.interna ? p.marca : null, p.notas].filter(Boolean).join(" · ")}`,
      });
  }

  l.push({ t: "separador" });
  l.push({ t: "columnas", izq: di.subtotal, der: dinero(orden.subtotalCents) });
  if (orden.recargoCents > 0) l.push({ t: "columnas", izq: di.recargo, der: dinero(orden.recargoCents) });
  if (orden.descuentoCents > 0)
    l.push({ t: "columnas", izq: di.descuento, der: `-${dinero(orden.descuentoCents)}` });
  if (orden.impuestoCents > 0)
    l.push({
      t: "columnas",
      izq: `${di.impuesto} (${orden.impuestoBps / 100}%)`,
      der: dinero(orden.impuestoCents),
    });
  l.push({ t: "columnas", izq: di.total.toUpperCase(), der: dinero(orden.totalCents), negrita: true });
  l.push({ t: "columnas", izq: di.pagado, der: dinero(orden.pagadoCents) });
  l.push({ t: "columnas", izq: di.saldo, der: dinero(orden.saldoCents), negrita: true });

  const pagos = orden.pagos.filter((p) => !p.anuladoEn);
  if (pagos.length) {
    l.push({ t: "espacio" });
    l.push({ t: "texto", texto: di.pagos, negrita: true });
    for (const p of pagos)
      l.push({
        t: "columnas",
        izq: `${fecha(p.creadoEn)} · ${di.metodos[p.metodo as keyof typeof di.metodos] ?? p.metodo}`,
        der: dinero(p.montoCents),
      });
  }

  if (opciones.interna && orden.notas) {
    l.push({ t: "separador" });
    l.push({ t: "texto", texto: `${di.notas}: ${orden.notas}` });
  }

  if (!opciones.interna) {
    l.push({ t: "espacio" });
    centro(di.consulta);
    l.push({ t: "qr", datos: opciones.enlace });
    centro(opciones.enlace);
    l.push({ t: "espacio" });
    centro(fmt(di.politica, { dias: tienda.diasAbandono }));
    centro(di.gracias, { negrita: true });
  }
  return l;
}

/** Parte un texto largo en renglones que caben en el papel, sin cortar palabras. */
export function partir(texto: string, ancho: number): string[] {
  const renglones: string[] = [];
  let actual = "";
  for (const palabra of texto.split(/\s+/).filter(Boolean)) {
    if (actual && (actual + " " + palabra).length > ancho) {
      renglones.push(actual);
      actual = "";
    }
    let resto = palabra;
    while (resto.length > ancho) {
      renglones.push(resto.slice(0, ancho));
      resto = resto.slice(ancho);
    }
    actual = actual ? `${actual} ${resto}` : resto;
  }
  if (actual) renglones.push(actual);
  return renglones.length ? renglones : [""];
}

/** Las líneas del recibo convertidas en los bytes que entiende la impresora. */
export function reciboAEscPos(
  lineas: LineaRecibo[],
  opciones: { ancho?: 48 | 42 | 32; cortar?: boolean; abrirCajon?: boolean } = {},
): Uint8Array {
  const ancho = opciones.ancho ?? 48;
  const p = new EscPos(ancho).iniciar();
  if (opciones.abrirCajon) p.abrirCajon();
  for (const l of lineas) {
    switch (l.t) {
      case "espacio":
        p.salto();
        break;
      case "separador":
        p.alinear("izq").separador();
        break;
      case "columnas":
        p.alinear("izq").negrita(Boolean(l.negrita)).columnas(l.izq, l.der).negrita(false);
        break;
      case "qr":
        p.alinear("centro").qr(l.datos).salto();
        break;
      case "texto": {
        const escala = l.grande ?? 1;
        p.alinear(l.alinear ?? "izq").negrita(Boolean(l.negrita));
        if (escala > 1) p.tamano(escala);
        for (const r of partir(l.texto, Math.floor(ancho / escala))) p.linea(r);
        if (escala > 1) p.tamano(1);
        p.negrita(false);
        break;
      }
    }
  }
  if (opciones.cortar !== false) p.cortar();
  return p.bytes();
}
