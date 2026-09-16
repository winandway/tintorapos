import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { GET as salud } from "@/app/datos/salud/route";
import { variablesDe } from "@/server/entorno";
import { correrReloj } from "@/server/reloj";
import { revisarSalud, type Salud } from "@/server/salud";
import { guardarSistema } from "@/server/sistema";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { crearTintoreria } from "../ayuda/fabrica";

describe("canario /datos/salud (candado de piezas)", () => {
  let e: EntornoPrueba;
  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
  });
  afterAll(() => e.cerrar());

  it("sin reloj ni respaldos: en rojo con el motivo; lo opcional queda como «no configurado»", async () => {
    const r = await new Navegador().llamar<Salud>(salud);
    expect(r.estado).toBe(503);
    expect(r.datos.piezas).toMatchObject({
      base: { estado: "ok" },
      almacen: { estado: "ok" },
      variables: { estado: "ok" },
      correo: { estado: "no_configurado" },
      sms: { estado: "no_configurado" },
      turnstile: { estado: "no_configurado" },
      reloj: { estado: "error" },
      respaldos: { estado: "ok" },
    });
    expect(JSON.stringify(r.datos).includes(String(e.env.APP_SECRET))).toBe(false);
  });

  it("en público no dice POR QUÉ falla (no delata configuración); con el secreto del reloj sí (comprobado en rojo)", async () => {
    const publica = await new Navegador().llamar<Salud>(salud);
    expect(JSON.stringify(publica.datos)).not.toContain("detalle");
    const conSecreto = await new Navegador().llamar<Salud>(salud, {
      cabeceras: { authorization: `Bearer ${String(e.env.RELOJ_SECRETO)}` },
    });
    expect(conSecreto.datos.piezas.reloj?.detalle).toBeTruthy();
    const secretoMalo = await new Navegador().llamar<Salud>(salud, {
      cabeceras: { authorization: "Bearer otro" },
    });
    expect(JSON.stringify(secretoMalo.datos)).not.toContain("detalle");
  });

  it("con el reloj corriendo y respaldos al día: verde", async () => {
    const vars = variablesDe(e.env);
    const t = await crearTintoreria(e.env.DB);
    await e.env.DB.prepare("update tintorerias set creada_en = ? where id = ?")
      .bind(Date.now() - 3 * 86_400_000, t.id)
      .run();
    await correrReloj(e.env, vars);
    const r = await revisarSalud(e.env, vars);
    expect(r.piezas.reloj).toEqual({ estado: "ok" });
    expect(r.piezas.respaldos).toEqual({ estado: "ok" });
    expect(r.estado).toBe("ok");
  });

  it("detecta reloj parado, respaldos viejos, variables faltantes y muchos avisos fallidos (comprobado en rojo)", async () => {
    const vars = variablesDe(e.env);
    const tarde = Date.now() + 60 * 60_000;
    let r = await revisarSalud(e.env, vars, tarde);
    expect(r.piezas.reloj?.estado).toBe("error");
    await guardarSistema(e.env.DB, "respaldo_ultimo_ok", String(Date.now() - 40 * 3600_000));
    r = await revisarSalud(e.env, vars);
    expect(r.piezas.respaldos).toMatchObject({ estado: "error" });
    r = await revisarSalud(e.env, { ...vars, BACKUP_KEY: undefined, APP_URL: "http://inseguro" });
    expect(r.piezas.variables?.detalle).toContain("BACKUP_KEY");
    await guardarSistema(e.env.DB, "reloj_ultima_corrida", JSON.stringify({ errores: ["avisos: caído"] }));
    r = await revisarSalud(e.env, vars);
    expect(r.piezas.reloj).toMatchObject({ estado: "error", detalle: "avisos: caído" });
    const ahora = Date.now();
    const t = await e.env.DB.prepare("select id from tintorerias limit 1").first<{ id: string }>();
    const lote = Array.from({ length: 21 }, (_, i) =>
      e.env.DB.prepare(
        "insert into avisos (id, tintoreria_id, tipo, canal, destino, cuerpo, estado, programado_en, creado_en) values (?, ?, 'prueba', 'sms', '+1', 'x', 'fallido', ?, ?)",
      ).bind(`f${i}`, t!.id, ahora, ahora),
    );
    await e.env.DB.batch(lote);
    r = await revisarSalud(e.env, vars);
    expect(r.piezas.avisos?.estado).toBe("error");
  });
});
