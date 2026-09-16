/**
 * Contraseñas y PIN con PBKDF2-SHA256.
 * 100 000 iteraciones es el MÁXIMO que acepta el motor de Workers (más, falla).
 * Formato versionado «pbkdf2-sha256$iter$sal$hash» para poder subir parámetros:
 * si cambian, `necesitaRehash` avisa y se recalcula al entrar.
 */
import { aBase64Url, deBase64Url, igualesSeguro } from "@/lib/codigos";

export const ITERACIONES = 100_000;
const PREFIJO = "pbkdf2-sha256";

async function derivar(secreto: string, sal: Uint8Array, iteraciones: number): Promise<Uint8Array> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: sal as BufferSource, iterations: iteraciones },
    base,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashClave(clave: string): Promise<string> {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivar(clave, sal, ITERACIONES);
  return `${PREFIJO}$${ITERACIONES}$${aBase64Url(sal)}$${aBase64Url(hash)}`;
}

/**
 * Verifica una contraseña o PIN. Si no hay hash guardado (usuario inexistente),
 * igual hace el cálculo completo para que la respuesta tarde lo mismo y no
 * revele qué correos existen.
 */
export async function verificarClave(clave: string, guardado: string | null | undefined): Promise<boolean> {
  if (!guardado) {
    await derivar(clave, new Uint8Array(16), ITERACIONES);
    return false;
  }
  const partes = guardado.split("$");
  if (partes.length !== 4 || partes[0] !== PREFIJO) {
    await derivar(clave, new Uint8Array(16), ITERACIONES);
    return false;
  }
  const iter = Number(partes[1]);
  if (!Number.isInteger(iter) || iter < 1 || iter > ITERACIONES) return false;
  const calculado = await derivar(clave, deBase64Url(partes[2] ?? ""), iter);
  return igualesSeguro(aBase64Url(calculado), partes[3] ?? "");
}

export function necesitaRehash(guardado: string): boolean {
  const [pre, iter] = guardado.split("$");
  return pre !== PREFIJO || Number(iter) !== ITERACIONES;
}

export type ProblemaClave = "corta" | "simple" | "igual_correo";

/** Reglas de contraseña: 10+ caracteres, con letras y números, sin ser trivial. */
export function claveAceptable(clave: string, correo?: string): ProblemaClave | null {
  if (clave.length < 10) return "corta";
  if (!/\p{L}/u.test(clave) || !/\d/.test(clave)) return "simple";
  if (/^(.)\1+$/.test(clave) || /^(password|contrasena|contraseña)\d*$/i.test(clave)) return "simple";
  const usuario = correo?.split("@")[0]?.toLowerCase();
  if (usuario && usuario.length >= 3 && clave.toLowerCase().includes(usuario)) return "igual_correo";
  return null;
}

/** PIN de 4 a 6 dígitos, no trivial (1111, 1234, 9876…). */
export function pinAceptable(pin: string): boolean {
  if (!/^\d{4,6}$/.test(pin)) return false;
  if (/^(\d)\1+$/.test(pin)) return false;
  return !"01234567890".includes(pin) && !"09876543210".includes(pin);
}
