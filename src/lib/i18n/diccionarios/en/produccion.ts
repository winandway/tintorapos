import type { produccion as base } from "../es/produccion";
import type { Forma } from "../../index";

export const produccion: Forma<typeof base> = {
  titulo: "Production",
  subtitulo: "Scan an item tag or the ticket to move it.",
  escanear: "Scan or type the number",
  escanearPlaceholder: "Code, QR, or order number",
  camara: "Use camera",
  apuntar: "Point the camera at the QR code",
  sinCamara: "Couldn't open the camera. Check the browser permission or use the scanner.",
  noEncontrado: "We couldn't find that code in your store.",
  modoRapido: "Mark as ready when scanned",
  ubicacion: "Rack location",
  ubicacionPlaceholder: "e.g. B-12",
  enProceso: "In process",
  lista: "Ready",
  recibida: "Received",
  todaLaOrden: "Whole order",
  estaPieza: "This item",
  movida: "#{numero}: {estado}",
  columnas: { recibida: "Received", en_proceso: "In process", lista: "Ready" },
  vacio: "Nothing here.",
  piezasListas: "{listas} of {total} ready",
  ultimaEscaneada: "Last scanned",
  urgente: "Rush",
};
