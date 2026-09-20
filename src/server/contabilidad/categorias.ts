/**
 * Las categorías de gasto del oficio (ver docs/CONTABILIDAD-TINTORERIA.md).
 * Fijas a propósito: si cada tienda inventa las suyas, ningún reporte se puede
 * comparar y el contador recibe un revoltijo. El texto libre va en la
 * descripción de cada gasto.
 */
export const GRUPOS_GASTO = [
  "insumos",
  "local",
  "servicios",
  "gente",
  "maquinas",
  "movimiento",
  "venta",
  "oficina",
  "otros",
] as const;
export type GrupoGasto = (typeof GRUPOS_GASTO)[number];

export interface CategoriaGasto {
  clave: string;
  grupo: GrupoGasto;
  es: string;
  en: string;
}

export const CATEGORIAS_GASTO: CategoriaGasto[] = [
  { clave: "insumos", grupo: "insumos", es: "Insumos y químicos", en: "Supplies & chemicals" },
  { clave: "ganchos_bolsas", grupo: "insumos", es: "Ganchos y bolsas", en: "Hangers & bags" },
  { clave: "renta", grupo: "local", es: "Renta del local", en: "Rent" },
  { clave: "seguro", grupo: "local", es: "Seguro", en: "Insurance" },
  { clave: "licencias", grupo: "local", es: "Licencias y permisos", en: "Licenses & permits" },
  { clave: "luz", grupo: "servicios", es: "Luz", en: "Electricity" },
  { clave: "agua", grupo: "servicios", es: "Agua", en: "Water" },
  { clave: "gas", grupo: "servicios", es: "Gas", en: "Gas" },
  { clave: "basura", grupo: "servicios", es: "Basura y desechos", en: "Trash & waste" },
  { clave: "telefono_internet", grupo: "servicios", es: "Teléfono e internet", en: "Phone & internet" },
  { clave: "nomina", grupo: "gente", es: "Sueldos y nómina", en: "Wages & payroll" },
  { clave: "aportes", grupo: "gente", es: "Aportes y beneficios", en: "Payroll taxes & benefits" },
  { clave: "uniformes", grupo: "gente", es: "Uniformes y capacitación", en: "Uniforms & training" },
  { clave: "mantenimiento", grupo: "maquinas", es: "Mantenimiento de máquinas", en: "Equipment maintenance" },
  { clave: "repuestos", grupo: "maquinas", es: "Repuestos y técnico", en: "Parts & service calls" },
  { clave: "gasolina", grupo: "movimiento", es: "Gasolina", en: "Fuel" },
  { clave: "vehiculo", grupo: "movimiento", es: "Camioneta de reparto", en: "Delivery vehicle" },
  { clave: "publicidad", grupo: "venta", es: "Publicidad", en: "Advertising" },
  { clave: "comisiones_tarjeta", grupo: "venta", es: "Comisiones de tarjeta", en: "Card processing fees" },
  { clave: "software", grupo: "oficina", es: "Software y sistema", en: "Software & systems" },
  { clave: "papeleria", grupo: "oficina", es: "Papelería y oficina", en: "Office supplies" },
  { clave: "contador", grupo: "oficina", es: "Contador y legal", en: "Accountant & legal" },
  { clave: "impuestos", grupo: "otros", es: "Impuestos y tasas", en: "Taxes & fees" },
  { clave: "otros", grupo: "otros", es: "Otros", en: "Other" },
];

export const CLAVES_CATEGORIA = CATEGORIAS_GASTO.map((c) => c.clave);

export function esCategoriaGasto(v: unknown): boolean {
  return typeof v === "string" && CLAVES_CATEGORIA.includes(v);
}

export function grupoDe(clave: string): GrupoGasto {
  return CATEGORIAS_GASTO.find((c) => c.clave === clave)?.grupo ?? "otros";
}

/** Formas de pagar un gasto (no son las de cobrar: aquí sale el dinero). */
export const METODOS_GASTO = ["efectivo", "tarjeta", "transferencia", "cheque", "credito"] as const;
export type MetodoGasto = (typeof METODOS_GASTO)[number];

/**
 * Los insumos que tiene cualquier tintorería. No se siembran solos: el dueño
 * toca un botón y se crean en cero, para que no tenga que escribirlos a mano.
 */
export const INSUMOS_ESTANDAR: { es: string; en: string; unidad: string }[] = [
  { es: "Ganchos de alambre", en: "Wire hangers", unidad: "caja" },
  { es: "Bolsas de plástico", en: "Poly bags", unidad: "rollo" },
  { es: "Detergente", en: "Detergent", unidad: "galón" },
  { es: "Solvente de lavado en seco", en: "Dry cleaning solvent", unidad: "galón" },
  { es: "Quitamanchas", en: "Spotting chemicals", unidad: "botella" },
  { es: "Almidón", en: "Starch", unidad: "galón" },
  { es: "Hombreras de papel", en: "Shoulder guards", unidad: "paquete" },
  { es: "Etiquetas", en: "Tags", unidad: "rollo" },
  { es: "Bolsas de entrega", en: "Garment bags", unidad: "paquete" },
  { es: "Filtros", en: "Filters", unidad: "unidad" },
];
