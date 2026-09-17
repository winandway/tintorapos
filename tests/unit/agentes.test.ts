import { describe, expect, it } from "vitest";
import { cabeceraLink, RUTAS_AGENTES } from "@/lib/agentes/enlaces";
import { digestoDe, HABILIDADES } from "@/lib/agentes/habilidades";
import { markdownDeRuta } from "@/lib/agentes/markdown";
import { robotsTxt } from "@/lib/agentes/robots";
import { GUIAS } from "@/lib/docs";

describe("lo que ve un agente de IA (candado)", () => {
  it("la cabecera Link usa tipos de relación registrados y apunta a cosas que existen", () => {
    const link = cabeceraLink();
    for (const rel of ["api-catalog", "service-desc", "service-doc", "status", "describedby"])
      expect(link).toContain(`rel="${rel}"`);
    expect(link).toContain(`<${RUTAS_AGENTES.catalogoApi}>`);
    expect(link).toContain(`<${RUTAS_AGENTES.openapi}>`);
  });

  it("robots.txt declara las señales de contenido y no abre lo privado", () => {
    const r = robotsTxt();
    expect(r).toContain("Content-Signal: search=yes, ai-input=yes, ai-train=no");
    expect(r).toContain("Disallow: /app");
    expect(r).toContain("Disallow: /datos");
    expect(r).toMatch(/Sitemap: https:\/\/tintorapos\.com\/sitemap\.xml/);
  });

  it("cada habilidad publicada trae su texto y su huella sha256", async () => {
    expect(HABILIDADES.length).toBeGreaterThanOrEqual(3);
    for (const h of HABILIDADES) {
      expect(h.nombre).toMatch(/^[a-z0-9-]+$/);
      expect(h.markdown.startsWith("# ")).toBe(true);
      expect(await digestoDe(h.markdown)).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
    // Dos habilidades distintas nunca comparten huella.
    const huellas = await Promise.all(HABILIDADES.map((h) => digestoDe(h.markdown)));
    expect(new Set(huellas).size).toBe(HABILIDADES.length);
  });

  it("las páginas públicas tienen versión en Markdown, en los dos idiomas", () => {
    const portada = markdownDeRuta([]);
    expect(portada?.texto).toContain("# Tintora POS");
    expect(markdownDeRuta(["en"])?.idioma).toBe("en");
    expect(markdownDeRuta(["docs"])?.texto).toContain("## ");
    // Todas las guías responden, con su slug en español y el suyo en inglés.
    for (const g of GUIAS) {
      expect(markdownDeRuta(["es", "docs", g.slug])?.texto, g.slug).toContain(`# ${g.es.titulo}`);
    }
    expect(markdownDeRuta(["en", "docs", "getting-started"])?.texto).toContain("# Getting started");
    expect(markdownDeRuta(["en", "privacy"])?.texto).toContain("# ");
    expect(markdownDeRuta(["terminos"])?.texto).toContain("# ");
  });

  it("una página que no existe no inventa Markdown", () => {
    expect(markdownDeRuta(["no-existe"])).toBeNull();
    expect(markdownDeRuta(["es", "docs", "no-existe"])).toBeNull();
    expect(markdownDeRuta(["app"])).toBeNull();
  });
});
