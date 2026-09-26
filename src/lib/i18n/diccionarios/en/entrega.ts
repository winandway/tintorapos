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
  cajaCerradaTitulo: "Open the register to take cash",
  cajaCerradaTexto:
    "Enter the cash the drawer starts with (0 is fine). The register opens and the pickup goes ahead.",
  abrirYSeguir: "Open register and hand over",
  pideCaja: "You can't open the register. Ask a cashier or manager to open it, or take card or other.",
  cerrada: {
    entregada: "This order was already picked up ({fecha}). There's nothing left to do with it.",
    anulada: "This order was voided. It can't be handed over.",
    abandonada: "This order was marked abandoned. If the customer came for it, open it from Orders.",
  },
  guardadaEnEquipo:
    "Order #{numero} was recorded as picked up on this device, but it hasn't reached the system yet. It's uploading on its own; check the notice at the top. If it's still there after a minute, check the internet.",
};
