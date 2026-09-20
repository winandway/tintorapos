import type { Idioma } from "@/lib/i18n";

/**
 * Los planes que se venden. Los IMPORTES los pone Richard: mientras
 * `precioMensualCents` sea null, la página dice «escríbenos» en vez de inventar
 * un precio (prohibido publicar un número que nadie decidió).
 */
export interface Plan {
  clave: "taller" | "tienda" | "cadena";
  destacado?: boolean;
  precioMensualCents: number | null;
  precioAnualCents: number | null;
  es: { nombre: string; para: string; incluye: string[] };
  en: { nombre: string; para: string; incluye: string[] };
}

const COMUN_ES = [
  "Órdenes con etiqueta y QR por prenda",
  "Producción por escaneo y entrega con cobro",
  "Caja con cierre a ciegas",
  "Avisos al cliente por correo",
  "Página de estado para el cliente",
  "Funciona sin internet y se sincroniza solo",
  "Respaldo diario y exportación de tus datos",
];

const COMUN_EN = [
  "Orders with a QR tag per garment",
  "Production by scanning and pickup with payment",
  "Cash register with blind close",
  "Customer notifications by email",
  "Status page for the customer",
  "Works offline and syncs by itself",
  "Daily backup and export of your data",
];

export const PLANES: Plan[] = [
  {
    clave: "taller",
    precioMensualCents: null,
    precioAnualCents: null,
    es: {
      nombre: "Taller",
      para: "Una tienda que empieza, con una tablet en el mostrador.",
      incluye: [...COMUN_ES, "Hasta 3 empleados con PIN", "1 dispositivo registrado", "Soporte por correo"],
    },
    en: {
      nombre: "Shop",
      para: "A single store getting started, with one tablet at the counter.",
      incluye: [...COMUN_EN, "Up to 3 employees with a PIN", "1 registered device", "Email support"],
    },
  },
  {
    clave: "tienda",
    destacado: true,
    precioMensualCents: null,
    precioAnualCents: null,
    es: {
      nombre: "Tienda",
      para: "La tintorería que ya trabaja todo el día y quiere ver sus números.",
      incluye: [
        ...COMUN_ES,
        "Empleados sin límite, con permisos a la medida",
        "Dispositivos sin límite (tablet, computadora y celulares)",
        "Contabilidad: gastos, insumos y ganancia",
        "Reportes por día, servicio y empleado",
      ],
    },
    en: {
      nombre: "Store",
      para: "The dry cleaner that already runs all day and wants to see its numbers.",
      incluye: [
        ...COMUN_EN,
        "Unlimited employees, with custom permissions",
        "Unlimited devices (tablet, computer and phones)",
        "Accounting: expenses, supplies and profit",
        "Reports by day, service and employee",
      ],
    },
  },
  {
    clave: "cadena",
    precioMensualCents: null,
    precioAnualCents: null,
    es: {
      nombre: "Cadena",
      para: "Varias sucursales bajo el mismo dueño.",
      incluye: [
        "Todo lo del plan Tienda",
        "Varias sucursales con reportes comparados",
        "Acompañamiento en la puesta en marcha",
        "Soporte con prioridad",
      ],
    },
    en: {
      nombre: "Chain",
      para: "Several branches under the same owner.",
      incluye: [
        "Everything in the Store plan",
        "Several branches with side-by-side reports",
        "Hands-on onboarding",
        "Priority support",
      ],
    },
  },
];

export const hayPrecios = PLANES.some((p) => p.precioMensualCents !== null);

export const textoPlan = (p: Plan, idioma: Idioma) => p[idioma];
