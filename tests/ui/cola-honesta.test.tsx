import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { borrarTodo, operaciones } from "@/lib/sin-conexion/almacen";
import { EVENTO_COLA, EVENTO_SINCRONIZADO } from "@/lib/sin-conexion/cola";
import { cambiarEstadoOrden, entregarOrden } from "@/lib/operaciones";

type Manejo = (url: string, init?: RequestInit) => Response | Promise<Response>;
let manejo: Manejo;
const llamadas: string[] = [];

beforeEach(async () => {
  llamadas.length = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      llamadas.push(`${init?.method ?? "GET"} ${String(url)}`);
      return Promise.resolve(manejo(String(url), init));
    }),
  );
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: () => true });
  await borrarTodo();
});
afterEach(() => vi.unstubAllGlobals());

const json = (datos: unknown, estado = 200) =>
  new Response(JSON.stringify(datos), { status: estado, headers: { "content-type": "application/json" } });
const seCae = () => {
  throw new TypeError("Load failed");
};

/**
 * CANDADO B44 (22 sep 2026): en el celular un envío se cae a mitad y la pantalla
 * lo daba por hecho en silencio. Ahora: se reintenta una vez; si vuelve a fallar
 * queda en la cola, se dispara la subida de inmediato y la respuesta viene
 * marcada `enCola` para que la pantalla lo diga.
 */
describe("cola honesta: reintento, subida inmediata y respuesta marcada", () => {
  it("si el primer envío se cae y el segundo sale, no se encola nada", async () => {
    let intentos = 0;
    manejo = (url) => {
      if (url.endsWith("/estado") && intentos++ === 0) return seCae();
      return json({ estadoNuevo: "lista", quedoLista: true });
    };
    const r = await cambiarEstadoOrden("o1", { estado: "lista" });
    expect(r).toEqual({ estadoNuevo: "lista", quedoLista: true });
    expect(r.enCola).toBeUndefined();
    expect(llamadas.filter((l) => l.endsWith("/estado"))).toHaveLength(2);
    expect(await operaciones()).toHaveLength(0);
  });

  it("si se cae dos veces con internet, queda en la cola, se avisa y se intenta subir YA", async () => {
    const avisos: string[] = [];
    window.addEventListener(EVENTO_COLA, () => avisos.push("cola"));
    window.addEventListener(EVENTO_SINCRONIZADO, () => avisos.push("sincronizado"));
    manejo = (url, init) => {
      if (url.endsWith("/entregar")) return seCae();
      if (url === "/datos/sync") {
        const { ops } = JSON.parse(String(init?.body)) as { ops: { id: string }[] };
        return json({ detenido: false, resultados: ops.map((o) => ({ id: o.id, ok: true })) });
      }
      return json({});
    };
    const r = await entregarOrden("o1", { forzar: true });
    expect(r.enCola).toBe(true);
    expect(llamadas.filter((l) => l.endsWith("/entregar"))).toHaveLength(2);
    // La subida arranca sola, sin esperar al reloj de 30 s, y al terminar avisa.
    await vi.waitFor(() => expect(llamadas).toContain("POST /datos/sync"));
    await vi.waitFor(() => expect(avisos).toContain("sincronizado"));
    expect(await operaciones()).toHaveLength(0);
  });

  it("sin internet no se insiste: directo a la cola, sin tocar la red", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    manejo = seCae;
    const r = await cambiarEstadoOrden("o1", { estado: "en_proceso" });
    expect(r.enCola).toBe(true);
    expect(llamadas).toEqual([]);
    expect(await operaciones()).toHaveLength(1);
  });

  it("un error del servidor (no de red) NO se reintenta ni se encola: se muestra", async () => {
    manejo = () => json({ error: { codigo: "sin_permiso", mensaje: "No" } }, 403);
    await expect(cambiarEstadoOrden("o1", { estado: "lista" })).rejects.toMatchObject({
      codigo: "sin_permiso",
    });
    expect(llamadas.filter((l) => l.endsWith("/estado"))).toHaveLength(1);
    expect(await operaciones()).toHaveLength(0);
  });
});
