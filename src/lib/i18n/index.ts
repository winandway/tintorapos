import { en } from "./diccionarios/en";
import { es } from "./diccionarios/es";
import type { Idioma } from "./idiomas";

export type { Idioma } from "./idiomas";
export { IDIOMAS, COOKIE_IDIOMA, esIdioma, idiomaDesdeNavegador, localeDe } from "./idiomas";
export { fmt, plural, formatoDinero, formatoFecha } from "./formato";

/** Misma forma que el español, pero cada texto es un string cualquiera. */
export type Forma<T> = { readonly [K in keyof T]: T[K] extends string ? string : Forma<T[K]> };
export type Diccionario = Forma<typeof es>;

const DICCIONARIOS: Record<Idioma, Diccionario> = { es, en };

export function diccionario(idioma: Idioma): Diccionario {
  return DICCIONARIOS[idioma];
}

/** Texto bilingüe guardado por el dueño (dos casillas), con respaldo al español. */
export function textoBilingue(
  idioma: Idioma,
  textoEs: string | null | undefined,
  textoEn: string | null | undefined,
): string {
  if (idioma === "en" && textoEn && textoEn.trim() !== "") return textoEn;
  return textoEs ?? textoEn ?? "";
}
