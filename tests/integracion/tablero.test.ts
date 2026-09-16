import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { datosTablero } from "@/server/tablero";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { escenarioAislamiento, type Escenario } from "../ayuda/escenario";

describe("tablero de inicio", () => {
  let e: EntornoPrueba;
  let esc: Escenario;
  beforeAll(async () => {
    e = await crearEntorno();
    esc = await escenarioAislamiento(e);
  });
  afterAll(() => e.cerrar());

  it("cifras de hoy y primeros pasos de la tintorería", async () => {
    const d = await datosTablero(e.env.DB, esc.a.id, "America/New_York");
    expect(d).toMatchObject({ cobradoHoyCents: 100, recibidasHoy: 1, porEntregar: 0, atrasadas: 0 });
    expect(d.pasos).toEqual({
      tienda: false,
      precios: true,
      empleados: true,
      dispositivo: true,
      orden: true,
    });
    await e.env.DB.prepare("update ordenes set fecha_promesa = 1, estado = 'recibida' where id = ?")
      .bind(esc.a.ids.ordenId)
      .run();
    await e.env.DB.prepare("update tintorerias set telefono = '+13055550100' where id = ?")
      .bind(esc.a.id)
      .run();
    const d2 = await datosTablero(e.env.DB, esc.a.id, "America/New_York");
    expect(d2.atrasadas).toBe(1);
    expect(d2.pasos.tienda).toBe(true);
  });
});
