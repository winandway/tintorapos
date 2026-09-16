import type { sinConexion as base } from "../es/sinConexion";
import type { Forma } from "../../index";

export const sinConexion: Forma<typeof base> = {
  titulo: "Pending changes",
  subtitulo: "What was done offline on this device and hasn't reached the system yet.",
  vacio: "Everything is up to date.",
  porRevisar: "{n} to review",
  entrarDeNuevo: "Sign in again to upload changes",
  subirAhora: "Upload now",
  descartar: "Discard",
  confirmarDescartar: "Discard this change?",
  confirmarDescartarTexto: "It won't be uploaded. Only do this if you already recorded it another way.",
  tipos: { crear_orden: "New order", estado: "Status change", pago: "Payment", entregar: "Pickup" },
  pendiente: "Waiting for connection",
};
