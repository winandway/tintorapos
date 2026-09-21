/**
 * Etiquetas de prenda para la impresora conectada directo. Las etiqueteras NO
 * hablan el idioma de las de recibos; hablan uno de estos:
 *
 *  - **TSPL**: casi todas las económicas (Rollo, Munbyn, Polono, iDPRT, TSC,
 *    Xprinter, Jadens…).
 *  - **ZPL**: las Zebra.
 *  - **ESC/POS**: no es de etiqueteras, pero sirve para sacar la etiqueta en
 *    papel por la MISMA impresora de recibos (se grapa a la prenda). Es como se
 *    prueba todo el recorrido sin comprar nada.
 *
 * En los tres el código QR lo dibuja la impresora: sale nítido y son pocos
 * bytes. Candado: tests/unit/etiquetas-impresora.test.ts.
 */
import { codificarTexto, EscPos } from "./escpos";

export interface DatosEtiqueta {
  /** «#1004» */
  numero: string;
  /** «DOM · Pieza 1 de 3» */
  pieza: string;
  prenda: string;
  cliente: string;
  /** «22 sept» o «22 sept · URGENTE» */
  fecha: string;
  /** Color y marcas de la prenda («Rosado · Rasgado»), si las hay. */
  detalle: string | null;
  /** Lo que abre el QR: la dirección de esa prenda. */
  qr: string;
}

export const LENGUAJES_ETIQUETA = ["tspl", "zpl", "escpos"] as const;
export type LenguajeEtiqueta = (typeof LENGUAJES_ETIQUETA)[number];

/** Tamaños de etiqueta, en pulgadas (ancho × alto). Las etiqueteras son de 203 puntos por pulgada. */
export const TAMANOS_ETIQUETA = {
  "2x1": { ancho: 2, alto: 1 },
  "2.25x1.25": { ancho: 2.25, alto: 1.25 },
  "3x1": { ancho: 3, alto: 1 },
} as const;
export type TamanoEtiqueta = keyof typeof TAMANOS_ETIQUETA;

const PUNTOS_POR_PULGADA = 203;
/** Donde empieza el texto, a la derecha del QR. */
const X_TEXTO = 150;
/** Ancho de una letra del tipo «2» de TSPL, en puntos. */
const ANCHO_LETRA = 12;

const recortar = (texto: string, max: number) => (texto.length > max ? texto.slice(0, max) : texto);

function renglones(e: DatosEtiqueta, max: number): string[] {
  return [e.pieza, e.prenda, e.cliente, e.fecha, e.detalle ?? ""]
    .filter((x) => x !== "")
    .map((x) => recortar(x, max));
}

/** TSPL. Los textos van en la página de códigos 850, igual que los recibos. */
export function etiquetasTspl(etiquetas: DatosEtiqueta[], tamano: TamanoEtiqueta = "2x1"): Uint8Array {
  const t = TAMANOS_ETIQUETA[tamano];
  const max = Math.floor((t.ancho * PUNTOS_POR_PULGADA - X_TEXTO - 6) / ANCHO_LETRA);
  const limpio = (s: string) => s.replace(/"/g, "'");
  const bytes: number[] = [];
  const linea = (s: string) => bytes.push(...codificarTexto(s), 0x0d, 0x0a);
  for (const e of etiquetas) {
    linea(`SIZE ${t.ancho},${t.alto}`);
    linea("GAP 0.12,0");
    linea("DIRECTION 1");
    linea("CODEPAGE 850");
    linea("CLS");
    linea(`QRCODE 12,20,M,4,A,0,"${limpio(e.qr)}"`);
    linea(`TEXT ${X_TEXTO},10,"5",0,1,1,"${limpio(e.numero)}"`);
    renglones(e, max).forEach((r, i) => linea(`TEXT ${X_TEXTO},${66 + i * 24},"2",0,1,1,"${limpio(r)}"`));
    linea("PRINT 1,1");
  }
  return new Uint8Array(bytes);
}

/** ZPL (Zebra). Va en UTF-8 (`^CI28`), así los acentos salen sin tabla aparte. */
export function etiquetasZpl(etiquetas: DatosEtiqueta[], tamano: TamanoEtiqueta = "2x1"): Uint8Array {
  const t = TAMANOS_ETIQUETA[tamano];
  const ancho = Math.round(t.ancho * PUNTOS_POR_PULGADA);
  const alto = Math.round(t.alto * PUNTOS_POR_PULGADA);
  const max = Math.floor((ancho - X_TEXTO - 6) / 11);
  // «^» y «~» son las órdenes de ZPL: dentro de un texto lo romperían.
  const limpio = (s: string) => s.replace(/[\^~]/g, " ");
  let z = "";
  for (const e of etiquetas) {
    z += `^XA^CI28^PW${ancho}^LL${alto}^LH0,0\n`;
    z += `^FO12,10^BQN,2,4^FDMA,${limpio(e.qr)}^FS\n`;
    z += `^FO${X_TEXTO},12^A0N,54,48^FD${limpio(e.numero)}^FS\n`;
    renglones(e, max).forEach((r, i) => {
      z += `^FO${X_TEXTO},${70 + i * 25}^A0N,22,20^FD${limpio(r)}^FS\n`;
    });
    z += "^XZ\n";
  }
  return new TextEncoder().encode(z);
}

/** La etiqueta en papel de recibo, por la impresora de recibos. Una por corte. */
export function etiquetasEscPos(
  etiquetas: DatosEtiqueta[],
  opciones: { ancho?: 48 | 42 | 32; cortar?: boolean } = {},
): Uint8Array {
  const p = new EscPos(opciones.ancho ?? 48).iniciar();
  for (const e of etiquetas) {
    p.alinear("centro").negrita(true).tamano(3).linea(e.numero).tamano(1);
    p.linea(e.pieza).negrita(false);
    p.linea(e.prenda).linea(e.cliente).linea(e.fecha);
    if (e.detalle) p.negrita(true).linea(e.detalle).negrita(false);
    p.salto().qr(e.qr, 5).salto();
    if (opciones.cortar !== false) p.cortar();
    else p.alinear("izq").separador().salto();
  }
  return p.bytes();
}

export function codificarEtiquetas(
  etiquetas: DatosEtiqueta[],
  lenguaje: LenguajeEtiqueta,
  opciones: { tamano?: TamanoEtiqueta; ancho?: 48 | 42 | 32; cortar?: boolean } = {},
): Uint8Array {
  if (lenguaje === "tspl") return etiquetasTspl(etiquetas, opciones.tamano);
  if (lenguaje === "zpl") return etiquetasZpl(etiquetas, opciones.tamano);
  return etiquetasEscPos(etiquetas, opciones);
}
