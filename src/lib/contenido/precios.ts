import type { Idioma } from "@/lib/i18n";

/**
 * Un solo plan, un solo precio: 120 USD al año por tienda (decisión de Richard,
 * 19 de septiembre de 2026). Todo va incluido; nada de funciones escondidas
 * detrás de un plan más caro.
 */
export interface Plan {
  clave: "anual";
  precioAnualCents: number;
  /** Lo que sale por mes, solo para que se entienda. No se cobra así. */
  equivalenteMensualCents: number;
  es: { nombre: string; para: string; incluye: string[] };
  en: { nombre: string; para: string; incluye: string[] };
}

const INCLUYE_ES = [
  "Órdenes con etiqueta y QR por prenda",
  "Producción por escaneo y entrega con cobro",
  "Caja con cierre a ciegas y reportes del día",
  "Contabilidad: gastos, compras, insumos, ganancia e impuestos",
  "Empleados sin límite, con permisos a la medida",
  "Dispositivos sin límite: tablet, computadora y celulares",
  "Avisos al cliente por correo y su página de estado",
  "Funciona sin internet y se sincroniza solo",
  "Respaldo diario y exportación de tus datos cuando quieras",
  "Soporte por correo, en español y en inglés",
];

const INCLUYE_EN = [
  "Orders with a QR tag per garment",
  "Production by scanning and pickup with payment",
  "Cash register with blind close and daily reports",
  "Accounting: expenses, purchases, supplies, profit and sales tax",
  "Unlimited employees, with custom permissions",
  "Unlimited devices: tablet, computer and phones",
  "Customer notifications by email and their status page",
  "Works offline and syncs by itself",
  "Daily backup and export of your data whenever you want",
  "Email support, in Spanish and English",
];

export const PLAN: Plan = {
  clave: "anual",
  precioAnualCents: 12_000,
  equivalenteMensualCents: 1_000,
  es: {
    nombre: "Tintora POS",
    para: "Todo el sistema, para una tienda. Sin funciones escondidas ni sorpresas.",
    incluye: INCLUYE_ES,
  },
  en: {
    nombre: "Tintora POS",
    para: "The whole system, for one store. No hidden features, no surprises.",
    incluye: INCLUYE_EN,
  },
};

/** Se mantiene la lista por si algún día hay más de un plan. */
export const PLANES: Plan[] = [PLAN];

export const textoPlan = (p: Plan, idioma: Idioma) => p[idioma];
