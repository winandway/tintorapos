import "server-only";
import { cookies, headers } from "next/headers";
import { COOKIE_IDIOMA, esIdioma, idiomaDesdeNavegador, type Idioma } from "./idiomas";
import { diccionario } from "./index";

/** Idioma de la petición: cookie elegida con las banderas; si no, el del navegador. */
export async function obtenerIdioma(): Promise<Idioma> {
  const galletas = await cookies();
  const elegido = galletas.get(COOKIE_IDIOMA)?.value;
  if (esIdioma(elegido)) return elegido;
  const cab = await headers();
  return idiomaDesdeNavegador(cab.get("accept-language"));
}

export async function obtenerTextos() {
  const idioma = await obtenerIdioma();
  return { idioma, d: diccionario(idioma) };
}
