import { describe, expect, it } from "vitest";
import { cabecerasSeguridad, politicaContenido } from "@/lib/cabeceras-seguridad";

describe("cabeceras de seguridad (candado)", () => {
  it("incluye todas las cabeceras obligatorias", () => {
    const claves = cabecerasSeguridad(false).map((c) => c.key);
    for (const k of [
      "Content-Security-Policy",
      "Strict-Transport-Security",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy",
    ]) {
      expect(claves).toContain(k);
    }
  });

  it("en producción no permite eval y bloquea marcos ajenos", () => {
    const csp = politicaContenido(false);
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("en desarrollo permite eval para la recarga en caliente", () => {
    expect(politicaContenido(true)).toContain("unsafe-eval");
    expect(politicaContenido(true)).not.toContain("upgrade-insecure-requests");
  });
  it("deja pasar solo la medición de visitas sin cookies que inyecta la plataforma", () => {
    const csp = politicaContenido(false);
    expect(csp).toMatch(/script-src [^;]*https:\/\/static\.cloudflareinsights\.com/);
    expect(csp).toMatch(/connect-src [^;]*https:\/\/cloudflareinsights\.com/);
  });
});
