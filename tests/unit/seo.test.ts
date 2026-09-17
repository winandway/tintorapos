import { describe, expect, it } from "vitest";
import { robotsTxt } from "@/lib/agentes/robots";
import sitemap from "@/app/sitemap";
import { GUIAS } from "@/lib/docs";
import { SLUG_EN } from "@/lib/docs/slugs";
import { PAGINAS, resolverRutaConIdioma, rutaEquivalente, rutaPublica } from "@/lib/rutas-publicas";
import { alternatesDe, jsonLd, RUTAS_INDEXABLES, urlAbsoluta } from "@/lib/seo";

describe("SEO: direcciones por idioma (candado)", () => {
  it("cada guía tiene su dirección en inglés, única y distinta de las de español", () => {
    const es = GUIAS.map((g) => g.slug);
    const en = es.map((s) => SLUG_EN[s]);
    expect(en.every(Boolean), "falta la dirección en inglés de alguna guía").toBe(true);
    expect(new Set(en).size).toBe(en.length);
    expect(en.filter((s) => es.includes(s!) && SLUG_EN[s!] !== s)).toEqual([]);
    expect(Object.keys(SLUG_EN).sort()).toEqual([...es].sort());
  });

  it("resuelve /es y /en a la página interna y corrige el slug del otro idioma", () => {
    expect(resolverRutaConIdioma("/en/privacy")).toEqual({
      idioma: "en",
      interna: "/privacidad",
      canonica: "/en/privacy",
    });
    expect(resolverRutaConIdioma("/es/privacidad")).toEqual({
      idioma: "es",
      interna: "/privacidad",
      canonica: "/es/privacidad",
    });
    expect(resolverRutaConIdioma("/en")).toEqual({ idioma: "en", interna: "/", canonica: "/en" });
    expect(resolverRutaConIdioma("/es/")).toEqual({ idioma: "es", interna: "/", canonica: "/es" });
    expect(resolverRutaConIdioma("/en/docs/primeros-pasos")?.canonica).toBe("/en/docs/getting-started");
    expect(resolverRutaConIdioma("/es/docs/getting-started")?.canonica).toBe("/es/docs/primeros-pasos");
    expect(resolverRutaConIdioma("/en/signup")?.interna).toBe("/registro");
  });

  it("no confunde rutas propias que empiezan igual (/entrar, /e/…) con idiomas", () => {
    expect(resolverRutaConIdioma("/entrar")).toBeNull();
    expect(resolverRutaConIdioma("/e/ABC123")).toBeNull();
    expect(resolverRutaConIdioma("/estado")).toBeNull();
    expect(resolverRutaConIdioma("/docs")).toBeNull();
  });

  it("el selector de idioma lleva a la misma página en el otro idioma, ida y vuelta", () => {
    for (const interna of RUTAS_INDEXABLES) {
      const es = rutaPublica("es", interna);
      const en = rutaPublica("en", interna);
      expect(rutaEquivalente(es, "en"), interna).toBe(en);
      expect(rutaEquivalente(en, "es"), interna).toBe(es);
    }
    expect(rutaEquivalente("/app/caja", "en")).toBeNull();
    expect(Object.keys(PAGINAS)).toContain("registro");
  });
});

describe("SEO: sitemap, robots y hreflang (candado)", () => {
  it("el sitemap solo tiene direcciones de tintorapos.com, en los dos idiomas y x-default, con hreflang", () => {
    const entradas = sitemap();
    expect(entradas).toHaveLength(RUTAS_INDEXABLES.length * 3);
    for (const e of entradas) {
      expect(e.url.startsWith("https://tintorapos.com"), e.url).toBe(true);
      expect(e.alternates?.languages).toMatchObject({
        es: expect.stringMatching(/^https:\/\/tintorapos\.com\/es/),
        en: expect.stringMatching(/^https:\/\/tintorapos\.com\/en/),
        "x-default": expect.stringMatching(/^https:\/\/tintorapos\.com/),
      });
    }
    expect(JSON.stringify(entradas)).not.toContain("sitios.dev");
    expect(entradas.map((e) => e.url)).toContain("https://tintorapos.com/en/docs/getting-started");
    expect(entradas.map((e) => e.url)).not.toContain("https://tintorapos.com/app");
  });

  it("robots apunta al sitemap del dominio, no deja indexar la app y declara las señales de contenido", () => {
    const r = robotsTxt();
    expect(r).toContain("Sitemap: https://tintorapos.com/sitemap.xml");
    for (const privada of ["/app", "/datos", "/media", "/t/", "/e/", "/v/", "/entrar"])
      expect(r).toContain(`Disallow: ${privada}`);
    // Señales de contenido: se puede buscar y responder con el sitio; entrenar no.
    expect(r).toContain("Content-Signal: search=yes, ai-input=yes, ai-train=no");
    expect(r).toContain("Agentmap: https://tintorapos.com/.well-known/ai-catalog.json");
  });

  it("canónica y hreflang: la dirección con idioma es canónica de sí misma; sin idioma, la x-default", () => {
    expect(alternatesDe("/terminos", "en", true)).toEqual({
      canonical: "https://tintorapos.com/en/terms",
      languages: {
        es: "https://tintorapos.com/es/terminos",
        en: "https://tintorapos.com/en/terms",
        "x-default": "https://tintorapos.com/terminos",
      },
    });
    expect(alternatesDe("", "es", false)?.canonical).toBe("https://tintorapos.com");
    expect(urlAbsoluta("", "en")).toBe("https://tintorapos.com/en");
  });

  it("los datos estructurados no pueden cerrar la etiqueta <script>", () => {
    expect(jsonLd({ texto: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});
