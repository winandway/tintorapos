import { describe, expect, it } from "vitest";
import { maximoLimpio } from "@/components/reportes/grafica-barras";

describe("eje de la gráfica", () => {
  it("redondea a números limpios", () => {
    expect(maximoLimpio(0)).toBe(1);
    expect(maximoLimpio(7)).toBe(10);
    expect(maximoLimpio(12)).toBe(20);
    expect(maximoLimpio(45_000)).toBe(50_000);
    expect(maximoLimpio(100)).toBe(100);
    expect(maximoLimpio(101)).toBe(200);
  });
});
