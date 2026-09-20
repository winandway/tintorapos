import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { POST as abrirDemo } from "@/app/datos/demo/route";
import { GET as sesionActual } from "@/app/datos/sesion/route";
import { POST as crearOrden } from "@/app/datos/ordenes/route";
import { encolarAvisos } from "@/server/avisos";
import { HORAS_DEMO, limpiarDemos, PLAN_DEMO } from "@/server/demo";
import { correrReloj } from "@/server/reloj";
import { variablesDe } from "@/server/entorno";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";

/**
 * CANDADO DEL DEMO: cualquiera lo abre sin registrarse, así que tiene que traer
 * datos de verdad, poder trabajarse, NO mandar un solo correo, y desaparecer
 * solo a las 24 horas.
 */
describe("demo público", () => {
  let e: EntornoPrueba;

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
  }, 120_000);
  afterAll(() => e.cerrar());

  const idDemo = async (): Promise<string> => {
    const f = await e.env.DB.prepare(
      "select id from tintorerias where plan = ? order by creada_en desc limit 1",
    )
      .bind(PLAN_DEMO)
      .first<{ id: string }>();
    return f!.id;
  };

  it("se abre sin registrarse, con un día de trabajo cargado y se puede trabajar", async () => {
    const n = new Navegador();
    const r = await n.llamar(abrirDemo, { metodo: "POST" });
    expect(r.estado).toBe(200);
    expect(r.datos).toEqual({ ok: true, siguiente: "app" });
    expect(n.cookies.get("tp_sesion")).toBeTruthy();

    // Entra derecho: ni segundo paso ni cambiar la clave.
    expect((await n.llamar(sesionActual)).datos).toMatchObject({ sesion: { siguiente: "app" } });

    const id = await idDemo();
    const conteos = await e.env.DB.prepare(
      `select (select count(*) from clientes where tintoreria_id = ?1) as clientes,
              (select count(*) from ordenes where tintoreria_id = ?1) as ordenes,
              (select count(*) from orden_prendas where tintoreria_id = ?1) as prendas,
              (select count(*) from pagos where tintoreria_id = ?1) as pagos,
              (select count(*) from precios where tintoreria_id = ?1) as precios,
              (select count(*) from turnos_caja where tintoreria_id = ?1 and estado = 'abierto') as caja,
              (select count(*) from gastos where tintoreria_id = ?1) as gastos,
              (select count(*) from insumos where tintoreria_id = ?1) as insumos,
              (select count(*) from compras where tintoreria_id = ?1) as compras`,
    )
      .bind(id)
      .first<Record<string, number>>();
    expect(conteos).toMatchObject({ clientes: 5, ordenes: 8, caja: 1, insumos: 6, compras: 1 });
    expect(conteos!.gastos).toBe(7);
    expect(conteos!.prendas).toBeGreaterThan(10);
    expect(conteos!.pagos).toBeGreaterThan(0);
    expect(conteos!.precios).toBeGreaterThan(0);

    // Y puede trabajar: levanta una orden como cualquier tintorería.
    const cliente = await e.env.DB.prepare("select id from clientes where tintoreria_id = ? limit 1")
      .bind(id)
      .first<{ id: string }>();
    const prenda = await e.env.DB.prepare(
      "select p.id as prenda, s.id as servicio, pr.precio_cents from catalogo_prendas p join catalogo_servicios s on s.tintoreria_id = p.tintoreria_id join precios pr on pr.tintoreria_id = p.tintoreria_id and pr.prenda_id = p.id and pr.servicio_id = s.id where p.tintoreria_id = ? limit 1",
    )
      .bind(id)
      .first<{ prenda: string; servicio: string; precio_cents: number }>();
    const nueva = await n.llamar(crearOrden, {
      cuerpo: {
        id: crypto.randomUUID(),
        cliente: { id: cliente!.id },
        prendas: [
          {
            id: crypto.randomUUID(),
            prendaId: prenda!.prenda,
            servicioId: prenda!.servicio,
            cantidad: 1,
            precioUnitCents: prenda!.precio_cents,
          },
        ],
      },
    });
    expect(nueva.estado).toBe(200);
  });

  it("no le manda un correo ni un SMS a nadie (candado del demo)", async () => {
    const id = await idDemo();
    const orden = await e.env.DB.prepare("select id from ordenes where tintoreria_id = ? limit 1")
      .bind(id)
      .first<{ id: string }>();
    // Aunque el cliente del demo tuviera correo y lo aceptara, no se encola nada.
    await e.env.DB.prepare(
      "update clientes set correo = 'alguien@ejemplo.com', acepta_correo = 1 where tintoreria_id = ?",
    )
      .bind(id)
      .run();
    const ids = await encolarAvisos(e.env.DB, "https://tintora.prueba", {
      tintoreriaId: id,
      ordenId: orden!.id,
      tipo: "lista",
    });
    expect(ids).toEqual([]);
    const cola = await e.env.DB.prepare("select count(*) as n from avisos where tintoreria_id = ?")
      .bind(id)
      .first<{ n: number }>();
    expect(cola!.n).toBe(0);
  });

  it("el reloj lo borra entero cuando se le acaban las horas", async () => {
    const id = await idDemo();
    const ahora = Date.now();
    // Todavía no le toca.
    expect(await limpiarDemos(e.env, ahora)).toBe(0);

    await e.env.DB.prepare("update tintorerias set creada_en = ? where id = ?")
      .bind(ahora - (HORAS_DEMO + 1) * 3600_000, id)
      .run();
    const r = await correrReloj(e.env, variablesDe(e.env), ahora);
    expect(r.demosBorrados).toBe(1);

    const resto = await e.env.DB.prepare(
      `select (select count(*) from tintorerias where id = ?1) as t,
              (select count(*) from ordenes where tintoreria_id = ?1) as o,
              (select count(*) from orden_prendas where tintoreria_id = ?1) as p,
              (select count(*) from pagos where tintoreria_id = ?1) as pagos,
              (select count(*) from clientes where tintoreria_id = ?1) as c,
              (select count(*) from usuarios where tintoreria_id = ?1) as u,
              (select count(*) from sesiones where tintoreria_id = ?1) as s,
              (select count(*) from auditoria where tintoreria_id = ?1) as a,
              (select count(*) from gastos where tintoreria_id = ?1) as g,
              (select count(*) from compras where tintoreria_id = ?1) as co,
              (select count(*) from compra_lineas where tintoreria_id = ?1) as cl,
              (select count(*) from insumos where tintoreria_id = ?1) as i,
              (select count(*) from proveedores where tintoreria_id = ?1) as pr`,
    )
      .bind(id)
      .first<Record<string, number>>();
    expect(resto).toEqual({
      t: 0,
      o: 0,
      p: 0,
      pagos: 0,
      c: 0,
      u: 0,
      s: 0,
      a: 0,
      g: 0,
      co: 0,
      cl: 0,
      i: 0,
      pr: 0,
    });
  });
});
