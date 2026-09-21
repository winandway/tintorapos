import { describe, expect, it } from "vitest";
import {
  codificarEtiquetas,
  etiquetasEscPos,
  etiquetasTspl,
  etiquetasZpl,
  type DatosEtiqueta,
} from "@/lib/impresion/etiquetas";

const aTexto = (b: Uint8Array) => new TextDecoder("latin1").decode(b);

const ETIQUETAS: DatosEtiqueta[] = [
  {
    numero: "#1004",
    pieza: "DOM · Pieza 1 de 3",
    prenda: "Pantalón",
    cliente: "Julio",
    fecha: "22 sept",
    detalle: "Rosado · Rasgado",
    qr: "https://tintorapos.com/e/QN9MS26YSQP1",
  },
  {
    numero: "#1004",
    pieza: "DOM · Pieza 2 de 3",
    prenda: "Falda",
    cliente: "Julio",
    fecha: "22 sept · URGENTE",
    detalle: null,
    qr: "https://tintorapos.com/e/AAAA1111BBBB",
  },
];

/**
 * CANDADO DE LAS ETIQUETERAS: cada marca habla su idioma, y una orden mal
 * escrita hace que la etiquetera no saque nada o saque la etiqueta corrida. Se
 * comprueban las órdenes exactas contra los manuales de TSPL y ZPL.
 */
describe("etiquetas para la impresora conectada", () => {
  it("TSPL: tamaño, separación, QR dibujado por la impresora y una impresión por etiqueta", () => {
    const t = aTexto(etiquetasTspl(ETIQUETAS, "2x1"));
    const ordenes = t.split("\r\n");
    expect(ordenes[0]).toBe("SIZE 2,1");
    expect(ordenes).toContain("GAP 0.12,0");
    expect(ordenes).toContain("CODEPAGE 850");
    expect(ordenes).toContain("CLS");
    expect(ordenes).toContain('QRCODE 12,20,M,4,A,0,"https://tintorapos.com/e/QN9MS26YSQP1"');
    expect(ordenes).toContain('TEXT 150,10,"5",0,1,1,"#1004"');
    expect(ordenes).toContain('TEXT 150,114,"2",0,1,1,"Julio"');
    // Una orden de imprimir por cada etiqueta, ni más ni menos.
    expect(ordenes.filter((o) => o === "PRINT 1,1")).toHaveLength(2);
    expect(ordenes.filter((o) => o === "CLS")).toHaveLength(2);
  });

  it("TSPL: los acentos van en la página 850 y las comillas no rompen la orden", () => {
    const b = etiquetasTspl([{ ...ETIQUETAS[0]!, prenda: 'Pantalón "fino"' }]);
    // «ó» en la página 850 es 0xA2.
    expect([...b]).toContain(0xa2);
    expect(aTexto(b)).toContain("'fino'");
    expect(aTexto(b)).not.toContain('"fino"');
  });

  it("TSPL: la etiqueta más ancha deja entrar más letras por renglón", () => {
    const larga = [{ ...ETIQUETAS[0]!, detalle: "Azul oscuro · Botón roto · Mancha" }];
    const chica = aTexto(etiquetasTspl(larga, "2x1"));
    const grande = aTexto(etiquetasTspl(larga, "3x1"));
    expect(grande).toContain("SIZE 3,1");
    expect(chica).not.toContain("Mancha");
    expect(grande).toContain("Mancha");
  });

  it("ZPL: abre y cierra cada etiqueta, en UTF-8, con su ancho, su alto y su QR", () => {
    const z = new TextDecoder().decode(etiquetasZpl(ETIQUETAS, "2x1"));
    expect(z.match(/\^XA/g)).toHaveLength(2);
    expect(z.match(/\^XZ/g)).toHaveLength(2);
    expect(z).toContain("^CI28^PW406^LL203");
    expect(z).toContain("^BQN,2,4^FDMA,https://tintorapos.com/e/QN9MS26YSQP1^FS");
    expect(z).toContain("^A0N,54,48^FD#1004^FS");
    expect(z).toContain("^FDPantalón^FS");
  });

  it("ZPL: un «^» o un «~» dentro de un texto no se cuela como orden", () => {
    const z = new TextDecoder().decode(etiquetasZpl([{ ...ETIQUETAS[0]!, cliente: "Ana^XZ~JR" }]));
    expect(z).toContain("^FDAna XZ JR^FS");
    expect(z.match(/\^XZ/g)).toHaveLength(1);
  });

  it("por la impresora de recibos: una etiqueta por corte, con su QR", () => {
    const b = [...etiquetasEscPos(ETIQUETAS)];
    const cortes = b.filter((x, i) => x === 0x1d && b[i + 1] === 0x56 && b[i + 2] === 66);
    expect(cortes).toHaveLength(2);
    // El QR nativo aparece dos veces (GS ( k … 0x51 es la orden de imprimirlo).
    const imprimirQr = b.filter(
      (x, i) => x === 0x1d && b[i + 1] === 0x28 && b[i + 2] === 0x6b && b[i + 6] === 0x51,
    );
    expect(imprimirQr).toHaveLength(2);
    // Sin cuchilla: se separan con una raya y no se manda ningún corte.
    const sinCorte = [...etiquetasEscPos(ETIQUETAS, { cortar: false })];
    expect(sinCorte.some((x, i) => x === 0x1d && sinCorte[i + 1] === 0x56)).toBe(false);
  });

  it("el lenguaje elegido manda: TSPL, ZPL o el de recibos", () => {
    expect(aTexto(codificarEtiquetas(ETIQUETAS, "tspl")).startsWith("SIZE")).toBe(true);
    expect(aTexto(codificarEtiquetas(ETIQUETAS, "zpl")).startsWith("^XA")).toBe(true);
    expect([...codificarEtiquetas(ETIQUETAS, "escpos")].slice(0, 2)).toEqual([0x1b, 0x40]);
  });
});
