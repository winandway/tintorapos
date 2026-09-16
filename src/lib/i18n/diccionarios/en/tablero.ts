import type { tablero as base } from "../es/tablero";
import type { Forma } from "../../index";

export const tablero: Forma<typeof base> = {
  hola: "Hi, {nombre}",
  hoy: "Today at {tienda}",
  cobradoHoy: "Collected today",
  recibidasHoy: "Orders received today",
  porEntregar: "Ready for pickup",
  atrasadas: "Late",
  acciones: { mostrador: "New order", entrega: "Pick up", produccion: "Production" },
  primerosPasos: "Getting started",
  primerosPasosTexto: "Get your store ready in a few minutes.",
  pasos: {
    tienda: "Complete your store details (address, phone, and tax)",
    precios: "Set your prices",
    empleados: "Add your employees with their PIN",
    dispositivo: "Register the counter tablet",
    orden: "Take in your first order and print the tags",
  },
  hecho: "Done",
  ir: "Go",
  sinPermiso: "Your user doesn't have access to that screen.",
};
