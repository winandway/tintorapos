import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";

describe("arnés de pruebas: D1 y R2 locales", () => {
  let e: EntornoPrueba;
  beforeAll(async () => {
    e = await crearEntorno();
  });
  afterAll(() => e.cerrar());

  it("la base responde", async () => {
    const fila = await e.env.DB.prepare("select 1 as uno").first<{ uno: number }>();
    expect(fila?.uno).toBe(1);
  });

  it("el almacén guarda y lee", async () => {
    await e.env.BUCKET.put("a.txt", "hola");
    expect(await (await e.env.BUCKET.get("a.txt"))?.text()).toBe("hola");
  });

  it("un servicio externo no simulado NO sale a internet", async () => {
    const r = await fetch("https://example.com/");
    // MSW corta la petición: nunca llega al servicio real.
    expect(r.status).toBe(500);
    expect(r.statusText).toBe("Unhandled Exception");
  });
});
