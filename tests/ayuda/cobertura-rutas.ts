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
export const COBERTURA: Record<string, Cobertura> = {
  "/datos/registro": { publica: "crea una tintorería nueva; no recibe identificadores de otra" },
  "/datos/sesion": { casos: () => [{ metodo: "GET", esperado: [200] }] },
  "/datos/sesion/entrar": { publica: "solo recibe correo y contraseña" },
  "/datos/sesion/salir": { casos: () => [{ metodo: "POST", esperado: [200] }] },
  "/datos/sesion/dos-pasos/iniciar": { casos: () => [{ metodo: "POST", esperado: [200] }] },
  "/datos/sesion/dos-pasos/activar": {
    casos: () => [{ metodo: "POST", cuerpo: { codigo: "000000" }, esperado: [400, 409] }],
  },
  "/datos/sesion/dos-pasos/verificar": {
    casos: () => [{ metodo: "POST", cuerpo: { codigo: "000000" }, esperado: [400, 409] }],
  },
  "/datos/clave/cambiar": {
    casos: () => [{ metodo: "POST", cuerpo: { actual: "no-es", nueva: "Otra-Clave-2026" } }],
  },
  "/datos/clave/recuperar": { publica: "solo recibe un correo y siempre responde lo mismo" },
  "/datos/clave/restablecer": { publica: "solo recibe un token secreto de 256 bits" },
};
