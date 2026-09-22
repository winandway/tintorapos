"use client";

/**
 * Cuando algo falla EN EL TELÉFONO (la red se cae a mitad de un envío, el
 * servidor responde un error a un cambio), nadie lo ve desde afuera: la pantalla
 * dice «algo salió mal» y ya. Aquí se manda un parte mínimo al servidor, sin
 * datos personales, para que /datos/salud enseñe qué está fallando en qué
 * equipo. Candado: tests/unit/diagnostico.test.ts.
 */
export interface FalloCliente {
  ruta: string;
  metodo: string;
  /** Estado HTTP de la respuesta, o 0 si el envío ni llegó. */
  estado: number;
  /** Código del error del servidor, o «nombre: mensaje» de la excepción del navegador. */
  codigo: string;
}

const MAX_POR_MINUTO = 6;
let enviados: number[] = [];

/** Los ids no le sirven a nadie afuera y no deben viajar: la ruta queda como «/datos/ordenes/(id)/estado». */
export function rutaGenerica(ruta: string): string {
  return ruta
    .split("?")[0]!
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "(id)")
    .replace(/\/[A-Z0-9]{12,20}(?=\/|$)/g, "/(id)")
    .slice(0, 80);
}

/** «Safari en iPhone (app instalada)»: lo justo para saber en qué equipo pasa. */
export function describirEquipo(agente: string, instalada: boolean, conServiceWorker: boolean): string {
  const ua = agente.toLowerCase();
  const sistema = /iphone|ipad|ipod/.test(ua)
    ? "iOS"
    : /android/.test(ua)
      ? "Android"
      : /macintosh|mac os/.test(ua)
        ? "Mac"
        : /windows/.test(ua)
          ? "Windows"
          : "otro";
  const navegador =
    /crios|chrome/.test(ua) && !/edg/.test(ua) ? "Chrome" : /safari/.test(ua) ? "Safari" : "otro";
  return `${navegador} en ${sistema}${instalada ? " (app instalada)" : ""}${conServiceWorker ? "" : " (sin SW)"}`;
}

export function reportarFallo(f: FalloCliente): void {
  if (typeof navigator === "undefined" || typeof window === "undefined") return;
  const ahora = Date.now();
  enviados = enviados.filter((t) => ahora - t < 60_000);
  if (enviados.length >= MAX_POR_MINUTO) return;
  enviados.push(ahora);
  const instalada =
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const cuerpo = JSON.stringify({
    ruta: rutaGenerica(f.ruta),
    metodo: f.metodo,
    estado: f.estado,
    codigo: f.codigo.slice(0, 120),
    equipo: describirEquipo(navigator.userAgent, instalada, Boolean(navigator.serviceWorker?.controller)),
    enLinea: navigator.onLine,
  });
  try {
    // sendBeacon no pasa por el mismo camino que fetch: si el fallo es de ESE
    // camino, el parte igual sale. Si tampoco hay sendBeacon, fetch con keepalive.
    if (!navigator.sendBeacon?.("/datos/diagnostico", new Blob([cuerpo], { type: "application/json" })))
      fetch("/datos/diagnostico", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: cuerpo,
        keepalive: true,
        credentials: "omit",
      }).catch(() => {});
  } catch {
    /* el parte es lo único que puede fallar en silencio */
  }
}

/** Solo para pruebas. */
export function _reiniciarDiagnostico(): void {
  enviados = [];
}
