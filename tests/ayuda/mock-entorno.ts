import { vi } from "vitest";
import type { EntornoPrueba } from "./entorno";

/**
 * Sustituye la conexión con la plataforma por el entorno de pruebas (D1 y R2 locales).
 * Uso en cada archivo:  vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));
 */
const real = await vi.importActual<typeof import("@/server/entorno")>("@/server/entorno");

let actual: EntornoPrueba | null = null;

export function usarEntorno(e: EntornoPrueba) {
  actual = e;
}

export const ErrorConfiguracion = real.ErrorConfiguracion;
export const variablesDe = real.variablesDe;

export function obtenerContexto() {
  if (!actual) throw new Error("Falta usarEntorno(e) en la prueba");
  const e = actual;
  return {
    env: e.env,
    vars: real.variablesDe(e.env),
    esperarLuego: (p: Promise<unknown>) => {
      e.pendientes.push(p);
    },
  };
}
