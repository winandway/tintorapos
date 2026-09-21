import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dividirSentencias } from "../../scripts/sql-utils.mjs";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { TABLAS_DEMO } from "@/server/demo";
import { TABLAS_RESPALDO } from "@/server/respaldos";

describe("esquema de la base", () => {
  let e: EntornoPrueba;
  beforeAll(async () => {
    e = await crearEntorno();
  });
  afterAll(() => e.cerrar());

  it("es idempotente: aplicarlo dos veces no falla", async () => {
    for (const s of dividirSentencias(readFileSync("schema.sql", "utf8"))) await e.env.DB.prepare(s).run();
  });

  it("toda tabla de negocio lleva tintoreria_id (candado de aislamiento)", async () => {
    const { results } = await e.env.DB.prepare(
      "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '_cf_%'",
    ).all<{ name: string }>();
    // Tablas que NO son de una tintorería: la ficha de cada una, los contadores
    // de límites por IP, la memoria del sistema y el buzón del formulario
    // público (mensajes de gente que todavía no es cliente de nadie).
    const sistema = new Set([
      "tintorerias",
      "limites",
      "sistema",
      "mensajes_contacto",
      // Los billetes de soporte son de Windoce, no de una tintorería: los abre
      // gente que muchas veces todavía no es cliente de nadie. Su candado es
      // otro: solo entra quien esté en CORREOS_ADMIN (tests/integracion/admin.test.ts).
      "tickets",
      "ticket_mensajes",
    ]);
    for (const { name } of results) {
      if (sistema.has(name)) continue;
      const cols = await e.env.DB.prepare(`pragma table_info(${name})`).all<{ name: string }>();
      expect(
        cols.results.map((c) => c.name),
        `la tabla ${name} no tiene tintoreria_id`,
      ).toContain("tintoreria_id");
    }
  });

  /**
   * CANDADO DE TABLAS OLVIDADAS. `preferencias_tienda` nació sin entrar en los
   * respaldos ni en la limpieza del demo, y nadie se enteró: un demo que guardara
   * sus ajustes ya no se podía borrar (llave foránea) y un respaldo restaurado
   * perdía las preferencias. Toda tabla con `tintoreria_id` tiene que estar en
   * las dos listas, o en la lista corta de abajo con su porqué.
   */
  it("toda tabla de una tintorería se respalda y se borra con el demo", async () => {
    const { results } = await e.env.DB.prepare(
      "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '_cf_%'",
    ).all<{ name: string }>();
    const conTintoreria: string[] = [];
    for (const { name } of results) {
      const cols = await e.env.DB.prepare(`pragma table_info(${name})`).all<{ name: string }>();
      if (cols.results.some((c) => c.name === "tintoreria_id")) conTintoreria.push(name);
    }
    // No viajan en el respaldo: son pasajeras (sesiones, enlaces, códigos de un
    // solo uso, la cola de sincronización) o son el propio registro de respaldos.
    const sinRespaldo = new Set([
      "sesiones",
      "enlaces_dispositivo",
      "tokens_recuperacion",
      "verificacion_correo",
      "operaciones_sync",
      "respaldos",
    ]);
    // Los billetes son de Windoce: apuntan a la tienda sin llave foránea y tienen
    // que sobrevivirla (el historial de soporte no se borra con un demo).
    const deWindoce = new Set(["tickets"]);
    const respaldadas = new Set<string>(TABLAS_RESPALDO);
    const delDemo = new Set<string>(TABLAS_DEMO);
    for (const tabla of conTintoreria.filter((t) => !deWindoce.has(t))) {
      expect(delDemo.has(tabla), `la limpieza del demo olvida la tabla ${tabla}`).toBe(true);
      if (!sinRespaldo.has(tabla))
        expect(respaldadas.has(tabla), `el respaldo olvida la tabla ${tabla}`).toBe(true);
    }
  });

  it("la auditoría no se puede editar ni borrar (candado)", async () => {
    const ahora = Date.now();
    await e.env.DB.prepare(
      "insert into tintorerias (id, nombre, creada_en, actualizada_en) values ('t1', 'Prueba', ?, ?)",
    )
      .bind(ahora, ahora)
      .run();
    await e.env.DB.prepare(
      "insert into auditoria (id, tintoreria_id, accion, creado_en) values ('a1', 't1', 'prueba', ?)",
    )
      .bind(ahora)
      .run();
    await expect(
      e.env.DB.prepare("update auditoria set accion = 'otra' where id = 'a1'").run(),
    ).rejects.toThrow(/no se puede editar/);
    await expect(e.env.DB.prepare("delete from auditoria where id = 'a1'").run()).rejects.toThrow(
      /no se puede borrar/,
    );
  });

  it("solo puede haber un turno de caja abierto por sucursal", async () => {
    const ahora = Date.now();
    await e.env.DB.batch([
      e.env.DB.prepare(
        "insert into sucursales (id, tintoreria_id, nombre, creada_en) values ('s1','t1','P',?)",
      ).bind(ahora),
      e.env.DB.prepare(
        "insert into usuarios (id, tintoreria_id, nombre, rol, creado_en, actualizado_en) values ('u1','t1','D','dueno',?,?)",
      ).bind(ahora, ahora),
      e.env.DB.prepare(
        "insert into turnos_caja (id, tintoreria_id, sucursal_id, abierto_por, abierto_en, fondo_cents) values ('c1','t1','s1','u1',?,0)",
      ).bind(ahora),
    ]);
    await expect(
      e.env.DB.prepare(
        "insert into turnos_caja (id, tintoreria_id, sucursal_id, abierto_por, abierto_en, fondo_cents) values ('c2','t1','s1','u1',?,0)",
      )
        .bind(ahora)
        .run(),
    ).rejects.toThrow(/UNIQUE/);
  });
});
