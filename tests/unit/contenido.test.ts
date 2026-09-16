import { describe, expect, it } from "vitest";
import { CONTENIDO_INICIO } from "@/lib/contenido/inicio";
import { PRIVACIDAD, TERMINOS } from "@/lib/contenido/legal";

/** Forma del contenido: mismas claves y mismo largo de listas; ningún texto vacío. */
function forma(v: unknown): unknown {
  if (typeof v === "string") return v.trim() === "" ? "VACÍO" : "texto";
  if (Array.isArray(v)) return v.map(forma);
  if (v && typeof v === "object")
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === "icono" ? x : forma(x)]));
  return v;
}

describe("contenido público bilingüe (candado)", () => {
  it.each([
    ["portada", CONTENIDO_INICIO],
    ["privacidad", PRIVACIDAD],
    ["términos", TERMINOS],
  ] as const)("%s: español e inglés tienen la misma forma y nada vacío", (_n, c) => {
    expect(forma(c.en)).toEqual(forma(c.es));
    expect(JSON.stringify(forma(c.es))).not.toContain("VACÍO");
  });

  it("el inglés no quedó en español por descuido", () => {
    const en = JSON.stringify([CONTENIDO_INICIO.en, PRIVACIDAD.en, TERMINOS.en]);
    for (const palabra of [" tintorería", " prenda", " cliente ", " orden ", "ñ", "¿"])
      expect(en).not.toContain(palabra);
  });
});
