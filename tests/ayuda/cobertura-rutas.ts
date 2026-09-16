import type { Escenario } from "./escenario";

export interface CasoAislamiento {
  metodo: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, string>;
  cuerpo?: unknown;
  url?: string;
  /** Con qué credencial de la tintorería B se ataca (por defecto, la sesión del dueño de B). */
  como?: "sesionB" | "dispositivoB";
  /** Estados aceptables. Por defecto 400/403/404. */
  esperado?: number[];
}

export type Cobertura = { publica: string } | { casos: (e: Escenario) => CasoAislamiento[] };

/**
 * Cada ruta del backend y cómo se ataca desde la tintorería B apuntando a datos de A.
 * Las rutas que no leen datos de una tintorería concreta se declaran públicas con su motivo.
 */
export const COBERTURA: Record<string, Cobertura> = {};
