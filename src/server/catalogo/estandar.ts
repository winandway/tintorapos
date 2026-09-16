/**
 * Catálogo estándar del oficio (tintorerías y lavanderías de EE.UU. y
 * Latinoamérica). Se crea al registrar una tintorería SIN precios: cada dueño
 * pone los suyos. Nada de datos inventados que haya que borrar.
 */
export interface ServicioEstandar {
  clave: string;
  es: string;
  en: string;
  unidad: "pieza" | "libra";
  impuesto: boolean;
}

export const SERVICIOS_ESTANDAR: ServicioEstandar[] = [
  { clave: "seco", es: "Lavado en seco", en: "Dry cleaning", unidad: "pieza", impuesto: true },
  {
    clave: "lavado_planchado",
    es: "Lavado y planchado",
    en: "Laundered & pressed",
    unidad: "pieza",
    impuesto: true,
  },
  { clave: "planchado", es: "Solo planchado", en: "Press only", unidad: "pieza", impuesto: true },
  { clave: "libra", es: "Lavado por libra", en: "Wash & fold (per lb)", unidad: "libra", impuesto: true },
  {
    clave: "arreglos",
    es: "Arreglos y costura",
    en: "Alterations & repairs",
    unidad: "pieza",
    impuesto: true,
  },
];

export const PRENDAS_ESTANDAR: { es: string; en: string }[] = [
  { es: "Camisa", en: "Shirt" },
  { es: "Blusa", en: "Blouse" },
  { es: "Pantalón", en: "Pants" },
  { es: "Falda", en: "Skirt" },
  { es: "Vestido", en: "Dress" },
  { es: "Saco o blazer", en: "Blazer or sport coat" },
  { es: "Traje de 2 piezas", en: "2-piece suit" },
  { es: "Traje de 3 piezas", en: "3-piece suit" },
  { es: "Chaqueta", en: "Jacket" },
  { es: "Abrigo", en: "Coat" },
  { es: "Suéter", en: "Sweater" },
  { es: "Corbata", en: "Tie" },
  { es: "Uniforme", en: "Uniform" },
  { es: "Vestido de fiesta", en: "Evening gown" },
  { es: "Vestido de novia", en: "Wedding gown" },
  { es: "Edredón", en: "Comforter" },
  { es: "Cobija o manta", en: "Blanket" },
  { es: "Cortinas", en: "Curtains" },
  { es: "Mantel", en: "Tablecloth" },
  { es: "Otra prenda", en: "Other item" },
];
