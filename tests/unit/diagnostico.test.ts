import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _reiniciarDiagnostico, describirEquipo, reportarFallo, rutaGenerica } from "@/lib/diagnostico";
import { resumirFallos } from "@/server/diagnostico";

/**
 * CANDADO DEL DIAGNÓSTICO REMOTO: lo que falla en un teléfono tiene que verse
 * desde afuera, sin que viaje nada personal (ids de órdenes, teléfonos, nombres).
 */
describe("parte de fallo desde el navegador", () => {
  beforeEach(() => _reiniciarDiagnostico());
  afterEach(() => vi.unstubAllGlobals());

  it("la ruta viaja sin ids: ni de orden, ni códigos de recibo o etiqueta, ni parámetros", () => {
    expect(rutaGenerica("/datos/ordenes/55349305-eeaa-4462-90ac-5c14ad5439e6/estado")).toBe(
      "/datos/ordenes/(id)/estado",
    );
    expect(rutaGenerica("/datos/publico/orden/QN9MS26YSQP1ABCDEFGH")).toBe("/datos/publico/orden/(id)");
    expect(rutaGenerica("/datos/escaneo?codigo=3055550100")).toBe("/datos/escaneo");
    expect(rutaGenerica("/datos/clientes?q=Ana%20P%C3%A9rez")).toBe("/datos/clientes");
  });

  it("describe el equipo sin identificarlo", () => {
    const iphone =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
    expect(describirEquipo(iphone, true, true)).toBe("Safari en iOS (app instalada)");
    expect(describirEquipo(iphone, false, false)).toBe("Safari en iOS (sin SW)");
    const android =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36";
    expect(describirEquipo(android, false, true)).toBe("Chrome en Android");
  });

  it("manda el parte por sendBeacon con la ruta limpia, y no más de seis por minuto", () => {
    const beacon = vi.fn(() => true);
    vi.stubGlobal("navigator", {
      sendBeacon: beacon,
      userAgent: "Mozilla/5.0 (iPhone) Safari/604.1",
      onLine: true,
      serviceWorker: { controller: {} },
    });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    for (let i = 0; i < 8; i++)
      reportarFallo({
        ruta: "/datos/ordenes/55349305-eeaa-4462-90ac-5c14ad5439e6/entregar",
        metodo: "POST",
        estado: 0,
        codigo: "TypeError: Load failed",
      });
    expect(beacon).toHaveBeenCalledTimes(6);
    const [url, blob] = beacon.mock.calls[0] as unknown as [string, Blob];
    expect(url).toBe("/datos/diagnostico");
    expect(blob.type).toBe("application/json");
  });

  it("si no hay sendBeacon, sale por fetch con keepalive y sin credenciales", () => {
    const fetchFalso = vi.fn(() => Promise.resolve(new Response("{}")));
    vi.stubGlobal("navigator", { userAgent: "x", onLine: true });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    vi.stubGlobal("fetch", fetchFalso);
    reportarFallo({ ruta: "/datos/sync", metodo: "POST", estado: 500, codigo: "inesperado" });
    expect(fetchFalso).toHaveBeenCalledOnce();
    const [, init] = fetchFalso.mock.calls[0] as unknown as [string, RequestInit];
    expect(init).toMatchObject({ method: "POST", keepalive: true, credentials: "omit" });
    expect(JSON.parse(String(init.body))).toMatchObject({
      ruta: "/datos/sync",
      estado: 500,
      codigo: "inesperado",
    });
  });

  it("el resumen del canario: cuántos y los últimos, en una línea cada uno", () => {
    const r = resumirFallos([
      {
        ruta: "/datos/sync",
        metodo: "POST",
        estado: 0,
        codigo: "TypeError: Load failed",
        equipo: "Safari en iOS",
        hora: Date.UTC(2026, 8, 22, 6, 10),
      },
      {
        ruta: "/datos/ordenes/(id)/estado",
        metodo: "POST",
        estado: 403,
        codigo: "sin_permiso",
        equipo: "Chrome en Android",
        enLinea: true,
        hora: Date.UTC(2026, 8, 22, 6, 12),
      },
    ]);
    expect(r.cantidad).toBe(2);
    expect(r.ultimos[0]).toBe("06:12 POST /datos/ordenes/(id)/estado → 403 sin_permiso · Chrome en Android");
    expect(r.ultimos[1]).toBe(
      "06:10 POST /datos/sync → sin respuesta TypeError: Load failed · Safari en iOS",
    );
  });
});
