import { ErrorApi } from "./api";
import type { Diccionario } from "./i18n";

/** Texto para el error de un campo, a partir del código que manda el servidor. */
export function textoCampo(d: Diccionario, codigo: string | undefined | null): string | null {
  if (!codigo) return null;
  const v = (d.validacion as Record<string, string>)[codigo];
  if (v) return v;
  const e = (d.errores as Record<string, string>)[codigo];
  return e ?? d.validacion.invalido;
}

/** Texto general de un error para mostrar arriba del formulario. */
export function textoError(d: Diccionario, e: unknown): string {
  if (e instanceof ErrorApi) {
    if (e.sinConexion) return d.comun.errorRed;
    return e.message || d.errores.inesperado;
  }
  return d.errores.inesperado;
}

export function camposDe(e: unknown): Record<string, string> {
  return e instanceof ErrorApi ? e.campos : {};
}
