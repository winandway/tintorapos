import { COOKIE_IDIOMA, type Idioma } from "./idiomas";

/** Guarda el idioma elegido con las banderas (lo lee el servidor en la siguiente petición). */
export function guardarIdiomaElegido(idioma: Idioma): void {
  document.cookie = `${COOKIE_IDIOMA}=${idioma}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.setAttribute("lang", idioma);
}
