import type { publico as base } from "../es/publico";
import type { Forma } from "../../index";

export const publico: Forma<typeof base> = {
  titulo: "Your order status",
  hola: "Hi, {nombre}",
  orden: "Order #{numero}",
  pasos: {
    recibida: "Received",
    en_proceso: "In process",
    lista: "Ready for pickup",
    entregada: "Picked up",
  },
  listaTexto: "Your clothes are ready! Come pick them up anytime during store hours.",
  procesoTexto: "We're working on your clothes.",
  recibidaTexto: "We received your clothes.",
  entregadaTexto: "You already picked up this order. Thank you!",
  anuladaTexto: "This order was voided. If you have questions, call the store.",
  abandonadaTexto: "This order wasn't picked up in time. Please call the store.",
  listaPara: "Ready by",
  piezasListas: "{listas} of {total} items ready",
  saldoPendiente: "You have a balance due. You'll pay it at pickup.",
  llamar: "Call the store",
  noExiste: "We couldn't find this order",
  noExisteTexto: "Check that the link is complete, or call the store.",
  demasiadas: "Too many lookups in a row. Wait a minute and try again.",
  gestionadoCon: "Powered by Tintora POS",
};
