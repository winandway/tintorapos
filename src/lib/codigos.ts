/**
 * Identificadores y códigos seguros. Usan Web Crypto: funcionan igual en el
 * servidor (Workers) y en el navegador (para operaciones sin conexión).
 */

// Alfabeto Crockford sin I, L, O, U: se lee y se dicta sin confusiones.
const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function nuevoId(): string {
  return crypto.randomUUID();
}

export function codigoAleatorio(largo: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(largo));
  let s = "";
  // 256 es múltiplo de 32: el módulo no introduce sesgo.
  for (const b of bytes) s += ALFABETO[b % 32];
  return s;
}

/** Código público del ticket (va en el QR y en el enlace al cliente): 100 bits. */
export function codigoPublico(): string {
  return codigoAleatorio(20);
}

/** Código de la etiqueta de cada prenda: 60 bits, único en toda la base. */
export function codigoEtiqueta(): string {
  return codigoAleatorio(12);
}

export function esCodigoValido(codigo: string, largo: number): boolean {
  return codigo.length === largo && [...codigo].every((c) => ALFABETO.includes(c));
}

/** Normaliza lo que llega de un lector o de una URL escaneada. */
export function extraerCodigo(texto: string): string | null {
  const limpio = texto.trim();
  const deUrl = limpio.match(/\/(?:t|e)\/([0-9A-Za-z]{12,20})(?:[/?#]|$)/);
  const candidato = (deUrl?.[1] ?? limpio).toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (esCodigoValido(candidato, 20) || esCodigoValido(candidato, 12)) return candidato;
  return null;
}

export function aBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function deBase64Url(texto: string): Uint8Array {
  const b64 = texto
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(texto.length / 4) * 4, "=");
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** Token secreto de 256 bits (sesiones, dispositivos, recuperación). */
export function tokenSecreto(): string {
  return aBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export function aHex(bytes: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(texto: string | Uint8Array): Promise<string> {
  const datos = typeof texto === "string" ? new TextEncoder().encode(texto) : texto;
  return aHex(await crypto.subtle.digest("SHA-256", datos as BufferSource));
}

export async function hmacSha256(secreto: string, mensaje: string): Promise<Uint8Array> {
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(mensaje)));
}

/** Compara en tiempo constante (no revela cuántos caracteres coinciden). */
export function igualesSeguro(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let dif = ea.length ^ eb.length;
  const n = Math.max(ea.length, eb.length);
  for (let i = 0; i < n; i++) dif |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return dif === 0;
}
