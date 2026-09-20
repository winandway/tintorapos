/**
 * Dirección de cada guía en inglés. La clave es el slug en español (el de la
 * carpeta y el que usan los enlaces internos). Va aparte del contenido para que
 * el proxy y el selector de idioma no carguen el texto de las guías.
 */
export const SLUG_EN: Record<string, string> = {
  "primeros-pasos": "getting-started",
  dispositivos: "register-counter-tablet",
  impresoras: "receipt-and-tag-printers",
  "recibir-ropa": "taking-in-orders",
  etiquetas: "tags-and-receipts",
  "entrega-y-cobro": "pickup-and-payment",
  "sin-conexion": "working-offline",
  produccion: "production-scanner",
  "camino-de-una-prenda": "a-garments-journey",
  caja: "cash-register-closing",
  autorizaciones: "roles-and-manager-approval",
  reportes: "reports",
  contabilidad: "accounting",
  "insumos-y-compras": "supplies-and-purchases",
  avisos: "text-notifications",
  "pagina-del-cliente": "customer-status-page",
  "dos-pasos": "two-step-verification",
  exportar: "export-your-data",
  respaldos: "daily-backups",
};
