import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));

import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { Navegador } from "../ayuda/cliente-http";
import { escenarioAislamiento, huellaTintoreria, type Escenario } from "../ayuda/escenario";
import { COBERTURA } from "../ayuda/cobertura-rutas";
import { sesionPara } from "../ayuda/fabrica";

/**
 * CANDADO DE AISLAMIENTO (rutas): el dueño de la tintorería B intenta leer,
 * cambiar y borrar datos de la tintorería A por CADA ruta /datos y /media.
 * Ninguna respuesta puede traer datos de A, y los datos de A no pueden cambiar.
 * Una ruta nueva sin su caso aquí pone esta prueba en rojo.
 */
function rutasDelProyecto(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) return rutasDelProyecto(p, base);
    return f === "route.ts" ? ["/" + path.relative(base, path.dirname(p)).split(path.sep).join("/")] : [];
  });
}

describe("candado de aislamiento entre tintorerías (rutas)", () => {
  let e: EntornoPrueba;
  let esc: Escenario;
  const raizApp = path.resolve(import.meta.dirname, "../../src/app");
  const rutas = rutasDelProyecto(raizApp).filter((r) => r.startsWith("/datos") || r.startsWith("/media"));

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    esc = await escenarioAislamiento(e);
  }, 120_000);
  afterAll(() => e.cerrar());

  it("cada ruta del backend tiene su caso de aislamiento", () => {
    const cubiertas = Object.keys(COBERTURA).sort();
    const faltan = rutas.filter((r) => !cubiertas.includes(r));
    const sobran = cubiertas.filter((r) => !rutas.includes(r));
    expect(faltan, `Rutas sin caso de aislamiento: ${faltan.join(", ")}`).toEqual([]);
    expect(sobran, `Casos de rutas que ya no existen: ${sobran.join(", ")}`).toEqual([]);
  });

  it("la tintorería B no ve ni cambia nada de la tintorería A", async () => {
    const antes = await huellaTintoreria(e.env.DB, esc.a.id);
    const fugas: string[] = [];
    for (const ruta of rutas) {
      const cobertura = COBERTURA[ruta];
      if (!cobertura || "publica" in cobertura) continue;
      const modulo = (await import(/* @vite-ignore */ path.join(raizApp, ruta, "route.ts"))) as Record<
        string,
        (req: Request, extra?: { params: Promise<Record<string, string | string[]>> }) => Promise<Response>
      >;
      for (const caso of cobertura.casos(esc)) {
        const fn = modulo[caso.metodo];
        if (!fn) {
          fugas.push(`${ruta}: no exporta ${caso.metodo}`);
          continue;
        }
        // Un id indefinido haría pasar el caso sin probar nada (ya pasó una vez).
        const vacios = Object.entries(caso.params ?? {}).filter(([, v]) => !v);
        if (vacios.length)
          fugas.push(`${caso.metodo} ${ruta}: parámetro sin valor (${vacios.map(([k]) => k).join(", ")})`);
        const n = new Navegador();
        // Sesión nueva por caso: así un «salir» no deja sin sesión a los casos siguientes.
        if (caso.como === "dispositivoB") n.cookies.set("tp_disp", esc.b.dispositivoToken);
        else n.cookies.set("tp_sesion", await sesionPara(e.env.DB, esc.b.id, esc.b.duenoId));
        const r = await n.llamar(fn, {
          metodo: caso.metodo,
          ruta: caso.url ?? ruta,
          params: caso.params,
          cuerpo: caso.cuerpo,
        });
        const texto = typeof r.datos === "string" ? r.datos : JSON.stringify(r.datos);
        for (const secreto of esc.a.marcas) {
          if (texto.includes(secreto))
            fugas.push(`${caso.metodo} ${ruta}: la respuesta trae datos de A (${secreto.slice(0, 8)}…)`);
        }
        const permitidos = caso.esperado ?? [400, 403, 404];
        if (!permitidos.includes(r.estado))
          fugas.push(
            `${caso.metodo} ${ruta}: respondió ${r.estado} (${texto.slice(0, 160)}), se esperaba ${permitidos.join("/")}`,
          );
      }
    }
    expect(fugas, fugas.join("\n")).toEqual([]);
    expect(await huellaTintoreria(e.env.DB, esc.a.id)).toBe(antes);
  });
});
