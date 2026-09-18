import { createHmac, randomInt } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { es } from "../src/lib/i18n/diccionarios/es";

/** Código TOTP (RFC 6238, SHA-1, 6 dígitos, 30 s) a partir del secreto base32 que muestra la app. */
export function codigoTotp(secretoBase32: string, ahora = Date.now()): string {
  const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const limpio = secretoBase32.replace(/[\s=]/g, "").toUpperCase();
  let bits = "";
  for (const c of limpio) bits += alfabeto.indexOf(c).toString(2).padStart(5, "0");
  const clave = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(Math.floor(ahora / 1000 / 30)));
  const hmac = createHmac("sha1", clave).update(contador).digest();
  const desfase = hmac[hmac.length - 1]! & 0xf;
  const numero = (hmac.readUInt32BE(desfase) & 0x7fffffff) % 1_000_000;
  return String(numero).padStart(6, "0");
}

/** IP distinta por prueba: el límite de registros por IP no frena corridas repetidas en local. */
export function ipDePrueba(): string {
  return `10.${randomInt(1, 254)}.${randomInt(1, 254)}.${randomInt(1, 254)}`;
}

/**
 * example.com está reservado (RFC 2606): nunca le llega un correo a nadie. Con el
 * correo del dominio activo, una prueba en producción no puede escribirle a un tercero.
 */
export function correoDePrueba(): string {
  return `e2e-${Date.now()}-${randomInt(1000, 9999)}@example.com`;
}

/**
 * Espera a que React tome la página. Antes de eso los botones no responden: en el sitio
 * publicado (JavaScript por la red) un clic temprano se pierde, como le pasaría a una persona.
 */
export async function hidratada(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(() => Object.keys(document.body).some((k) => k.startsWith("__react")), null, {
    timeout: 60_000,
  });
}

/** Espera a que la página cargue sin el indicador de «Cargando…». */
export async function listo(page: Page) {
  await hidratada(page);
  await expect(page.getByText("Cargando…").first()).toBeHidden({ timeout: 60_000 });
}

/**
 * Nombres de los datos de prueba. Contra el sitio publicado (E2E_URL) son cuentas nuestras
 * y llevan «Soporte» (regla de la casa: el cliente distingue de un vistazo quién es quién).
 */
export const EN_PRODUCCION = Boolean(
  process.env.E2E_URL && !/localhost|127\.0\.0\.1/.test(process.env.E2E_URL),
);
export const NOMBRES = EN_PRODUCCION
  ? {
      negocio: "Soporte Tintora POS (verificación)",
      dueno: "Soporte Windoce",
      cajero: "Soporte Cajero",
      gerente: "Soporte Gerente",
      tablet: "Soporte tablet",
      celular: "Soporte celular de planta",
      cliente: "Soporte Cliente",
    }
  : {
      negocio: "Tintorería de prueba E2E",
      dueno: "Dueña de prueba",
      cajero: "Cajero E2E",
      gerente: "Gerente E2E",
      tablet: "Tablet E2E",
      celular: "Celular E2E",
      cliente: "Cliente E2E",
    };

/** Crea una tintorería nueva y activa los dos pasos del dueño. Deja la sesión abierta en /app. */
export async function crearCuenta(page: Page, negocio = NOMBRES.negocio) {
  const correo = correoDePrueba();
  await page.goto("/registro");
  await hidratada(page);
  await page.getByLabel(es.acceso.negocio).fill(negocio);
  await page.getByLabel(es.acceso.tuNombre).fill(NOMBRES.dueno);
  await page.getByLabel(es.acceso.correo).fill(correo);
  await page.getByLabel(es.acceso.clave, { exact: true }).fill(`Clave-segura-${Date.now()}`);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: es.acceso.crearCuenta }).click();
  await expect(page).toHaveURL(/\/entrar\/activar-dos-pasos/, { timeout: 60_000 });
  await hidratada(page);
  await page.getByRole("button", { name: es.acceso.empezar }).click();
  const secreto = (await page.getByTestId("secreto-totp").textContent()) ?? "";
  expect(secreto.replace(/\s/g, "")).toMatch(/^[A-Z2-7]{16,}$/);
  await page.getByLabel(es.acceso.codigo).fill(codigoTotp(secreto));
  await page.getByRole("button", { name: es.acceso.confirmarCodigo }).click();
  await expect(page.getByTestId("codigos-respaldo").locator("li")).toHaveCount(10);
  await page.getByRole("checkbox", { name: es.acceso.yaGuarde }).check();
  await page.getByRole("button", { name: es.acceso.irAlPanel }).click();
  await expect(page).toHaveURL(/\/app$/, { timeout: 60_000 });
  await hidratada(page);
  return { correo };
}
