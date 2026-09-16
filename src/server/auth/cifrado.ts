/**
 * Cifrado simétrico AES-256-GCM.
 * - Secretos guardados en la base (dos pasos): clave derivada de APP_SECRET con
 *   HKDF y un «propósito», para no reutilizar la misma clave en dos usos.
 *   OJO: rotar APP_SECRET invalida estos secretos (el dueño usa sus códigos de respaldo).
 * - Respaldos: clave cruda de 32 bytes (BACKUP_KEY), independiente de APP_SECRET.
 */
import { aBase64Url, deBase64Url } from "@/lib/codigos";

async function claveDerivada(secreto: string, proposito: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("tintora-pos"),
      info: new TextEncoder().encode(proposito),
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function cifrarTexto(secreto: string, proposito: string, texto: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const clave = await claveDerivada(secreto, proposito);
  const datos = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, clave, new TextEncoder().encode(texto));
  return `v1.${aBase64Url(iv)}.${aBase64Url(new Uint8Array(datos))}`;
}

export async function descifrarTexto(
  secreto: string,
  proposito: string,
  sobre: string,
): Promise<string | null> {
  const [v, iv, datos] = sobre.split(".");
  if (v !== "v1" || !iv || !datos) return null;
  try {
    const clave = await claveDerivada(secreto, proposito);
    const plano = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: deBase64Url(iv) as BufferSource },
      clave,
      deBase64Url(datos) as BufferSource,
    );
    return new TextDecoder().decode(plano);
  } catch {
    return null;
  }
}

function claveCruda(claveB64: string): Uint8Array {
  return Uint8Array.from(atob(claveB64), (c) => c.charCodeAt(0));
}

export async function cifrarBytes(claveB64: string, datos: Uint8Array): Promise<Uint8Array> {
  const clave = await crypto.subtle.importKey("raw", claveCruda(claveB64) as BufferSource, "AES-GCM", false, [
    "encrypt",
  ]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cifrado = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, clave, datos as BufferSource),
  );
  const salida = new Uint8Array(12 + cifrado.length);
  salida.set(iv, 0);
  salida.set(cifrado, 12);
  return salida;
}

export async function descifrarBytes(claveB64: string, datos: Uint8Array): Promise<Uint8Array> {
  const clave = await crypto.subtle.importKey("raw", claveCruda(claveB64) as BufferSource, "AES-GCM", false, [
    "decrypt",
  ]);
  const plano = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: datos.slice(0, 12) as BufferSource },
    clave,
    datos.slice(12) as BufferSource,
  );
  return new Uint8Array(plano);
}
