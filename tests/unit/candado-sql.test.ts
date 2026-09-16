import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * CANDADO DE AISLAMIENTO (estático): toda consulta SQL del código que toque una
 * tabla de negocio tiene que filtrar o escribir tintoreria_id. Las excepciones
 * legítimas se marcan dentro del SQL con un comentario explícito:
 *   /* sistema: … *\/        tareas del reloj que recorren todas las tintorerías
 *   /* token secreto: … *\/  búsquedas por un token de 256 bits (sesión, dispositivo)
 *   /* código público: … *\/ búsqueda por código público de ticket (100 bits)
 */
const TABLAS_NEGOCIO = [
  "sucursales",
  "usuarios",
  "dispositivos",
  "sesiones",
  "tokens_recuperacion",
  "clientes",
  "catalogo_prendas",
  "catalogo_servicios",
  "precios",
  "turnos_caja",
  "movimientos_caja",
  "ordenes",
  "orden_prendas",
  "orden_estados",
  "fotos",
  "pagos",
  "avisos",
  "auditoria",
  "respaldos",
  "operaciones_sync",
];

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) return archivos(p);
    return /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
}

/** Extrae el primer argumento literal de cada .prepare( … ). */
export function consultasDe(codigo: string): string[] {
  const salida: string[] = [];
  const re = /\.prepare\(\s*(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*")/g;
  for (const m of codigo.matchAll(re)) salida.push((m[1] ?? "").slice(1, -1));
  return salida;
}

export function problemaDeConsulta(sql: string): string | null {
  const s = sql.toLowerCase().replace(/\s+/g, " ");
  if (/\/\*\s*(sistema|token secreto|código público|codigo publico):/.test(s)) return null;
  const tablas = [...s.matchAll(/\b(?:from|join|into|update)\s+([a-z_]+)/g)].map((m) => m[1] ?? "");
  const deNegocio = tablas.filter((t) => TABLAS_NEGOCIO.includes(t));
  if (deNegocio.length && !s.includes("tintoreria_id"))
    return `usa ${deNegocio.join(", ")} sin tintoreria_id`;
  if (tablas.includes("tintorerias") && !/\bid = \?|\bt\.id = |insert into tintorerias/.test(s)) {
    return "consulta tintorerias sin «id = ?»";
  }
  return null;
}

describe("candado de aislamiento: SQL", () => {
  const raiz = path.resolve(import.meta.dirname, "../../src");
  const todos = archivos(raiz);

  it("encuentra consultas para revisar", () => {
    const total = todos.reduce((n, f) => n + consultasDe(readFileSync(f, "utf8")).length, 0);
    expect(total).toBeGreaterThan(10);
  });

  it("ninguna consulta de negocio olvida tintoreria_id", () => {
    const problemas: string[] = [];
    for (const f of todos) {
      for (const sql of consultasDe(readFileSync(f, "utf8"))) {
        const p = problemaDeConsulta(sql);
        if (p) problemas.push(`${path.relative(raiz, f)}: ${p}\n    ${sql.trim().slice(0, 160)}`);
      }
    }
    expect(problemas, problemas.join("\n")).toEqual([]);
  });

  it("la prueba detecta de verdad una consulta sin filtro (comprobada en rojo)", () => {
    expect(problemaDeConsulta("select * from ordenes where id = ?")).toMatch(/sin tintoreria_id/);
    expect(problemaDeConsulta("update clientes set nombre = ? where id = ?")).toMatch(/sin tintoreria_id/);
    expect(problemaDeConsulta("select * from tintorerias")).toMatch(/sin «id = \?»/);
    expect(problemaDeConsulta("select * from ordenes where tintoreria_id = ? and id = ?")).toBeNull();
    expect(problemaDeConsulta("delete from limites where clave = ?")).toBeNull();
    expect(
      problemaDeConsulta("select * from avisos /* sistema: cola */ where estado = 'pendiente'"),
    ).toBeNull();
    expect(consultasDe('db.prepare("select 1").first(); db.prepare(`select\n2`)')).toEqual([
      "select 1",
      "select\n2",
    ]);
  });
});
