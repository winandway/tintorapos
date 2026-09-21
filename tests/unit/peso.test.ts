import { describe, expect, it } from "vitest";
import { cantidadConPeso, esUnidadPeso, resolverUnidadPeso, unidadPesoDePais } from "@/lib/peso";

/**
 * CANDADO DE LA UNIDAD DE PESO: el sistema decía «libra» en todas partes y en
 * Colombia (y en casi todo el mundo) la ropa se pesa en kilos.
 */
describe("unidad de peso de la tienda", () => {
  it("de fábrica: libras en EE.UU. y Puerto Rico, kilos en el resto", () => {
    expect(unidadPesoDePais("US")).toBe("lb");
    expect(unidadPesoDePais("pr")).toBe("lb");
    for (const pais of ["CO", "MX", "ES", "AR", "VE", "DO", "", null, undefined])
      expect(unidadPesoDePais(pais)).toBe("kg");
  });

  it("manda lo que eligió el dueño; si no eligió o hay basura, manda el país", () => {
    expect(resolverUnidadPeso("lb", "CO")).toBe("lb");
    expect(resolverUnidadPeso("kg", "US")).toBe("kg");
    expect(resolverUnidadPeso(null, "CO")).toBe("kg");
    expect(resolverUnidadPeso("arrobas", "US")).toBe("lb");
    expect(esUnidadPeso("kg")).toBe(true);
    expect(esUnidadPeso("KG")).toBe(false);
  });

  it("la cantidad se lee con su unidad", () => {
    expect(cantidadConPeso(2.5, "kg")).toBe("2.5 kg");
    expect(cantidadConPeso(4, "lb")).toBe("4 lb");
  });
});
