import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { GET as cajaEstado } from "@/app/datos/caja/estado/route";
import { GET as caja } from "@/app/datos/caja/route";
import { POST as diagnostico } from "@/app/datos/diagnostico/route";
import { FALLOS_PARA_ALARMA, leerFallosCliente } from "@/server/diagnostico";
import { revisarSalud } from "@/server/salud";
import { variablesDe } from "@/server/entorno";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { escenarioAislamiento, type Escenario } from "../ayuda/escenario";
import { crearUsuario, sesionPara } from "../ayuda/fabrica";

/**
 * CANDADO B44 (22 sep 2026): «damos salida y procesamos y no pasa nada».
 * Dos piezas del servidor: el parte de fallos que mandan los teléfonos (para
 * ver desde afuera qué falla) y el estado de la caja para quien cobra sin
 * permiso de abrirla (antes veía «caja cerrada» aunque estuviera abierta).
 */
describe("diagnóstico remoto y estado de la caja", () => {
  let e: EntornoPrueba;
  let esc: Escenario;

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioAislamiento(e);
  });
  afterAll(() => e.cerrar());

  it("un teléfono reporta un fallo sin sesión; se guarda limpio y lo enseña el canario", async () => {
    const anonimo = new Navegador();
    const r = await anonimo.llamar(diagnostico, {
      cuerpo: {
        ruta: "/datos/ordenes/55349305-eeaa-4462-90ac-5c14ad5439e6/entregar<script>",
        metodo: "POST",
        estado: 0,
        codigo: "TypeError: Load failed",
        equipo: "Safari en iOS (app instalada)",
        enLinea: true,
      },
    });
    expect(r.estado).toBe(200);
    const [guardado] = await leerFallosCliente(e.env.DB);
    expect(guardado).toMatchObject({
      metodo: "POST",
      estado: 0,
      codigo: "TypeError: Load failed",
      equipo: "Safari en iOS (app instalada)",
    });
    // El id no viaja y lo que no sea texto plano se cae.
    expect(guardado!.ruta).toMatch(/^\/datos\/ordenes\/\(id\)\/entregar/);
    expect(guardado!.ruta).not.toContain("<");

    // Uno solo es información; a partir de FALLOS_PARA_ALARMA el canario se pone en rojo.
    let s = await revisarSalud(e.env, variablesDe(e.env));
    expect(s.piezas.clientes).toMatchObject({ estado: "ok" });
    expect(s.piezas.clientes!.detalle).toMatch(/POST \/datos\/ordenes\/\(id\)\/entregar\S* → sin respuesta/);
    for (let i = 1; i < FALLOS_PARA_ALARMA; i++)
      await anonimo.llamar(diagnostico, {
        cuerpo: {
          ruta: "/datos/sync",
          metodo: "POST",
          estado: 500,
          codigo: "inesperado",
          equipo: "Chrome en Android",
        },
      });
    s = await revisarSalud(e.env, variablesDe(e.env));
    expect(s.piezas.clientes!.estado).toBe("error");
    expect(s.piezas.clientes!.detalle).toContain(`${FALLOS_PARA_ALARMA} en 24 h`);
  });

  it("un parte malformado o gigante se rechaza, y hay tope por IP", async () => {
    const anonimo = new Navegador();
    expect(
      (
        await anonimo.llamar(diagnostico, {
          cuerpo: { ruta: "x".repeat(500), metodo: "POST", estado: 0, codigo: "", equipo: "" },
        })
      ).estado,
    ).toBe(400);
    expect(
      (
        await anonimo.llamar(diagnostico, {
          cuerpo: { ruta: "/x", metodo: "HACK", estado: 0, codigo: "", equipo: "" },
        })
      ).estado,
    ).toBe(400);
    let ultimo = 200;
    for (let i = 0; i < 32; i++)
      ultimo = (
        await anonimo.llamar(diagnostico, {
          cuerpo: { ruta: "/datos/x", metodo: "GET", estado: 0, codigo: "", equipo: "" },
        })
      ).estado;
    expect(ultimo).toBe(429);
  });

  it("quien cobra sin poder abrir caja sabe si está abierta; antes le respondían 403", async () => {
    const repartidorId = await crearUsuario(e.env.DB, esc.a.id, "repartidor", {
      pin: "7410",
      nombre: "Reparto A",
    });
    const repartidor = new Navegador();
    repartidor.cookies.set("tp_sesion", await sesionPara(e.env.DB, esc.a.id, repartidorId));
    // La ruta vieja le cierra la puerta…
    expect((await repartidor.llamar(caja)).estado).toBe(403);
    // …y la nueva le dice la verdad: hay caja abierta (el escenario la abre) y él no puede abrirla.
    const r = await repartidor.llamar<{ abierta: boolean; puedeAbrir: boolean }>(cajaEstado);
    expect(r.estado).toBe(200);
    expect(r.datos).toEqual({ abierta: true, puedeAbrir: false });

    // El dueño sí puede abrirla.
    const dueno = new Navegador();
    dueno.cookies.set("tp_sesion", esc.a.sesionDueno);
    expect((await dueno.llamar<{ puedeAbrir: boolean }>(cajaEstado)).datos.puedeAbrir).toBe(true);
  });
});
