import { describe, expect, it } from "vitest";
import { faltantesProduccion, validarEnv } from "@/env";

const base = { APP_SECRET: "x".repeat(32), APP_URL: "https://tintora.prueba/" };

describe("variables de entorno", () => {
  it("acepta lo mínimo y normaliza la URL sin barra final", () => {
    const r = validarEnv(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.datos.APP_URL).toBe("https://tintora.prueba");
      expect(r.datos.TWILIO_FROM).toBeUndefined();
    }
  });

  it("rechaza un secreto corto con mensaje claro", () => {
    const r = validarEnv({ ...base, APP_SECRET: "corto" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.join()).toContain("APP_SECRET");
  });

  it("rechaza una clave de respaldo que no mide 32 bytes", () => {
    const r = validarEnv({ ...base, BACKUP_KEY: Buffer.alloc(16).toString("base64") });
    expect(r.ok).toBe(false);
  });

  it("trata cadenas vacías como no configuradas", () => {
    const r = validarEnv({ ...base, TURNSTILE_SECRET_KEY: "  " });
    expect(r.ok && r.datos.TURNSTILE_SECRET_KEY).toBeFalsy();
  });

  it("lista lo que falta para producción", () => {
    const r = validarEnv({ ...base, APP_URL: "http://localhost:3000" });
    if (!r.ok) throw new Error("debió validar");
    expect(faltantesProduccion(r.datos)).toEqual([
      "RELOJ_SECRETO",
      "BACKUP_KEY",
      "APP_URL (debe empezar por https://)",
    ]);
    const completo = validarEnv({
      ...base,
      RELOJ_SECRETO: "r".repeat(20),
      BACKUP_KEY: Buffer.alloc(32).toString("base64"),
    });
    if (!completo.ok) throw new Error("debió validar");
    expect(faltantesProduccion(completo.datos)).toEqual([]);
  });
});
