import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { POST as reloj } from "@/app/datos/reloj/route";
import { GET as exportar } from "@/app/datos/exportar/route";
import { GET as respaldos } from "@/app/datos/respaldos/route";
import { variablesDe } from "@/server/entorno";
import {
  aCsv,
  crearRespaldo,
  leerRespaldo,
  restaurarEnBase,
  tintoreriasPorRespaldar,
  volcarTintoreria,
} from "@/server/respaldos";
import { leerSistema } from "@/server/sistema";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { escenarioAislamiento, huellaTintoreria, type Escenario } from "../ayuda/escenario";
import { sesionPara } from "../ayuda/fabrica";

describe("reloj, respaldos cifrados y exportación (candado de respaldo)", () => {
  let e: EntornoPrueba;
  let esc: Escenario;

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioAislamiento(e);
  });
  afterAll(() => e.cerrar());

  it("respaldo → cifrado en el almacén → descifrar → restaurar en una base limpia da los mismos datos", async () => {
    const vars = variablesDe(e.env);
    const info = await crearRespaldo(e.env, vars, esc.a.id);
    expect(info.clave.startsWith(`respaldos/${esc.a.id}/`)).toBe(true);
    expect(info.clave.split("/")[2]).toMatch(/^\d{4}-\d{2}-\d{2}-/);
    const crudo = new Uint8Array(await (await e.env.BUCKET.get(info.clave))!.arrayBuffer());
    // En el almacén no se lee nada en claro.
    expect(new TextDecoder().decode(crudo)).not.toContain("marca-unica-aaaa");

    const volcado = await leerRespaldo(e.env, vars, info.clave);
    expect(volcado.tablas.ordenes).toHaveLength(1);
    expect(JSON.stringify(volcado)).not.toContain("marca-unica-bbbb");

    const limpio = await crearEntorno();
    try {
      const filas = await restaurarEnBase(limpio.env.DB, volcado);
      expect(filas).toBe(info.filas);
      // La tabla de respaldos no viaja dentro del propio respaldo.
      expect(await huellaTintoreria(limpio.env.DB, esc.a.id, ["respaldos"])).toBe(
        await huellaTintoreria(e.env.DB, esc.a.id, ["respaldos"]),
      );
    } finally {
      await limpio.cerrar();
    }
  });

  it("con otra clave o un archivo alterado no se puede leer", async () => {
    const vars = variablesDe(e.env);
    const info = await crearRespaldo(e.env, vars, esc.b.id);
    const otra = { ...vars, BACKUP_KEY: Buffer.alloc(32, 9).toString("base64") };
    await expect(leerRespaldo(e.env, otra, info.clave)).rejects.toThrow();
    const obj = await e.env.BUCKET.get(info.clave);
    const bytes = new Uint8Array(await obj!.arrayBuffer());
    bytes[bytes.length - 1] = (bytes[bytes.length - 1] ?? 0) ^ 1;
    await e.env.BUCKET.put(info.clave, bytes, { customMetadata: obj!.customMetadata });
    await expect(leerRespaldo(e.env, vars, info.clave)).rejects.toThrow();
    await expect(leerRespaldo(e.env, vars, "respaldos/no-existe")).rejects.toThrow();
    await expect(crearRespaldo(e.env, { ...vars, BACKUP_KEY: undefined }, esc.a.id)).rejects.toThrow();
  });

  it("el reloj exige su secreto y deja constancia de su corrida", async () => {
    const n = new Navegador();
    expect((await n.llamar(reloj, { metodo: "POST", sinCsrf: true })).estado).toBe(401);
    expect(
      (await n.llamar(reloj, { metodo: "POST", sinCsrf: true, cabeceras: { authorization: "Bearer otro" } }))
        .estado,
    ).toBe(401);
    const r = await n.llamar<{ respaldos: { hechos: number }; duracionMs: number }>(reloj, {
      metodo: "POST",
      sinCsrf: true,
      cabeceras: { authorization: `Bearer ${e.env.RELOJ_SECRETO}` },
    });
    expect(r.estado).toBe(200);
    expect(r.datos.respaldos.hechos).toBe(0); // A y B ya tienen respaldo de hoy
    const corrida = await leerSistema(e.env.DB, "reloj_ultima_corrida");
    expect(corrida).not.toBeNull();
    expect(await tintoreriasPorRespaldar(e.env.DB, Date.now() + 25 * 3600_000)).toHaveLength(2);
    const manana = await n.llamar<{ respaldos: { hechos: number } }>(reloj, {
      metodo: "POST",
      sinCsrf: true,
      cabeceras: { authorization: `Bearer ${e.env.RELOJ_SECRETO}` },
    });
    expect(manana.estado).toBe(200);
  });

  it("exportar: JSON sin secretos y CSV a salvo de fórmulas; solo el dueño", async () => {
    await e.env.DB.prepare(
      "update clientes set nombre = '=HYPERLINK(\"x\")', notas = 'coma, y \"comillas\"' where id = ?",
    )
      .bind(esc.a.ids.clienteId)
      .run();
    const dueno = new Navegador();
    dueno.cookies.set("tp_sesion", esc.a.sesionDueno);
    const json = await dueno.llamar<string>(exportar, { ruta: "/datos/exportar?formato=json" });
    expect(json.respuesta.headers.get("content-disposition")).toContain("attachment");
    const texto = JSON.stringify(json.datos);
    expect(texto).toContain("marca-unica-aaaa");
    for (const secreto of ["clave_hash", "pin_hash", "totp_secreto", "token_hash", "codigos_respaldo"])
      expect(texto).not.toContain(secreto);

    const csv = await dueno.llamar<string>(exportar, { ruta: "/datos/exportar?formato=csv&tabla=clientes" });
    expect(csv.respuesta.headers.get("content-type")).toContain("text/csv");
    expect(String(csv.datos)).toContain(`"'=HYPERLINK(""x"")"`);
    expect(String(csv.datos)).toContain(`"coma, y ""comillas"""`);
    expect(
      (await dueno.llamar(exportar, { ruta: "/datos/exportar?formato=csv&tabla=usuarios" })).estado,
    ).toBe(400);
    expect((await dueno.llamar<{ respaldos: unknown[] }>(respaldos)).datos.respaldos.length).toBeGreaterThan(
      0,
    );

    const cajero = new Navegador();
    cajero.cookies.set(
      "tp_sesion",
      await sesionPara(e.env.DB, esc.a.id, esc.a.ids.empleadoId!, {
        tipo: "pin",
        dispositivoId: esc.a.dispositivoId,
      }),
    );
    expect((await cajero.llamar(exportar)).estado).toBe(403);
    expect(aCsv([{ a: null, b: "+1" }], ["a", "b"])).toBe("a,b\r\n,'+1\r\n");
  });

  it("volcado pagina tablas grandes sin perder filas", async () => {
    const ahora = Date.now();
    const lote = Array.from({ length: 1203 }, (_, i) =>
      e.env.DB.prepare(
        "insert into auditoria (id, tintoreria_id, accion, creado_en) values (?, ?, 'prueba.carga', ?)",
      ).bind(`aud-${i}`, esc.b.id, ahora),
    );
    for (let i = 0; i < lote.length; i += 100) await e.env.DB.batch(lote.slice(i, i + 100));
    const v = await volcarTintoreria(e.env.DB, esc.b.id);
    expect(v.tablas.auditoria!.filter((f) => f.accion === "prueba.carga")).toHaveLength(1203);
  });
});
