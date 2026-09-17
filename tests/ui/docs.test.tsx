import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const empujar = vi.fn();
let rutaActual = "/es/docs/caja";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: empujar, refresh: vi.fn() }),
  usePathname: () => rutaActual,
}));

import { BarraDocs, type SeccionBarra } from "@/components/docs/barra-docs";
import { GUIAS, guiasDeSeccion, indiceBuscador, SECCIONES } from "@/lib/docs";
import { buscarGuias } from "@/lib/docs/buscar";
import { diccionario } from "@/lib/i18n";
import { ProveedorIdioma } from "@/lib/i18n/cliente";
import { rutaGuia } from "@/lib/rutas-publicas";

function montarBarra() {
  const secciones: SeccionBarra[] = SECCIONES.map((s) => ({
    clave: s.clave,
    titulo: s.es,
    icono: s.icono,
    guias: guiasDeSeccion(s.clave).map((g) => ({
      slug: g.slug,
      titulo: g.es.titulo,
      href: rutaGuia("es", g.slug),
    })),
  }));
  return render(
    <ProveedorIdioma idioma="es" d={diccionario("es")}>
      <BarraDocs secciones={secciones} indice={indiceBuscador("es")} inicioDocs="/es/docs" />
    </ProveedorIdioma>,
  );
}

describe("Docs: contenido (candado)", () => {
  it("cada guía tiene los dos idiomas con la misma estructura de bloques", () => {
    for (const g of GUIAS) {
      expect(
        g.en.bloques.map((b) => b.t),
        g.slug,
      ).toEqual(g.es.bloques.map((b) => b.t));
      g.es.bloques.forEach((b, i) => {
        const e = g.en.bloques[i]!;
        if ((b.t === "pasos" || b.t === "lista") && (e.t === "pasos" || e.t === "lista"))
          expect(e.items.length, `${g.slug} bloque ${i}`).toBe(b.items.length);
        if (b.t === "figura" && e.t === "figura") expect(e.figura).toBe(b.figura);
      });
    }
  });

  it("los enlaces internos apuntan a guías que existen y las negritas están cerradas", () => {
    const slugs = new Set(GUIAS.map((g) => g.slug));
    const texto = JSON.stringify(GUIAS);
    for (const [, destino] of texto.matchAll(/\]\((\/docs\/[^)]+)\)/g)) {
      expect(slugs.has(destino!.replace("/docs/", "")), destino).toBe(true);
    }
    for (const g of GUIAS)
      for (const idioma of ["es", "en"] as const)
        expect((JSON.stringify(g[idioma]).match(/\*\*/g)?.length ?? 0) % 2, `${g.slug} ${idioma}`).toBe(0);
  });

  it("los slugs son únicos y cada sección tiene guías", () => {
    expect(new Set(GUIAS.map((g) => g.slug)).size).toBe(GUIAS.length);
    for (const s of SECCIONES) expect(guiasDeSeccion(s.clave).length).toBeGreaterThan(0);
  });
});

describe("Docs: buscador", () => {
  it("ignora acentos y mayúsculas, exige todas las palabras y pone primero el título", () => {
    const indice = indiceBuscador("es");
    expect(buscarGuias(indice, "AUTORIZACION")[0]?.slug).toBe("autorizaciones");
    expect(buscarGuias(indice, "cierre efectivo")[0]?.slug).toBe("caja");
    expect(buscarGuias(indice, "caja zzzz")).toEqual([]);
    expect(buscarGuias(indice, "   ")).toEqual([]);
  });
});

describe("Docs: barra lateral", () => {
  beforeEach(() => {
    empujar.mockClear();
    rutaActual = "/es/docs/caja";
  });

  it("marca la guía activa", () => {
    montarBarra();
    const activos = screen.getAllByRole("link", { current: "page" });
    expect(activos.length).toBeGreaterThan(0);
    expect(activos.every((a) => a.getAttribute("href") === "/es/docs/caja")).toBe(true);
  });

  it("⌘K abre UNA sola ventana aunque haya botón de escritorio y de celular (comprobado en rojo)", () => {
    montarBarra();
    expect(screen.getAllByRole("button", { name: /Buscar/ })).toHaveLength(2);
    act(() => {
      fireEvent.keyDown(window, { key: "k", metaKey: true });
    });
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    const entrada = screen.getByRole("combobox");
    fireEvent.change(entrada, { target: { value: "dos pasos" } });
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
    fireEvent.keyDown(entrada, { key: "Enter" });
    expect(empujar).toHaveBeenCalledWith("/es/docs/dos-pasos");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Escape cierra la ventana", () => {
    montarBarra();
    fireEvent.click(screen.getAllByRole("button", { name: /Buscar/ })[0]!);
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
