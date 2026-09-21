/**
 * Codificador ESC/POS: el idioma que hablan casi todas las impresoras térmicas
 * de recibos (Epson, Star en modo ESC/POS, Bixolon, Xprinter, HPRT, Munbyn…).
 *
 * Por qué existe: mandar el recibo por el diálogo del navegador obliga a
 * confirmar cada impresión y depende del driver del sistema. Con estos bytes y
 * una conexión directa (WebUSB o Web Serial) el recibo sale de un toque, sin
 * diálogo y sin drivers. Es como lo hacen los POS en la nube serios.
 *
 * Candado: tests/unit/escpos.test.ts comprueba los bytes uno por uno.
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

/**
 * Página de códigos 850 (latina): la entienden hasta las térmicas más baratas.
 * Solo se mapean los caracteres que no son ASCII; lo desconocido sale como «?».
 */
const CP850: Record<string, number> = {
  á: 0xa0,
  é: 0x82,
  í: 0xa1,
  ó: 0xa2,
  ú: 0xa3,
  ñ: 0xa4,
  Ñ: 0xa5,
  ü: 0x81,
  Ü: 0x9a,
  Á: 0xb5,
  É: 0x90,
  Í: 0xd6,
  Ó: 0xe0,
  Ú: 0xe9,
  "¿": 0xa8,
  "¡": 0xad,
  "°": 0xf8,
  "·": 0xfa,
  "×": 0x9e,
  "«": 0xae,
  "»": 0xaf,
  "¢": 0xbd,
  "£": 0x9c,
  "¥": 0xbe,
  à: 0x85,
  è: 0x8a,
  ì: 0x8d,
  ò: 0x95,
  ù: 0x97,
  â: 0x83,
  ê: 0x88,
  î: 0x8c,
  ô: 0x93,
  û: 0x96,
  ä: 0x84,
  ë: 0x89,
  ï: 0x8b,
  ö: 0x94,
  ç: 0x87,
  Ç: 0x80,
  ã: 0xc6,
  õ: 0xe4,
};

/** Lo que no existe en la página 850 se cambia por lo más parecido. */
const PARECIDOS: Record<string, string> = {
  "—": "-",
  "–": "-",
  "−": "-",
  "•": "*",
  "“": '"',
  "”": '"',
  "‘": "'",
  "’": "'",
  "…": "...",
  "€": "EUR",
  " ": " ",
  "¼": "1/4",
  "½": "1/2",
  "¾": "3/4",
  "⅝": "5/8",
};

export type Alineacion = "izq" | "centro" | "der";

export function codificarTexto(texto: string): number[] {
  const salida: number[] = [];
  for (const crudo of texto) {
    const c = PARECIDOS[crudo] ?? crudo;
    for (const letra of c) {
      const codigo = letra.codePointAt(0) ?? 0x3f;
      if (codigo < 0x80) salida.push(codigo);
      else salida.push(CP850[letra] ?? 0x3f);
    }
  }
  return salida;
}

/** Lo que mide un texto ya codificado (los reemplazos pueden alargarlo). */
export function anchoDe(texto: string): number {
  return codificarTexto(texto).length;
}

export class EscPos {
  private b: number[] = [];
  /** Caracteres por línea: 48 en papel de 80 mm, 32 en papel de 58 mm. */
  constructor(readonly ancho: 48 | 42 | 32 = 48) {}

  iniciar(): this {
    this.b.push(ESC, 0x40); // ESC @  reinicia la impresora
    this.b.push(ESC, 0x74, 2); // ESC t 2  página de códigos 850
    return this;
  }

  alinear(a: Alineacion): this {
    this.b.push(ESC, 0x61, a === "izq" ? 0 : a === "centro" ? 1 : 2);
    return this;
  }

  negrita(si: boolean): this {
    this.b.push(ESC, 0x45, si ? 1 : 0);
    return this;
  }

  /** Tamaño de letra: 1 es normal, 2 es el doble (a lo ancho y a lo alto). */
  tamano(ancho: 1 | 2 | 3, alto: 1 | 2 | 3 = ancho): this {
    this.b.push(GS, 0x21, ((ancho - 1) << 4) | (alto - 1));
    return this;
  }

  texto(s: string): this {
    this.b.push(...codificarTexto(s));
    return this;
  }

  linea(s = ""): this {
    return this.texto(s).salto();
  }

  salto(n = 1): this {
    for (let i = 0; i < n; i++) this.b.push(LF);
    return this;
  }

  separador(): this {
    return this.linea("-".repeat(this.ancho));
  }

  /**
   * Una línea con algo a la izquierda y algo a la derecha (prenda y precio).
   * Si no caben, lo de la izquierda se corta; el dinero nunca se corta.
   */
  columnas(izq: string, der: string): this {
    const libre = this.ancho - anchoDe(der) - 1;
    let i = izq;
    while (anchoDe(i) > libre && i.length > 0) i = i.slice(0, -1);
    const relleno = Math.max(1, this.ancho - anchoDe(i) - anchoDe(der));
    return this.linea(i + " ".repeat(relleno) + der);
  }

  /**
   * Código QR dibujado POR LA IMPRESORA (comando GS ( k). No se manda una
   * imagen: sale nítido y son pocos bytes. `modulo` es el tamaño de cada
   * cuadrito (de 1 a 16); 6 se lee bien con cualquier celular.
   */
  qr(datos: string, modulo = 6): this {
    const d = codificarTexto(datos);
    const largo = d.length + 3;
    this.b.push(GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, 50, 0); // modelo 2
    this.b.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, Math.min(16, Math.max(1, modulo))); // tamaño
    this.b.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, 49); // corrección de errores M
    this.b.push(GS, 0x28, 0x6b, largo & 0xff, (largo >> 8) & 0xff, 0x31, 0x50, 0x30, ...d); // datos
    this.b.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30); // imprimir
    return this;
  }

  /** Avanza el papel y lo corta (corte parcial: la mayoría no hace el total). */
  cortar(): this {
    this.salto(4);
    this.b.push(GS, 0x56, 66, 0);
    return this;
  }

  /** Abre el cajón de dinero conectado a la impresora (pulso al pin 2). */
  abrirCajon(): this {
    this.b.push(ESC, 0x70, 0, 25, 250);
    return this;
  }

  bytes(): Uint8Array {
    return new Uint8Array(this.b);
  }
}
