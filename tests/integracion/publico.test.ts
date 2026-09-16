import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { codigoDeEtiqueta, ordenPublica } from "@/server/publico/orden";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { escenarioAislamiento, type Escenario } from "../ayuda/escenario";

describe("página pública de la orden (datos mínimos)", () => {
  let e: EntornoPrueba;
  let esc: Escenario;
  beforeAll(async () => {
    e = await crearEntorno();
    esc = await escenarioAislamiento(e);
    await e.env.DB.prepare(
      "update clientes set nombre = 'María José', telefono = '+13055550000' where id = ?",
    )
      .bind(esc.a.ids.clienteId)
      .run();
  });
  afterAll(() => e.cerrar());

  it("muestra solo estado, fechas y primer nombre; nunca teléfono ni importes", async () => {
    const o = await ordenPublica(e.env.DB, esc.a.ids.codigoPublico!.toLowerCase());
    expect(o).toMatchObject({
      numero: 1001,
      estado: "recibida",
      piezas: 1,
      listas: 0,
      tieneSaldo: true,
      primerNombre: "María",
    });
    const texto = JSON.stringify(o);
    expect(texto).not.toContain("3055550000");
    expect(texto).not.toMatch(/cents|total|pagado/i);
    expect(texto).not.toContain(esc.a.id);
  });

  it("códigos inválidos o inexistentes no devuelven nada", async () => {
    expect(await ordenPublica(e.env.DB, "corto")).toBeNull();
    expect(await ordenPublica(e.env.DB, "0".repeat(20))).toBeNull();
    expect(await codigoDeEtiqueta(e.env.DB, "xx")).toBeNull();
    expect(await codigoDeEtiqueta(e.env.DB, "0".repeat(12))).toBeNull();
  });

  it("la etiqueta de una prenda lleva al código público de su orden", async () => {
    const f = await e.env.DB.prepare("select codigo_etiqueta from orden_prendas where id = ?")
      .bind(esc.a.ids.prendaOrdenId)
      .first<{ codigo_etiqueta: string }>();
    expect(await codigoDeEtiqueta(e.env.DB, f!.codigo_etiqueta)).toBe(esc.a.ids.codigoPublico);
  });
});
