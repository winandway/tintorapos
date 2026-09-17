/** Dirección pública del sitio para metadatos y enlaces absolutos. */
export const URL_SITIO = (process.env.APP_URL ?? "https://tintorapos.sitios.dev").replace(/\/$/, "");
export const DOMINIO_SITIO = new URL(URL_SITIO).host;
export const ANIO_ACTUAL = new Date().getFullYear();
