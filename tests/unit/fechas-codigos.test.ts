import { describe, expect, it } from "vitest";
import {
  diaSemana,
  fechaLocal,
  fechaPromesa,
  instanteLocal,
  rangoDia,
  sumarDiasFecha,
  zonaValida,
} from "@/lib/fechas";
import {
  codigoEtiqueta,
  codigoPublico,
  deBase64Url,
  aBase64Url,
  esCodigoValido,
  extraerCodigo,
  hmacSha256,
  igualesSeguro,
  nuevoId,
  sha256Hex,
  tokenSecreto,
} from "@/lib/codigos";

const NY = "America/New_York";

describe("fechas de la tienda", () => {
  it("fecha local respeta la zona horaria", () => {
    expect(fechaLocal(Date.parse("2026-09-16T03:30:00Z"), NY)).toBe("2026-09-15");
    expect(fechaLocal(Date.parse("2026-09-16T03:30:00Z"), "UTC")).toBe("2026-09-16");
  });

  it("día de la semana para el color del ticket", () => {
    expect(diaSemana(Date.parse("2026-09-16T15:00:00Z"), NY)).toBe(3); // miércoles
    expect(diaSemana(Date.parse("2026-09-20T15:00:00Z"), NY)).toBe(0); // domingo
  });

  it("instante local con horario de verano e invierno", () => {
    expect(new Date(instanteLocal("2026-07-01", 17, 0, NY)).toISOString()).toBe("2026-07-01T21:00:00.000Z");
    expect(new Date(instanteLocal("2026-12-01", 17, 0, NY)).toISOString()).toBe("2026-12-01T22:00:00.000Z");
    const [ini, fin] = rangoDia("2026-11-01", NY); // día del cambio de hora: 25 horas
    expect(fin - ini).toBe(25 * 60 * 60 * 1000);
  });

  it("suma días de calendario", () => {
    expect(sumarDiasFecha("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("valida zonas", () => {
    expect(zonaValida(NY)).toBe(true);
    expect(zonaValida("Marte/Base")).toBe(false);
  });

  it("fecha promesa salta domingos y cae a las 5 p. m.", () => {
    // Viernes 18 sep 2026, 10 a. m. en NY + 2 días → sábado 19, (domingo no cuenta) lunes 21.
    const viernes = Date.parse("2026-09-18T14:00:00Z");
    const p = fechaPromesa(viernes, NY, 2, false);
    expect(fechaLocal(p, NY)).toBe("2026-09-21");
    expect(new Date(p).toISOString()).toBe("2026-09-21T21:00:00.000Z");
  });

  it("fecha promesa urgente: hoy si hay tiempo, si no mañana (nunca domingo)", () => {
    const manana = Date.parse("2026-09-16T13:00:00Z"); // 9 a. m. NY
    expect(fechaLocal(fechaPromesa(manana, NY, 2, true), NY)).toBe("2026-09-16");
    const tarde = Date.parse("2026-09-19T20:30:00Z"); // sábado 4:30 p. m. NY
    expect(fechaLocal(fechaPromesa(tarde, NY, 2, true), NY)).toBe("2026-09-21");
  });

  it("cero días cae hoy mismo a las 5 p. m. (salvo domingo)", () => {
    const domingo = Date.parse("2026-09-20T14:00:00Z");
    expect(fechaLocal(fechaPromesa(domingo, NY, 0, false), NY)).toBe("2026-09-21");
  });
});

describe("códigos seguros", () => {
  it("genera códigos con el largo y alfabeto correctos", () => {
    const p = codigoPublico();
    const e = codigoEtiqueta();
    expect(esCodigoValido(p, 20)).toBe(true);
    expect(esCodigoValido(e, 12)).toBe(true);
    expect(esCodigoValido("OOOOOOOOOOOO", 12)).toBe(false);
    expect(new Set(Array.from({ length: 500 }, codigoEtiqueta)).size).toBe(500);
    expect(nuevoId()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("extrae el código de lo que manda un lector o una URL", () => {
    const p = codigoPublico();
    const e = codigoEtiqueta();
    expect(extraerCodigo(`https://tintora.prueba/t/${p}`)).toBe(p);
    expect(extraerCodigo(`https://tintora.prueba/e/${e}?x=1`)).toBe(e);
    expect(extraerCodigo(` ${e.toLowerCase()}\n`)).toBe(e);
    expect(extraerCodigo("hola")).toBeNull();
  });

  it("tokens base64url de 256 bits que ida y vuelta coinciden", () => {
    const t = tokenSecreto();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(aBase64Url(deBase64Url(t))).toBe(t);
  });

  it("hash y hmac conocidos", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    const mac = await hmacSha256("key", "The quick brown fox jumps over the lazy dog");
    expect(Buffer.from(mac).toString("hex")).toBe(
      "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
    );
  });

  it("comparación en tiempo constante", () => {
    expect(igualesSeguro("abc", "abc")).toBe(true);
    expect(igualesSeguro("abc", "abd")).toBe(false);
    expect(igualesSeguro("abc", "abcd")).toBe(false);
  });
});
