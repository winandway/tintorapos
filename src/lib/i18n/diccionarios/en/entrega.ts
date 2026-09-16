import type { entrega as base } from "../es/entrega";
import type { Forma } from "../../index";

export const entrega: Forma<typeof base> = {
  titulo: "Pick up",
  subtitulo: "Scan the customer's receipt or search by mobile, name, or number.",
  buscar: "Receipt, mobile, name, or number",
  sinOrdenes: "No open orders match that search.",
  elegir: "Choose the order being picked up",
  saldo: "Balance to collect",
  pagada: "Paid in full",
  noLista: "Some items aren't ready yet.",
  entregarIgual: "Hand over anyway",
  cobrarYEntregar: "Collect {monto} and hand over",
  entregar: "Hand over",
  entregada: "Order #{numero} picked up",
  otra: "Next pickup",
  metodo: "Payment method",
  ubicaciones: "Look in: {ubicaciones}",
};
