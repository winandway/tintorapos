import { describe, expect, it } from "vitest";
import { anchoDe, codificarTexto, EscPos } from "@/lib/impresion/escpos";

const aTexto = (b: Iterable<number>) => String.fromCharCode(...b);

/**
 * CANDADO DEL CODIFICADOR: estos bytes son lo que de verdad le llega a la
 * impresora. Un byte mal y el recibo sale con basura, o no sale. Se comprueban
 * uno por uno contra el manual de comandos ESC/POS.
 */
describe("codificador ESC/POS", () => {
  it("arranca reiniciando la impresora y eligiendo la página de códigos latina", () => {
    expect([...new EscPos().iniciar().bytes()]).toEqual([0x1b, 0x40, 0x1b, 0x74, 2]);
  });

  it("los acentos y la ñ salen bien (página 850), no como signos raros", () => {
    expect(codificarTexto("Señor Muñoz: ¿cuándo?")).toEqual([
      0x53, 0x65, 0xa4, 0x6f, 0x72, 0x20, 0x4d, 0x75, 0xa4, 0x6f, 0x7a, 0x3a, 0x20, 0xa8, 0x63, 0x75, 0xa0,
      0x6e, 0x64, 0x6f, 0x3f,
    ]);
    expect(codificarTexto("ÁÉÍÓÚ")).toEqual([0xb5, 0x90, 0xd6, 0xe0, 0xe9]);
  });

  it("lo que la impresora no conoce se cambia por lo más parecido, nunca por basura", () => {
    // El signo de multiplicar sí existe en la página 850 (0x9e); la raya, la
    // viñeta y el euro no, y se cambian por «-», «*» y «EUR».
    expect(codificarTexto("Azul — 2 × 1 • 5€")).toEqual([
      ...codificarTexto("Azul - 2 "),
      0x9e,
      ...codificarTexto(" 1 * 5EUR"),
    ]);
    expect(codificarTexto("日本")).toEqual([0x3f, 0x3f]);
  });

  it("alinea, pone negrita y cambia el tamaño con los comandos correctos", () => {
    const b = new EscPos().alinear("centro").negrita(true).tamano(2).negrita(false).tamano(1).bytes();
    expect([...b]).toEqual([0x1b, 0x61, 1, 0x1b, 0x45, 1, 0x1d, 0x21, 0x11, 0x1b, 0x45, 0, 0x1d, 0x21, 0]);
  });

  it("las columnas ocupan el ancho exacto y el dinero nunca se corta", () => {
    const linea = aTexto(new EscPos(32).columnas("Total", "$15.00").bytes());
    expect(linea).toBe(`Total${" ".repeat(21)}$15.00\n`);
    expect(linea.length - 1).toBe(32);

    const larga = aTexto(
      new EscPos(32).columnas("Traje de tres piezas con chaleco y corbata", "$129.99").bytes(),
    );
    expect(larga.trimEnd().endsWith("$129.99")).toBe(true);
    expect(larga.length - 1).toBe(32);
  });

  it("el separador mide lo que mide el papel", () => {
    expect(new EscPos(48).separador().bytes().length).toBe(49);
    expect(new EscPos(32).separador().bytes().length).toBe(33);
  });

  it("el QR lo dibuja la impresora: modelo, tamaño, corrección, datos e imprimir", () => {
    const datos = "https://tintorapos.com/t/ABC";
    const b = [...new EscPos().qr(datos, 6).bytes()];
    const largo = datos.length + 3;
    expect(b.slice(0, 9)).toEqual([0x1d, 0x28, 0x6b, 4, 0, 0x31, 0x41, 50, 0]);
    expect(b.slice(9, 17)).toEqual([0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x43, 6]);
    expect(b.slice(17, 25)).toEqual([0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x45, 49]);
    expect(b.slice(25, 33)).toEqual([0x1d, 0x28, 0x6b, largo & 0xff, largo >> 8, 0x31, 0x50, 0x30]);
    expect(aTexto(b.slice(33, 33 + datos.length))).toBe(datos);
    expect(b.slice(-8)).toEqual([0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30]);
  });

  it("corta el papel después de avanzarlo, y abre el cajón con su pulso", () => {
    expect([...new EscPos().cortar().bytes()]).toEqual([0x0a, 0x0a, 0x0a, 0x0a, 0x1d, 0x56, 66, 0]);
    expect([...new EscPos().abrirCajon().bytes()]).toEqual([0x1b, 0x70, 0, 25, 250]);
  });

  it("mide el texto ya codificado (un € ocupa tres letras)", () => {
    expect(anchoDe("5€")).toBe(4);
    expect(anchoDe("ñandú")).toBe(5);
  });
});
