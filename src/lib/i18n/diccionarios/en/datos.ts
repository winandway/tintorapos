import type { datos as base } from "../es/datos";
import type { Forma } from "../../index";

export const datos: Forma<typeof base> = {
  exportar: "Export your data",
  exportarTexto: "Your data belongs to you. Download it whenever you want.",
  todoJson: "Everything (JSON)",
  clientesCsv: "Customers (CSV)",
  ordenesCsv: "Orders (CSV)",
  pagosCsv: "Payments (CSV)",
  respaldos: "Automatic backups",
  respaldosTexto:
    "Every day we keep an encrypted copy of your store for 30 days, on top of the platform's own protection.",
  sinRespaldos: "The first backup runs within the next 24 hours.",
  filas: "{n} records",
};
