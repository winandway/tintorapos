import { localeDe, type Idioma } from "./idiomas";

/** Reemplaza {nombre} en una plantilla. Las llaves sin valor quedan tal cual. */
export function fmt(plantilla: string, vars: Record<string, string | number> = {}): string {
  return plantilla.replace(/\{(\w+)\}/g, (entero, clave: string) =>
    Object.prototype.hasOwnProperty.call(vars, clave) ? String(vars[clave]) : entero,
  );
}

/** Elige singular o plural según la cantidad: plural(n, "{n} prenda", "{n} prendas"). */
export function plural(n: number, uno: string, varios: string): string {
  return fmt(n === 1 ? uno : varios, { n });
}

export function formatoDinero(centavos: number, moneda: string, idioma: Idioma, region = "US"): string {
  return new Intl.NumberFormat(localeDe(idioma, region), { style: "currency", currency: moneda }).format(
    centavos / 100,
  );
}

export function formatoFecha(
  instante: string | number | Date,
  idioma: Idioma,
  zona: string,
  opciones: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
  region = "US",
): string {
  return new Intl.DateTimeFormat(localeDe(idioma, region), { timeZone: zona, ...opciones }).format(
    new Date(instante),
  );
}
