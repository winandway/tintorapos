"use client";

/**
 * Conexión DIRECTA con la impresora de recibos, sin el diálogo del navegador ni
 * los drivers del sistema. Dos caminos, los dos de Chrome y Edge:
 *
 *  - **USB (WebUSB):** Mac, Linux, Android y ChromeOS. En Windows el driver de
 *    la impresora acapara el USB y no deja; ahí se usa el puerto serie.
 *  - **Puerto serie (Web Serial):** Windows con el puerto COM de la impresora,
 *    y las térmicas Bluetooth emparejadas como puerto serie.
 *
 * El permiso se pide UNA vez con el selector del navegador; después esa
 * computadora imprime de un toque. La elección se guarda por equipo.
 */

/* Tipos mínimos: estas APIs todavía no vienen en los tipos de TypeScript. */
interface PuntoUsb {
  endpointNumber: number;
  direction: "in" | "out";
  type: "bulk" | "interrupt" | "isochronous";
}
interface InterfazUsb {
  interfaceNumber: number;
  alternate: { interfaceClass: number; endpoints: PuntoUsb[] };
  claimed: boolean;
}
interface DispositivoUsb {
  vendorId: number;
  productId: number;
  productName?: string;
  manufacturerName?: string;
  opened: boolean;
  configuration: { interfaces: InterfazUsb[] } | null;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(n: number): Promise<void>;
  claimInterface(n: number): Promise<void>;
  releaseInterface(n: number): Promise<void>;
  transferOut(endpoint: number, datos: BufferSource): Promise<{ status: string }>;
}
interface ApiUsb {
  requestDevice(o: { filters: object[] }): Promise<DispositivoUsb>;
  getDevices(): Promise<DispositivoUsb[]>;
}
interface PuertoSerie {
  writable: WritableStream<Uint8Array> | null;
  open(o: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  getInfo(): { usbVendorId?: number; usbProductId?: number };
}
interface ApiSerie {
  requestPort(): Promise<PuertoSerie>;
  getPorts(): Promise<PuertoSerie[]>;
}

const usb = (): ApiUsb | undefined =>
  typeof navigator === "undefined" ? undefined : (navigator as unknown as { usb?: ApiUsb }).usb;
const serie = (): ApiSerie | undefined =>
  typeof navigator === "undefined" ? undefined : (navigator as unknown as { serial?: ApiSerie }).serial;

/**
 * `recibos` solo vale para el puesto de etiquetas: «saca las etiquetas por la
 * misma impresora de recibos», en papel, para graparlas a la prenda.
 */
export type CaminoImpresion = "usb" | "serie" | "navegador" | "recibos";
/** Cada equipo puede tener dos impresoras: la de recibos y la de etiquetas. */
export type PuestoImpresora = "recibos" | "etiquetas";
export const BAUDIOS = [9600, 19200, 38400, 57600, 115200] as const;

export interface ImpresoraGuardada {
  camino: CaminoImpresion;
  nombre: string;
  vendorId?: number;
  productId?: number;
  baudios?: number;
  /** Letras por renglón: 48 en papel de 80 mm, 32 en papel de 58 mm. */
  ancho: 48 | 42 | 32;
  cortar: boolean;
  abrirCajon: boolean;
  /** Solo etiquetas: el idioma que habla la etiquetera. */
  lenguaje?: "tspl" | "zpl" | "escpos";
  /** Solo etiquetas: el tamaño de la etiqueta del rollo. */
  tamano?: "2x1" | "2.25x1.25" | "3x1";
}

export const CLAVE_IMPRESORA = "tintora:impresora";
const clave = (puesto: PuestoImpresora) =>
  puesto === "recibos" ? CLAVE_IMPRESORA : `${CLAVE_IMPRESORA}:etiquetas`;

export function leerImpresora(puesto: PuestoImpresora = "recibos"): ImpresoraGuardada | null {
  try {
    const t = localStorage.getItem(clave(puesto));
    return t ? (JSON.parse(t) as ImpresoraGuardada) : null;
  } catch {
    return null;
  }
}

export function guardarImpresora(i: ImpresoraGuardada | null, puesto: PuestoImpresora = "recibos"): void {
  try {
    if (i) localStorage.setItem(clave(puesto), JSON.stringify(i));
    else localStorage.removeItem(clave(puesto));
  } catch {
    /* modo privado: se sigue sin recordar */
  }
}

/** Qué sabe hacer ESTE equipo. De aquí sale lo que ofrece la pantalla. */
export function soporteDelEquipo(): { usb: boolean; serie: boolean; windows: boolean; ios: boolean } {
  const agente = typeof navigator === "undefined" ? "" : navigator.userAgent;
  return {
    usb: Boolean(usb()),
    serie: Boolean(serie()),
    windows: /Windows/i.test(agente),
    ios: /iPad|iPhone|iPod/.test(agente) || (/Macintosh/.test(agente) && "ontouchend" in globalThis),
  };
}

/** Un fallo que se le puede explicar a la persona en su idioma. */
export class ErrorImpresora extends Error {
  constructor(
    public codigo:
      | "sin_soporte"
      | "cancelado"
      | "sin_impresora"
      | "ocupada"
      | "sin_salida"
      | "desconectada"
      | "desconocido",
    detalle?: string,
  ) {
    super(detalle ?? codigo);
  }
}

function traducir(e: unknown): ErrorImpresora {
  if (e instanceof ErrorImpresora) return e;
  const nombre = e instanceof Error ? e.name : "";
  const texto = e instanceof Error ? e.message : String(e);
  if (nombre === "NotFoundError") return new ErrorImpresora("cancelado", texto);
  // El sistema (casi siempre el driver de Windows) tiene tomada la impresora.
  if (nombre === "SecurityError" || nombre === "NetworkError" || /access denied|claim/i.test(texto))
    return new ErrorImpresora("ocupada", texto);
  if (nombre === "InvalidStateError") return new ErrorImpresora("desconectada", texto);
  return new ErrorImpresora("desconocido", texto);
}

/** Abre el selector del navegador para elegir la impresora USB. */
export async function elegirUsb(): Promise<{ nombre: string; vendorId: number; productId: number }> {
  const api = usb();
  if (!api) throw new ErrorImpresora("sin_soporte");
  try {
    // Sin filtros a propósito: muchas térmicas baratas no se anuncian como
    // «impresora» (clase 7) sino como dispositivo del fabricante.
    const d = await api.requestDevice({ filters: [] });
    return {
      nombre: [d.manufacturerName, d.productName].filter(Boolean).join(" ") || "USB",
      vendorId: d.vendorId,
      productId: d.productId,
    };
  } catch (e) {
    throw traducir(e);
  }
}

/** Abre el selector del navegador para elegir el puerto serie de la impresora. */
export async function elegirSerie(): Promise<{ nombre: string; vendorId?: number; productId?: number }> {
  const api = serie();
  if (!api) throw new ErrorImpresora("sin_soporte");
  try {
    const p = await api.requestPort();
    const info = p.getInfo();
    return {
      nombre: info.usbVendorId ? `COM · USB ${info.usbVendorId.toString(16)}` : "COM",
      vendorId: info.usbVendorId,
      productId: info.usbProductId,
    };
  } catch (e) {
    throw traducir(e);
  }
}

async function mandarPorUsb(i: ImpresoraGuardada, datos: Uint8Array): Promise<void> {
  const api = usb();
  if (!api) throw new ErrorImpresora("sin_soporte");
  const d = (await api.getDevices()).find((x) => x.vendorId === i.vendorId && x.productId === i.productId);
  if (!d) throw new ErrorImpresora("sin_impresora");
  try {
    if (!d.opened) await d.open();
    if (!d.configuration) await d.selectConfiguration(1);
    // La interfaz que tenga una salida «bulk»: por ahí entran los comandos.
    const interfaz = d.configuration?.interfaces.find((x) =>
      x.alternate.endpoints.some((p) => p.direction === "out" && p.type === "bulk"),
    );
    const salida = interfaz?.alternate.endpoints.find((p) => p.direction === "out" && p.type === "bulk");
    if (!interfaz || !salida) throw new ErrorImpresora("sin_salida");
    if (!interfaz.claimed) await d.claimInterface(interfaz.interfaceNumber);
    // En trozos: algunas impresoras se atragantan con más de 4 KB de un golpe.
    for (let n = 0; n < datos.length; n += 4096) {
      const r = await d.transferOut(salida.endpointNumber, datos.slice(n, n + 4096));
      if (r.status !== "ok") throw new ErrorImpresora("desconectada", r.status);
    }
  } catch (e) {
    throw traducir(e);
  }
}

async function mandarPorSerie(i: ImpresoraGuardada, datos: Uint8Array): Promise<void> {
  const api = serie();
  if (!api) throw new ErrorImpresora("sin_soporte");
  const puertos = await api.getPorts();
  const p =
    puertos.find((x) => {
      const info = x.getInfo();
      return info.usbVendorId === i.vendorId && info.usbProductId === i.productId;
    }) ?? puertos[0];
  if (!p) throw new ErrorImpresora("sin_impresora");
  try {
    if (!p.writable) await p.open({ baudRate: i.baudios ?? 9600 });
    const escritor = p.writable?.getWriter();
    if (!escritor) throw new ErrorImpresora("sin_salida");
    try {
      await escritor.write(datos);
    } finally {
      escritor.releaseLock();
    }
  } catch (e) {
    throw traducir(e);
  }
}

/** Manda los bytes a la impresora guardada. Lanza `ErrorImpresora` si no sale. */
export async function mandarAImpresora(i: ImpresoraGuardada, datos: Uint8Array): Promise<void> {
  if (i.camino === "usb") return mandarPorUsb(i, datos);
  if (i.camino === "serie") return mandarPorSerie(i, datos);
  if (i.camino === "recibos") {
    const deRecibos = leerImpresora("recibos");
    if (!deRecibos || deRecibos.camino === "navegador" || deRecibos.camino === "recibos")
      throw new ErrorImpresora("sin_impresora");
    return mandarAImpresora(deRecibos, datos);
  }
  throw new ErrorImpresora("sin_impresora");
}

/** Hay una impresora conectada directo en este equipo (no la del navegador). */
export function hayImpresoraDirecta(puesto: PuestoImpresora = "recibos"): boolean {
  const i = leerImpresora(puesto);
  return Boolean(i && i.camino !== "navegador");
}
