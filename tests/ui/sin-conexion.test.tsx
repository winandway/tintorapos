import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { borrarCache, borrarTodo, operaciones } from "@/lib/sin-conexion/almacen";
import {
  actualizarLocal,
  buscarClientesLocal,
  buscarOrdenLocal,
  datosSinConexion,
  pedirConCache,
  refrescarDatosSinConexion,
  type DatosSinConexion,
} from "@/lib/sin-conexion/cache";
import { descartarOperacion, encolar, estadoCola, sincronizar } from "@/lib/sin-conexion/cola";

type Manejo = (url: string, init?: RequestInit) => Response | Promise<Response>;
let manejo: Manejo;

beforeEach(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => Promise.resolve(manejo(String(url), init))),
  );
  await borrarTodo();
});
afterEach(() => vi.unstubAllGlobals());

const json = (datos: unknown, estado = 200) =>
  new Response(JSON.stringify(datos), { status: estado, headers: { "content-type": "application/json" } });
const sinRed = () => {
  throw new TypeError("Failed to fetch");
};

describe("cola sin conexión", () => {
  it("encola en orden y sube por lotes; lo que falla queda con su error para revisar", async () => {
    await encolar({ tipo: "crear_orden", cuerpo: { a: 1 }, creadoEn: 1 });
    const segunda = await encolar({
      tipo: "estado",
      ordenId: "o1",
      cuerpo: { estado: "lista" },
      creadoEn: 2,
    });
    await encolar({ tipo: "pago", ordenId: "o1", cuerpo: {}, creadoEn: 3 });
    expect(await estadoCola()).toEqual({ pendientes: 3, conError: 0 });

    const enviados: unknown[] = [];
    manejo = (url, init) => {
      expect(url).toBe("/datos/sync");
      const cuerpo = JSON.parse(String(init?.body)) as {
        ops: { id: string; tipo: string; ordenId?: string }[];
      };
      enviados.push(cuerpo.ops.map((o) => o.tipo));
      expect((init?.headers as Record<string, string>)["x-csrf"]).toMatch(/^[0-9a-f]{48}$/);
      return json({
        detenido: false,
        resultados: cuerpo.ops.map((o) =>
          o.id === segunda.id
            ? { id: o.id, ok: false, codigo: "estado_invalido", mensaje: "No" }
            : { id: o.id, ok: true },
        ),
      });
    };
    const r = await sincronizar();
    expect(r).toEqual({ subidas: 2, conError: 1, sinConexion: false, sesionVencida: false });
    expect(enviados).toEqual([["crear_orden", "estado", "pago"]]);
    const quedan = await operaciones();
    expect(quedan).toHaveLength(1);
    expect(quedan[0]!.error).toEqual({ codigo: "estado_invalido", mensaje: "No" });
    expect(await estadoCola()).toEqual({ pendientes: 0, conError: 1 });
    await descartarOperacion(segunda.id);
    expect(await operaciones()).toHaveLength(0);
  });

  it("sin red o con la sesión vencida no se pierde nada", async () => {
    await encolar({ tipo: "pago", ordenId: "o1", cuerpo: {} });
    manejo = sinRed;
    expect(await sincronizar()).toMatchObject({ subidas: 0, sinConexion: true });
    manejo = () => json({ error: { codigo: "no_autenticado", mensaje: "" } }, 401);
    expect(await sincronizar()).toMatchObject({ subidas: 0, sesionVencida: true });
    expect(await operaciones()).toHaveLength(1);
  });

  it("si el servidor se detiene a mitad, lo no procesado queda para después", async () => {
    await encolar({ tipo: "crear_orden", cuerpo: {}, creadoEn: 1 });
    await encolar({ tipo: "estado", cuerpo: {}, creadoEn: 2 });
    manejo = (_url, init) => {
      const { ops } = JSON.parse(String(init?.body)) as { ops: { id: string }[] };
      return json({ detenido: true, resultados: [{ id: ops[0]!.id, ok: true }] });
    };
    expect((await sincronizar()).subidas).toBe(1);
    expect(await operaciones()).toHaveLength(1);
  });

  it("dos llamadas a la vez comparten la misma sincronización", async () => {
    await encolar({ tipo: "pago", cuerpo: {} });
    let llamadas = 0;
    manejo = (_url, init) => {
      llamadas++;
      const { ops } = JSON.parse(String(init?.body)) as { ops: { id: string }[] };
      return json({ detenido: false, resultados: ops.map((o) => ({ id: o.id, ok: true })) });
    };
    const [a, b] = await Promise.all([sincronizar(), sincronizar()]);
    expect(a).toBe(b);
    expect(llamadas).toBe(1);
  });
});

describe("caché y búsquedas locales", () => {
  const datos: DatosSinConexion = {
    generadoEn: 1,
    clientes: [
      {
        id: "c1",
        nombre: "Ana",
        apellido: "Pérez",
        telefono: "+13055550142",
        telefono_digitos: "3055550142",
        idioma: "es",
      },
      { id: "c2", nombre: "Bob", apellido: null, telefono: null, telefono_digitos: null, idioma: "en" },
    ],
    ordenes: [
      {
        id: "o1",
        numero: 1001,
        codigo_publico: "A".repeat(20),
        estado: "lista",
        urgente: 0,
        fecha_promesa: 1,
        total_cents: 100,
        pagado_cents: 0,
        creada_en: 1,
        cliente_id: "c1",
        cliente_nombre: "Ana",
        cliente_apellido: "Pérez",
      },
    ],
    prendas: [
      {
        id: "p1",
        orden_id: "o1",
        prenda_es: "Camisa",
        prenda_en: "Shirt",
        servicio_es: "Seco",
        servicio_en: null,
        codigo_etiqueta: "B".repeat(12),
        estado: "lista",
        ubicacion: "A-1",
      },
    ],
  };

  it("guarda lo del servidor y lo devuelve sin conexión", async () => {
    manejo = () => json({ valor: 42 });
    expect(await pedirConCache("/datos/catalogo")).toEqual({ valor: 42 });
    manejo = sinRed;
    expect(await pedirConCache("/datos/catalogo")).toEqual({ valor: 42 });
    await expect(pedirConCache("/datos/otra")).rejects.toMatchObject({ codigo: "sin_conexion" });
    manejo = () => json({ error: { codigo: "sin_permiso" } }, 403);
    await expect(pedirConCache("/datos/catalogo")).rejects.toMatchObject({ codigo: "sin_permiso" });
  });

  it("refresca, busca clientes y órdenes, y actualiza la copia local", async () => {
    manejo = () => json(datos);
    await refrescarDatosSinConexion();
    const d = await datosSinConexion();
    expect(buscarClientesLocal(d, "305-555")).toHaveLength(1);
    expect(buscarClientesLocal(d, "bob")[0]!.id).toBe("c2");
    expect(buscarClientesLocal(undefined, "x")).toEqual([]);
    expect(buscarOrdenLocal(d, "", "A".repeat(20))[0]!.orden.id).toBe("o1");
    expect(buscarOrdenLocal(d, "", "B".repeat(12))[0]).toMatchObject({ prendaId: "p1" });
    expect(buscarOrdenLocal(d, "#1001", null)).toHaveLength(1);
    expect(buscarOrdenLocal(d, "pérez", null)).toHaveLength(1);
    expect(buscarOrdenLocal(d, "", "C".repeat(12))).toEqual([]);
    expect(buscarOrdenLocal(d, "", "C".repeat(20))).toEqual([]);
    expect(buscarOrdenLocal(undefined, "1", null)).toEqual([]);
    await actualizarLocal((x) => {
      x.ordenes[0]!.estado = "entregada";
    });
    expect((await datosSinConexion())!.ordenes[0]!.estado).toBe("entregada");
  });
});

describe("borrar la copia local", () => {
  it("borra los datos guardados pero conserva la cola de ventas sin subir", async () => {
    manejo = () =>
      new Response(JSON.stringify({ clientes: [], ordenes: [], prendas: [], generadoEn: 1 }), {
        status: 200,
      });
    await refrescarDatosSinConexion();
    await encolar({ tipo: "pago", cuerpo: {} });
    await borrarCache();
    expect(await datosSinConexion()).toBeUndefined();
    expect(await operaciones()).toHaveLength(1);
  });
});
