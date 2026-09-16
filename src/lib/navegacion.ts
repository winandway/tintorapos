/**
 * Carga COMPLETA de la página (regla de la casa al entrar y al salir): así el
 * encabezado, los menús y la caché del cliente arrancan de cero y no queda
 * nada de la sesión anterior en pantalla.
 */
export function recargarEn(ruta: string): void {
  window.location.replace(new URL(ruta, window.location.origin).href);
}
