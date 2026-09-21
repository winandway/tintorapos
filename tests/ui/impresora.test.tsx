import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ErrorImpresora,
  guardarImpresora,
  hayImpresoraDirecta,
  leerImpresora,
  mandarAImpresora,
  soporteDelEquipo,
  type ImpresoraGuardada,
} from "@/lib/impresion/conexion";

/**
 * CANDADO DE LA CONEXIÓN DIRECTA. No hay impresora en las pruebas, así que se
 * pone una simulada con la misma forma que entrega el navegador (WebUSB y Web
 * Serial) y se comprueba lo que de verdad importa: a qué salida se mandan los
 * bytes, en trozos, y que cada fallo se traduce en algo que se le pueda decir a
 * quien atiende el mostrador.
 */
const IMPRESORA: ImpresoraGuardada = {
  camino: "usb",
  nombre: "Térmica de prueba",
  vendorId: 0x04b8,
  productId: 0x0202,
  ancho: 48,
  cortar: true,
  abrirCajon: false,
};

function usbSimulado(opciones: { falla?: Error; sinSalida?: boolean } = {}) {
  const enviados: { endpoint: number; bytes: number }[] = [];
  const dispositivo = {
    vendorId: 0x04b8,
    productId: 0x0202,
    opened: false,
    configuration: null as null | { interfaces: unknown[] },
    open: vi.fn(async function (this: { opened: boolean }) {
      if (opciones.falla) throw opciones.falla;
      dispositivo.opened = true;
    }),
    close: vi.fn(async () => {}),
    selectConfiguration: vi.fn(async () => {
      dispositivo.configuration = {
        interfaces: [
          // Una interfaz que no sirve (solo entrada) y la buena, con salida «bulk».
          {
            interfaceNumber: 0,
            claimed: false,
            alternate: {
              interfaceClass: 3,
              endpoints: [{ endpointNumber: 1, direction: "in", type: "interrupt" }],
            },
          },
          {
            interfaceNumber: 1,
            claimed: false,
            alternate: {
              interfaceClass: 7,
              endpoints: opciones.sinSalida
                ? [{ endpointNumber: 2, direction: "in", type: "bulk" }]
                : [
                    { endpointNumber: 2, direction: "in", type: "bulk" },
                    { endpointNumber: 3, direction: "out", type: "bulk" },
                  ],
            },
          },
        ],
      };
    }),
    claimInterface: vi.fn(async () => {}),
    releaseInterface: vi.fn(async () => {}),
    transferOut: vi.fn(async (endpoint: number, datos: Uint8Array) => {
      enviados.push({ endpoint, bytes: datos.length });
      return { status: "ok" };
    }),
  };
  Object.defineProperty(navigator, "usb", {
    configurable: true,
    value: { getDevices: async () => [dispositivo], requestDevice: async () => dispositivo },
  });
  return { dispositivo, enviados };
}

describe("conexión directa con la impresora", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    Reflect.deleteProperty(navigator, "usb");
    Reflect.deleteProperty(navigator, "serial");
  });

  it("manda los bytes a la salida «bulk» de la interfaz de impresora, en trozos de 4 KB", async () => {
    const { dispositivo, enviados } = usbSimulado();
    await mandarAImpresora(IMPRESORA, new Uint8Array(9000));
    expect(dispositivo.claimInterface).toHaveBeenCalledWith(1);
    expect(enviados).toEqual([
      { endpoint: 3, bytes: 4096 },
      { endpoint: 3, bytes: 4096 },
      { endpoint: 3, bytes: 808 },
    ]);
  });

  it("si Windows tiene tomada la impresora, lo dice con su nombre y no con un error raro", async () => {
    const tomada = new Error("Access denied.");
    tomada.name = "SecurityError";
    usbSimulado({ falla: tomada });
    await expect(mandarAImpresora(IMPRESORA, new Uint8Array(10))).rejects.toMatchObject({
      codigo: "ocupada",
    });
  });

  it("si el aparato elegido no es una impresora, se avisa", async () => {
    usbSimulado({ sinSalida: true });
    await expect(mandarAImpresora(IMPRESORA, new Uint8Array(10))).rejects.toMatchObject({
      codigo: "sin_salida",
    });
  });

  it("si la impresora guardada ya no está conectada, se avisa", async () => {
    usbSimulado();
    await expect(
      mandarAImpresora({ ...IMPRESORA, productId: 0x9999 }, new Uint8Array(10)),
    ).rejects.toMatchObject({ codigo: "sin_impresora" });
  });

  it("en un navegador sin WebUSB no revienta: dice que no hay soporte", async () => {
    await expect(mandarAImpresora(IMPRESORA, new Uint8Array(10))).rejects.toBeInstanceOf(ErrorImpresora);
    expect(soporteDelEquipo().usb).toBe(false);
  });

  it("por puerto serie abre a la velocidad elegida y escribe", async () => {
    const escritos: number[] = [];
    const puerto = {
      writable: null as null | { getWriter: () => unknown },
      open: vi.fn(async ({ baudRate }: { baudRate: number }) => {
        expect(baudRate).toBe(115200);
        puerto.writable = {
          getWriter: () => ({
            write: async (d: Uint8Array) => void escritos.push(d.length),
            releaseLock: () => {},
          }),
        };
      }),
      close: vi.fn(async () => {}),
      getInfo: () => ({ usbVendorId: 0x04b8, usbProductId: 0x0202 }),
    };
    Object.defineProperty(navigator, "serial", {
      configurable: true,
      value: { getPorts: async () => [puerto], requestPort: async () => puerto },
    });
    await mandarAImpresora({ ...IMPRESORA, camino: "serie", baudios: 115200 }, new Uint8Array(321));
    expect(puerto.open).toHaveBeenCalledOnce();
    expect(escritos).toEqual([321]);
  });

  it("la impresora se recuerda en ESTE equipo, y sin ella se usa la ventana del navegador", () => {
    expect(hayImpresoraDirecta()).toBe(false);
    guardarImpresora(IMPRESORA);
    expect(leerImpresora()).toMatchObject({ nombre: "Térmica de prueba", ancho: 48 });
    expect(hayImpresoraDirecta()).toBe(true);
    guardarImpresora({ ...IMPRESORA, camino: "navegador" });
    expect(hayImpresoraDirecta()).toBe(false);
    guardarImpresora(null);
    expect(leerImpresora()).toBeNull();
  });
});
