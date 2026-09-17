/**
 * Dirección CANÓNICA del sitio para Google, redes y enlaces absolutos públicos.
 * Es fija: el sitio también responde en tintorapos.sitios.dev, pero lo que se
 * indexa es siempre el dominio propio (sitios.dev lleva «noindex»).
 * Los enlaces que manda la app (SMS, correos) usan la variable APP_URL.
 */
export const URL_SITIO = "https://tintorapos.com";
export const DOMINIO_SITIO = new URL(URL_SITIO).host;
export const ANIO_ACTUAL = new Date().getFullYear();
/** Fecha de la última revisión del contenido público (sitemap y datos estructurados). */
export const CONTENIDO_ACTUALIZADO = "2026-09-17";
