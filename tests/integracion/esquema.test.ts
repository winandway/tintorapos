import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dividirSentencias } from "../../scripts/sql-utils.mjs";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";

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
    const sistema = new Set(["tintorerias", "limites", "sistema", "mensajes_contacto"]);
    for (const { name } of results) {
      if (sistema.has(name)) continue;
      const cols = await e.env.DB.prepare(`pragma table_info(${name})`).all<{ name: string }>();
      expect(
        cols.results.map((c) => c.name),
        `la tabla ${name} no tiene tintoreria_id`,
      ).toContain("tintoreria_id");
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
