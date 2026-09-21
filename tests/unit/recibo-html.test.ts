import { describe, expect, it } from "vitest";
import { avisoAHtml, escaparHtml, reciboAHtml, reciboATexto } from "@/lib/impresion/recibo-html";
import type { LineaRecibo } from "@/lib/impresion/recibo";

const OPCIONES = {
  enlace: "https://tintorapos.com/t/ABC123",
  textoBoton: "Ver el estado de mi orden",
  avance: "Recibimos tu orden #1004",
  pie: "Recibiste este correo porque dejaste tu ropa en la tienda.",
  idioma: "es",
} as const;

const LINEAS: LineaRecibo[] = [
  { t: "texto", texto: "Lavandería Aurora", alinear: "centro", negrita: true, grande: 2 },
  { t: "texto", texto: "#1004", alinear: "centro", negrita: true, grande: 3 },
  { t: "separador" },
  { t: "columnas", izq: "2.5 kg Ropa por peso", der: "$ 20.000" },
  { t: "columnas", izq: "TOTAL", der: "$ 20.000", negrita: true },
  { t: "espacio" },
  { t: "qr", datos: OPCIONES.enlace },
  { t: "texto", texto: OPCIONES.enlace, alinear: "centro" },
];

/**
 * CANDADO DEL RECIBO DIGITAL. Richard reportó que al cliente no le llegaba «la
 * factura digital»: lo único que existía era una línea de texto, y apagada. El
 * recibo por correo sale de las mismas líneas que el de papel.
 */
describe("recibo digital en HTML", () => {
  it("trae la tienda, el número, las prendas con su peso, el total y el botón a la orden", () => {
    const html = reciboAHtml(LINEAS, OPCIONES);
    expect(html).toContain("Lavandería Aurora");
    expect(html).toContain("#1004");
    expect(html).toContain("2.5 kg Ropa por peso");
    expect(html).toContain("$ 20.000");
    expect(html).toContain('href="https://tintorapos.com/t/ABC123"');
    expect(html).toContain("Ver el estado de mi orden");
    // Donde el papel lleva el QR va el botón; la dirección suelta no se repite.
    expect(html.match(/tintorapos\.com\/t\/ABC123/g)).toHaveLength(1);
    // Correo de verdad: sin código, sin hojas de estilo y sin imágenes de afuera.
    expect(html).not.toMatch(/<script|<link|<img|<style/i);
  });

  it("lo que escriba una tienda o un cliente no se cuela como HTML", () => {
    const html = reciboAHtml(
      [
        { t: "texto", texto: '<script>alert("x")</script>', alinear: "centro" },
        { t: "columnas", izq: "<b>Camisa</b>", der: '"><img src=x>' },
      ],
      { ...OPCIONES, pie: "<i>pie</i>", avance: "<u>avance</u>" },
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>Camisa</b>");
    expect(html).toContain("&lt;b&gt;Camisa&lt;/b&gt;");
    expect(html).not.toContain("<i>pie</i>");
    expect(escaparHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("un enlace que no es http(s) no se convierte en botón", () => {
    const html = reciboAHtml([{ t: "qr", datos: "x" }], { ...OPCIONES, enlace: "javascript:alert(1)" });
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<a ");
  });

  it("los demás avisos llevan su texto y el botón, sin repetir la dirección", () => {
    const html = avisoAHtml(
      "Lavandería Aurora",
      `Lavandería Aurora: tu orden #1004 está lista. ${OPCIONES.enlace}`,
      OPCIONES,
    );
    expect(html).toContain("tu orden #1004 está lista.");
    expect(html.match(/tintorapos\.com\/t\/ABC123/g)).toHaveLength(1);
  });

  it("siempre hay versión en texto plano, con lo mismo", () => {
    const texto = reciboATexto(LINEAS);
    expect(texto).toContain("Lavandería Aurora");
    expect(texto).toContain("2.5 kg Ropa por peso $ 20.000");
    expect(texto).toContain("TOTAL $ 20.000");
    expect(texto).not.toContain("<");
  });
});
