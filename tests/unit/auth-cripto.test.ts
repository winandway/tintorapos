import { describe, expect, it } from "vitest";
import {
  claveAceptable,
  hashClave,
  necesitaRehash,
  pinAceptable,
  verificarClave,
} from "@/server/auth/claves";
import { cifrarBytes, cifrarTexto, descifrarBytes, descifrarTexto } from "@/server/auth/cifrado";
import {
  aBase32,
  codigoTotp,
  deBase32,
  hashRespaldo,
  normalizarRespaldo,
  nuevoSecretoTotp,
  nuevosCodigosRespaldo,
  pasoActual,
  uriOtpauth,
  verificarTotp,
} from "@/server/auth/totp";

describe("contraseñas (candado de sesiones)", () => {
  it("hashea con sal distinta y verifica", async () => {
    const a = await hashClave("Lavanderia2026");
    const b = await hashClave("Lavanderia2026");
    expect(a).not.toBe(b);
    expect(a.startsWith("pbkdf2-sha256$100000$")).toBe(true);
    expect(await verificarClave("Lavanderia2026", a)).toBe(true);
    expect(await verificarClave("lavanderia2026", a)).toBe(false);
    expect(necesitaRehash(a)).toBe(false);
    expect(necesitaRehash("pbkdf2-sha256$50000$x$y")).toBe(true);
  });

  it("un usuario inexistente o un hash roto nunca verifica", async () => {
    expect(await verificarClave("loquesea123", null)).toBe(false);
    expect(await verificarClave("loquesea123", "md5$abc")).toBe(false);
    expect(await verificarClave("loquesea123", "pbkdf2-sha256$999999999$AAAA$AAAA")).toBe(false);
  });

  it("reglas de contraseña y de PIN", () => {
    expect(claveAceptable("corta1")).toBe("corta");
    expect(claveAceptable("soloLetrasLargas")).toBe("simple");
    expect(claveAceptable("1234567890")).toBe("simple");
    expect(claveAceptable("password12345")).toBe("simple");
    expect(claveAceptable("maria2026xyz", "maria@correo.com")).toBe("igual_correo");
    expect(claveAceptable("Perchas2026!", "maria@correo.com")).toBeNull();
    expect(pinAceptable("4829")).toBe(true);
    expect(pinAceptable("482913")).toBe(true);
    expect(pinAceptable("1111")).toBe(false);
    expect(pinAceptable("1234")).toBe(false);
    expect(pinAceptable("9876")).toBe(false);
    expect(pinAceptable("12a4")).toBe(false);
    expect(pinAceptable("123")).toBe(false);
  });
});

describe("cifrado", () => {
  const secreto = "s".repeat(40);
  it("cifra y descifra texto; con otro propósito o secreto no abre", async () => {
    const sobre = await cifrarTexto(secreto, "totp", "JBSWY3DPEHPK3PXP");
    expect(sobre.startsWith("v1.")).toBe(true);
    expect(await descifrarTexto(secreto, "totp", sobre)).toBe("JBSWY3DPEHPK3PXP");
    expect(await descifrarTexto(secreto, "otro", sobre)).toBeNull();
    expect(await descifrarTexto("x".repeat(40), "totp", sobre)).toBeNull();
    expect(await descifrarTexto(secreto, "totp", "v2.a.b")).toBeNull();
  });

  it("cifra bytes con la clave de respaldos", async () => {
    const clave = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64");
    const datos = new TextEncoder().encode("respaldo de prueba");
    const c = await cifrarBytes(clave, datos);
    expect(new TextDecoder().decode(await descifrarBytes(clave, c))).toBe("respaldo de prueba");
    const otra = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64");
    await expect(descifrarBytes(otra, c)).rejects.toThrow();
  });
});

describe("dos pasos TOTP (RFC 6238)", () => {
  // Vectores oficiales del RFC 6238, anexo B (8 dígitos, SHA-1, secreto «12345678901234567890»).
  const secreto = aBase32(new TextEncoder().encode("12345678901234567890"));
  it.each([
    [59, "94287082"],
    [1111111109, "07081804"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
  ])("t=%i da %s", async (t, esperado) => {
    expect(await codigoTotp(secreto, Math.floor(t / 30), "SHA-1", 8)).toBe(esperado);
  });

  it("base32 ida y vuelta", () => {
    const s = nuevoSecretoTotp();
    expect(s).toMatch(/^[A-Z2-7]{32}$/);
    expect(aBase32(deBase32(s))).toBe(s);
    expect(() => deBase32("1!")).toThrow();
  });

  it("acepta ±1 paso y rechaza reutilizar el mismo código", async () => {
    const s = nuevoSecretoTotp();
    const ahora = Date.parse("2026-09-16T12:00:10Z");
    const paso = pasoActual(ahora);
    const codigo = await codigoTotp(s, paso);
    expect(await verificarTotp(s, codigo, ahora, null)).toBe(paso);
    expect(await verificarTotp(s, codigo, ahora, paso)).toBeNull();
    const anterior = await codigoTotp(s, paso - 1);
    expect(await verificarTotp(s, anterior, ahora, null)).toBe(paso - 1);
    const viejo = await codigoTotp(s, paso - 3);
    expect(await verificarTotp(s, viejo, ahora, null)).toBeNull();
    expect(await verificarTotp(s, "12ab56", ahora, null)).toBeNull();
  });

  it("URI para la app autenticadora y códigos de respaldo", async () => {
    expect(uriOtpauth("ABC", "dueno@tienda.com")).toBe(
      "otpauth://totp/Tintora%20POS%3Adueno%40tienda.com?secret=ABC&issuer=Tintora%20POS&algorithm=SHA1&digits=6&period=30",
    );
    const codigos = nuevosCodigosRespaldo();
    expect(codigos).toHaveLength(10);
    expect(codigos[0]).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect(normalizarRespaldo("ab12-cd34")).toBe("AB12CD34");
    expect(await hashRespaldo("ab12-cd34")).toBe(await hashRespaldo("AB12CD34"));
  });
});
