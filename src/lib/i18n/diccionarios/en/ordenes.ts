import type { ordenes as base } from "../es/ordenes";
import type { Forma } from "../../index";

export const ordenes: Forma<typeof base> = {
  estados: {
    recibida: "Received",
    en_proceso: "In process",
    lista: "Ready",
    entregada: "Picked up",
    anulada: "Voided",
    abandonada: "Abandoned",
  },
  dias: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
};
