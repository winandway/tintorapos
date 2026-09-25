import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EstadoOrdenEnVivo, INTERVALO_PUBLICO_MS } from "@/components/publico/estado-orden";
import type { OrdenPublica } from "@/server/publico/orden";

const BASE: OrdenPublica = {
  numero: 1005,
  estado: "recibida",
  fechaPromesa: Date.UTC(2026, 8, 24, 21),
  listaEn: null,
  entregadaEn: null,
  piezas: 2,
  listas: 0,
  tieneSaldo: true,
  dia: 2,
  primerNombre: "Julio",
  idiomaCliente: "es",
  tienda: {
    nombre: "Lavandería de muestra",
    telefono: null,
    direccion: null,
    ciudad: null,
    zona: "America/Bogota",
    pais: "CO",
  },
};

let respuesta: OrdenPublica;
let llamadas = 0;

beforeEach(() => {
  llamadas = 0;
  respuesta = BASE;
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      llamadas++;
      return Promise.resolve(new Response(JSON.stringify({ orden: respuesta }), { status: 200 }));
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

/**
 * CANDADO B44 (22 sep 2026): la página del cliente era una foto fija. La
 * tienda marcaba la ropa como lista y el cliente seguía viendo «recibida».
 */
describe("la página del cliente se actualiza sola", () => {
  it("al volver a la pestaña y cada medio minuto pregunta otra vez, y cambia lo que dice", async () => {
    vi.useFakeTimers();
    render(<EstadoOrdenEnVivo inicial={BASE} codigo="QN9MS26YSQP1ABCDEFGH" idioma="es" />);
    expect(screen.getByTestId("estado-publico")).toHaveTextContent("Recibimos tu ropa.");
    expect(screen.getByTestId("piezas-publico")).toHaveTextContent("0 de 2 prendas listas");

    // La tienda deja todo listo; el cliente vuelve a la pestaña.
    respuesta = { ...BASE, estado: "lista", listas: 2 };
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    expect(llamadas).toBe(1);
    expect(screen.getByTestId("estado-publico")).toHaveTextContent("¡Tu ropa está lista!");
    expect(screen.getByTestId("piezas-publico")).toHaveTextContent("2 de 2 prendas listas");
    expect(screen.getByTestId("publico-en-vivo")).toHaveTextContent("Esta página se actualiza sola.");

    // Y sin tocar nada: una primera consulta poco después de abrirse y otra al pasar el intervalo.
    respuesta = { ...BASE, estado: "entregada", listas: 2 };
    await act(async () => {
      await vi.advanceTimersByTimeAsync(INTERVALO_PUBLICO_MS + 10);
    });
    expect(llamadas).toBe(3);
    expect(screen.getByTestId("estado-publico")).toHaveTextContent("Ya recogiste esta orden.");
    expect(String((fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]![0])).toBe(
      "/datos/publico/orden/QN9MS26YSQP1ABCDEFGH",
    );
  });

  it("si la consulta falla, se queda con lo último que sabía y no revienta", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Load failed"))),
    );
    render(<EstadoOrdenEnVivo inicial={BASE} codigo="QN9MS26YSQP1ABCDEFGH" idioma="es" />);
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      await Promise.resolve();
    });
    expect(screen.getByTestId("estado-publico")).toHaveTextContent("Recibimos tu ropa.");
  });
});
