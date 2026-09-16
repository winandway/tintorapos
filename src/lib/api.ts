"use client";

/**
 * Llamadas del navegador a /datos. Pone la protección CSRF, interpreta los
 * errores del servidor (con su mensaje ya traducido) y distingue «sin conexión».
 */
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
    throw new ErrorApi(0, "sin_conexion", "");
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
