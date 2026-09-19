import { describe, expect, it } from "vitest";
import {
  banderaDe,
  CODIGOS_PAIS,
  listaMonedas,
  listaPaises,
  monedaDePais,
  monedaValida,
  nombrePais,
  paisValido,
} from "@/lib/paises";

describe("países y monedas del formulario (candado)", () => {
  it("está TODO el mundo, no una lista corta de 18", () => {
    // El 18 sep 2026 faltaban Venezuela, Rumania y casi todos: nadie de esos
    // países podía registrar su tintorería.
    expect(CODIGOS_PAIS.length).toBeGreaterThan(190);
    for (const codigo of ["VE", "RO", "BR", "IT", "PT", "PH", "MA", "NG", "IN", "JP", "AU", "ZA"])
      expect(CODIGOS_PAIS, codigo).toContain(codigo);
  });

  it("cada país trae su moneda; la de Venezuela y la de Rumania son las suyas", () => {
    expect(monedaDePais("VE")).toBe("VES");
    expect(monedaDePais("RO")).toBe("RON");
    expect(monedaDePais("us")).toBe("USD");
    expect(monedaDePais("ZZ")).toBe("USD");
    for (const codigo of CODIGOS_PAIS) expect(monedaDePais(codigo), codigo).toMatch(/^[A-Z]{3}$/);
  });

  it("los nombres salen en el idioma de la persona y la lista va ordenada", () => {
    const es = listaPaises("es");
    const en = listaPaises("en");
    expect(es.find((p) => p.codigo === "VE")?.nombre).toBe("Venezuela");
    expect(es.find((p) => p.codigo === "RO")?.nombre).toMatch(/^Ruman[ií]a$/);
    expect(en.find((p) => p.codigo === "RO")?.nombre).toBe("Romania");
    expect(en.find((p) => p.codigo === "ES")?.nombre).toBe("Spain");
    const nombres = es.map((p) => p.nombre);
    expect([...nombres].sort(new Intl.Collator("es").compare)).toEqual(nombres);
  });

  it("la banderita sale del código, sin imágenes", () => {
    expect(banderaDe("VE")).toBe("🇻🇪");
    expect(banderaDe("ro")).toBe("🇷🇴");
    expect(banderaDe("")).toBe("🏳️");
  });

  it("las monedas son las del sistema y se validan de verdad", () => {
    const monedas = listaMonedas("es").map((m) => m.codigo);
    for (const m of ["USD", "VES", "RON", "EUR", "COP"]) expect(monedas, m).toContain(m);
    expect(monedaValida("VES")).toBe(true);
    expect(monedaValida("RON")).toBe(true);
    expect(monedaValida("US")).toBe(false);
    expect(monedaValida("usd")).toBe(false);
    expect(monedaValida("ZZZZ")).toBe(false);
  });

  it("el país se valida sin dejar pasar cualquier cosa", () => {
    expect(paisValido("VE")).toBe(true);
    expect(paisValido("RO")).toBe(true);
    expect(paisValido("ZZ")).toBe(false);
    expect(paisValido("usa")).toBe(false);
    expect(nombrePais("VE", "es")).toBe("Venezuela");
    // ZZ no es un país: el sistema lo llamaría «Región desconocida» y colaría.
    expect(nombrePais("ZZ", "es")).not.toBe("ZZ");
  });
});
