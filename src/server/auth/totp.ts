/**
 * Verificación en dos pasos con códigos de 6 dígitos que cambian cada 30 s
 * (RFC 6238; compatible con Google Authenticator, Microsoft Authenticator, 1Password…).
 * Candado: tests/unit/auth-cripto.test.ts usa los vectores oficiales del RFC.
 */
import { codigoAleatorio, sha256Hex } from "@/lib/codigos";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const PASO_SEG = 30;

export function aBase32(bytes: Uint8Array): string {
  let bits = 0;
  let valor = 0;
  let salida = "";
  for (const b of bytes) {
    valor = ((valor << 8) | b) & 0xffff;
    bits += 8;
    while (bits >= 5) {
      salida += BASE32[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) salida += BASE32[(valor << (5 - bits)) & 31];
  return salida;
}

export function deBase32(texto: string): Uint8Array {
  const limpio = texto.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let valor = 0;
  const salida: number[] = [];
  for (const c of limpio) {
    const i = BASE32.indexOf(c);
    if (i < 0) throw new Error("Base32 inválido");
    valor = ((valor << 5) | i) & 0xffff;
    bits += 5;
    if (bits >= 8) {
      salida.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(salida);
}

export function nuevoSecretoTotp(): string {
  return aBase32(crypto.getRandomValues(new Uint8Array(20)));
}

export async function codigoTotp(
  secretoBase32: string,
  paso: number,
  algoritmo: "SHA-1" | "SHA-256" | "SHA-512" = "SHA-1",
  digitos = 6,
): Promise<string> {
  const clave = await crypto.subtle.importKey(
    "raw",
    deBase32(secretoBase32) as BufferSource,
    { name: "HMAC", hash: algoritmo },
    false,
    ["sign"],
  );
  const contador = new ArrayBuffer(8);
  const vista = new DataView(contador);
  vista.setUint32(0, Math.floor(paso / 2 ** 32));
  vista.setUint32(4, paso >>> 0);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", clave, contador));
  const d = (mac[mac.length - 1] ?? 0) & 0xf;
  const binario =
    (((mac[d] ?? 0) & 0x7f) << 24) | ((mac[d + 1] ?? 0) << 16) | ((mac[d + 2] ?? 0) << 8) | (mac[d + 3] ?? 0);
  return String(binario % 10 ** digitos).padStart(digitos, "0");
}

export function pasoActual(ahoraMs: number): number {
  return Math.floor(ahoraMs / 1000 / PASO_SEG);
}

/**
 * Verifica un código aceptando un paso de desfase del reloj (±30 s).
 * Devuelve el paso usado, que se guarda para impedir usar el mismo código dos veces.
 */
export async function verificarTotp(
  secretoBase32: string,
  codigo: string,
  ahoraMs: number,
  ultimoPasoUsado: number | null,
): Promise<number | null> {
  const limpio = codigo.replace(/\s/g, "");
  if (!/^\d{6}$/.test(limpio)) return null;
  const actual = pasoActual(ahoraMs);
  for (const paso of [actual, actual - 1, actual + 1]) {
    if (ultimoPasoUsado !== null && paso <= ultimoPasoUsado) continue;
    if ((await codigoTotp(secretoBase32, paso)) === limpio) return paso;
  }
  return null;
}

export function uriOtpauth(secreto: string, cuenta: string, emisor = "Tintora POS"): string {
  const etiqueta = encodeURIComponent(`${emisor}:${cuenta}`);
  return `otpauth://totp/${etiqueta}?secret=${secreto}&issuer=${encodeURIComponent(emisor)}&algorithm=SHA1&digits=6&period=30`;
}

/** 10 códigos de respaldo de un solo uso (formato XXXX-XXXX). */
export function nuevosCodigosRespaldo(): string[] {
  return Array.from({ length: 10 }, () => {
    const c = codigoAleatorio(8);
    return `${c.slice(0, 4)}-${c.slice(4)}`;
  });
}

export function normalizarRespaldo(codigo: string): string {
  return codigo.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export async function hashRespaldo(codigo: string): Promise<string> {
  return sha256Hex(`respaldo:${normalizarRespaldo(codigo)}`);
}
