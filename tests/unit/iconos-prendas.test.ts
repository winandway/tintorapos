import { describe, expect, it } from "vitest";
import { iconoDePrenda } from "@/lib/mostrador/iconos";
import { PRENDAS_ESTANDAR } from "@/server/catalogo/estandar";

describe("dibujos de las prendas del mostrador", () => {
  it("todas las prendas del catálogo estándar tienen su dibujo (ninguna cae en la percha)", () => {
    const sinDibujo = PRENDAS_ESTANDAR.filter(
      (p) => p.es !== "Otra prenda" && iconoDePrenda(p.es, p.en) === "percha",
    );
    expect(sinDibujo).toEqual([]);
  });

  it("reconoce el nombre en español y en inglés, con y sin acentos", () => {
    expect(iconoDePrenda("Pantalón", "Pants")).toBe("pantalon");
    expect(iconoDePrenda("pantalon")).toBe("pantalon");
    expect(iconoDePrenda(null, "Trousers")).toBe("pantalon");
    expect(iconoDePrenda("CAMISA")).toBe("camisa");
  });

  it("lo específico manda sobre lo general", () => {
    expect(iconoDePrenda("Vestido de novia", "Wedding gown")).toBe("novia");
    expect(iconoDePrenda("Vestido de fiesta", "Evening gown")).toBe("vestidoLargo");
    expect(iconoDePrenda("Vestido", "Dress")).toBe("vestido");
    expect(iconoDePrenda("Traje de 2 piezas", "2-piece suit")).toBe("traje");
    expect(iconoDePrenda("Saco o blazer", "Blazer or sport coat")).toBe("saco");
  });

  it("un nombre que el dueño inventó no rompe nada: le toca la percha", () => {
    expect(iconoDePrenda("Prenda especial de la casa")).toBe("percha");
    expect(iconoDePrenda("")).toBe("percha");
    expect(iconoDePrenda(undefined, null)).toBe("percha");
  });
});
