"use client";

/**
 * Llamadas del navegador a /datos. Pone la protección CSRF, interpreta los
 * errores del servidor (con su mensaje ya traducido) y distingue «sin conexión».
 */
import { reportarFallo } from "./diagnostico";

const COOKIE_CSRF = "tp_csrf";

function leerCookie(nombre: string): string | null {
  const m = document.cookie.split("; ").find((c) => c.startsWith(`${nombre}=`));
  return m ? decodeURIComponent(m.slice(nombre.length + 1)) : null;
}

function tokenCsrf(): string {
  let t = leerCookie(COOKIE_CSRF);
  if (!t || t.length < 16) {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    t = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    const segura = location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${COOKIE_CSRF}=${t}; path=/; samesite=strict${segura}`;
  }
  return t;
}

export class ErrorApi extends Error {
  /** Por qué el navegador no pudo ni mandar («TypeError: Load failed»). Solo cuando `estado` es 0. */
  public causa = "";
  constructor(
    public estado: number,
    public codigo: string,
    mensaje: string,
    public campos: Record<string, string> = {},
    public vars: Record<string, string | number> = {},
  ) {
    super(mensaje);
  }
  get sinConexion() {
    return this.estado === 0;
  }
}

export interface OpcionesPedido {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  cuerpo?: unknown;
  turnstile?: string | null;
  senal?: AbortSignal;
}

/** Sube un archivo con multipart (misma protección CSRF que pedir). */
export async function subir<T = Record<string, unknown>>(url: string, formulario: FormData): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, {
      method: "POST",
      headers: { "x-csrf": tokenCsrf(), accept: "application/json" },
      body: formulario,
      credentials: "same-origin",
    });
  } catch (e) {
    throw sinRed(url, "POST", e);
  }
  const datos = (await r.json().catch(() => null)) as {
    error?: { codigo?: string; mensaje?: string };
  } | null;
  if (!r.ok) {
    reportarFallo({ ruta: url, metodo: "POST", estado: r.status, codigo: datos?.error?.codigo ?? "" });
    throw new ErrorApi(r.status, datos?.error?.codigo ?? "inesperado", datos?.error?.mensaje ?? "");
  }
  return datos as T;
}

/** El navegador no pudo ni mandar: se anota el porqué y se avisa al servidor por otro camino. */
function sinRed(url: string, metodo: string, e: unknown): ErrorApi {
  const causa = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  const error = new ErrorApi(0, "sin_conexion", "");
  error.causa = causa;
  // Un GET caído con el internet apagado es normal; un cambio que no sale, no.
  if (metodo !== "GET" || (typeof navigator !== "undefined" && navigator.onLine))
    reportarFallo({ ruta: url, metodo, estado: 0, codigo: causa });
  return error;
}

export async function pedir<T = Record<string, unknown>>(url: string, o: OpcionesPedido = {}): Promise<T> {
  const metodo = o.metodo ?? (o.cuerpo !== undefined ? "POST" : "GET");
  const cabeceras: Record<string, string> = { accept: "application/json" };
  if (metodo !== "GET") cabeceras["x-csrf"] = tokenCsrf();
  if (o.cuerpo !== undefined) cabeceras["content-type"] = "application/json";
  if (o.turnstile) cabeceras["x-turnstile"] = o.turnstile;
  let r: Response;
  try {
    r = await fetch(url, {
      method: metodo,
      headers: cabeceras,
      body: o.cuerpo !== undefined ? JSON.stringify(o.cuerpo) : undefined,
      credentials: "same-origin",
      signal: o.senal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw sinRed(url, metodo, e);
  }
  const texto = await r.text();
  let datos: unknown = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = null;
  }
  if (!r.ok) {
    const err = (
      datos as {
        error?: {
          codigo?: string;
          mensaje?: string;
          campos?: Record<string, string>;
          vars?: Record<string, string | number>;
        };
      } | null
    )?.error;
    // Un cambio rechazado por el servidor se reporta; lo esperado de una lectura (401 al vencer la sesión), no.
    if (metodo !== "GET" && r.status !== 401)
      reportarFallo({ ruta: url, metodo, estado: r.status, codigo: err?.codigo ?? "" });
    throw new ErrorApi(
      r.status,
      err?.codigo ?? "inesperado",
      err?.mensaje ?? "",
      err?.campos ?? {},
      err?.vars ?? {},
    );
  }
  return datos as T;
}
