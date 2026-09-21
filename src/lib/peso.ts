/**
 * En qué se pesa la ropa en cada tienda. Por dentro el servicio «por peso» se
 * sigue llamando `libra` (la base lo tiene así y su esquema no admite cambios);
 * lo que cambia es la unidad que ve y cobra la tienda: libras o kilos. El precio
 * es por ESA unidad: no se convierte nada.
 * Candado: tests/unit/peso.test.ts.
 */
import type { Idioma } from "@/lib/i18n";

export const UNIDADES_PESO = ["lb", "kg"] as const;
export type UnidadPeso = (typeof UNIDADES_PESO)[number];

/** Donde la ropa se pesa en libras. El resto del mundo usa kilos. */
const PAISES_EN_LIBRAS = new Set(["US", "PR"]);

export function esUnidadPeso(v: unknown): v is UnidadPeso {
  return v === "lb" || v === "kg";
}

/** La unidad de fábrica de una tienda, por su país. */
export function unidadPesoDePais(pais: string | null | undefined): UnidadPeso {
  return PAISES_EN_LIBRAS.has((pais ?? "").toUpperCase()) ? "lb" : "kg";
}

/** Lo guardado si vale; si no, lo que toca por el país. */
export function resolverUnidadPeso(guardado: unknown, pais: string | null | undefined): UnidadPeso {
  return esUnidadPeso(guardado) ? guardado : unidadPesoDePais(pais);
}

/** El servicio por peso que trae de fábrica una tienda nueva. */
export const SERVICIO_POR_PESO: Record<UnidadPeso, Record<Idioma, string>> = {
  lb: { es: "Lavado por libra", en: "Wash & fold (per lb)" },
  kg: { es: "Lavado por kilo", en: "Wash & fold (per kg)" },
};

/** «2.5 kg», «3 lb»: la cantidad como se lee en la orden y en el recibo. */
export function cantidadConPeso(cantidad: number, unidad: UnidadPeso): string {
  return `${cantidad} ${unidad}`;
}
