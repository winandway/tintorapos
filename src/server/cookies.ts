/** Lectura y escritura de cookies sin depender de next/headers (así las rutas se prueban solas). */

export const COOKIE_SESION = "tp_sesion";
export const COOKIE_DISPOSITIVO = "tp_disp";
export const COOKIE_CSRF = "tp_csrf";

export function leerCookies(cabecera: string | null): Record<string, string> {
  const salida: Record<string, string> = {};
  if (!cabecera) return salida;
  for (const parte of cabecera.split(";")) {
    const i = parte.indexOf("=");
    if (i < 0) continue;
    const nombre = parte.slice(0, i).trim();
    const valor = parte.slice(i + 1).trim();
    if (!nombre || nombre in salida) continue;
    try {
      salida[nombre] = decodeURIComponent(valor);
    } catch {
      salida[nombre] = valor;
    }
  }
  return salida;
}

export interface OpcionesCookie {
  maxAgeSeg?: number;
  httpOnly?: boolean;
  sameSite?: "Lax" | "Strict";
}

export function crearCookie(nombre: string, valor: string, o: OpcionesCookie = {}): string {
  const partes = [
    `${nombre}=${encodeURIComponent(valor)}`,
    "Path=/",
    "Secure",
    `SameSite=${o.sameSite ?? "Lax"}`,
  ];
  if (o.httpOnly !== false) partes.push("HttpOnly");
  if (o.maxAgeSeg !== undefined) partes.push(`Max-Age=${Math.max(0, Math.floor(o.maxAgeSeg))}`);
  return partes.join("; ");
}

export function borrarCookie(nombre: string): string {
  return `${nombre}=; Path=/; Secure; SameSite=Lax; HttpOnly; Max-Age=0`;
}
