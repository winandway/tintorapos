import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/diccionarios/en";
import { es } from "@/lib/i18n/diccionarios/es";
import {
  diccionario,
  esIdioma,
  fmt,
  formatoDinero,
  formatoFecha,
  idiomaDesdeNavegador,
  plural,
  textoBilingue,
} from "@/lib/i18n";

type Arbol = { [k: string]: string | Arbol };

function claves(obj: Arbol, prefijo = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "string" ? [`${prefijo}${k}`] : claves(v, `${prefijo}${k}.`),
  );
}

function hojas(obj: Arbol, prefijo = ""): [string, string][] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "string" ? [[`${prefijo}${k}`, v] as [string, string]] : hojas(v, `${prefijo}${k}.`),
  );
}

describe("diccionarios bilingües (candado)", () => {
  it("español e inglés tienen exactamente las mismas claves", () => {
    expect(claves(en as unknown as Arbol).sort()).toEqual(claves(es as unknown as Arbol).sort());
  });

  it("ningún texto queda vacío", () => {
    for (const [clave, valor] of [...hojas(es as unknown as Arbol), ...hojas(en as unknown as Arbol)]) {
      expect(valor.trim(), clave).not.toBe("");
    }
  });

  it("las variables {x} coinciden entre idiomas", () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    const mapaEn = new Map(hojas(en as unknown as Arbol));
    for (const [clave, valor] of hojas(es as unknown as Arbol)) {
      expect(vars(mapaEn.get(clave) ?? ""), clave).toBe(vars(valor));
    }
  });

  it("devuelve el diccionario pedido", () => {
    expect(diccionario("en").comun.entrar).toBe("Sign in");
    expect(diccionario("es").comun.entrar).toBe("Entrar");
  });
});

describe("idioma del navegador", () => {
  it("respeta el orden de preferencia", () => {
    expect(idiomaDesdeNavegador("en-US,en;q=0.9,es;q=0.8")).toBe("en");
    expect(idiomaDesdeNavegador("fr-FR,es-MX;q=0.7,en;q=0.5")).toBe("es");
    expect(idiomaDesdeNavegador("de-DE")).toBe("es");
    expect(idiomaDesdeNavegador(null)).toBe("es");
    expect(idiomaDesdeNavegador("en;q=0.2, es;q=0.9")).toBe("es");
  });

  it("valida idiomas", () => {
    expect(esIdioma("en")).toBe(true);
    expect(esIdioma("fr")).toBe(false);
    expect(esIdioma(3)).toBe(false);
  });
});

describe("formato", () => {
  it("interpola variables y deja las desconocidas", () => {
    expect(fmt("Hola {nombre}, {x}", { nombre: "Ana" })).toBe("Hola Ana, {x}");
    expect(plural(1, "{n} prenda", "{n} prendas")).toBe("1 prenda");
    expect(plural(3, "{n} prenda", "{n} prendas")).toBe("3 prendas");
  });

  it("formatea dinero en centavos según idioma", () => {
    expect(formatoDinero(123456, "USD", "en")).toBe("$1,234.56");
    expect(formatoDinero(500, "USD", "es")).toContain("5.00");
  });

  it("formatea fechas en la zona horaria de la tienda", () => {
    const f = formatoFecha("2026-09-16T03:30:00Z", "en", "America/New_York", { dateStyle: "short" });
    expect(f).toBe("9/15/26");
  });

  it("usa el texto en inglés del dueño y cae al español si falta", () => {
    expect(textoBilingue("en", "Camisa", "Shirt")).toBe("Shirt");
    expect(textoBilingue("en", "Camisa", " ")).toBe("Camisa");
    expect(textoBilingue("es", "Camisa", "Shirt")).toBe("Camisa");
    expect(textoBilingue("es", null, "Shirt")).toBe("Shirt");
    expect(textoBilingue("es", null, null)).toBe("");
  });
});
