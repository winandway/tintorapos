import type { precios as base } from "../es/precios";
import type { Forma } from "../../index";

export const precios: Forma<typeof base> = {
  titulo: "Clear pricing, no surprises",
  texto:
    "Start with 14 free days, no credit card. When it ends, you decide whether to stay. Your data is yours and you can take it whenever you want.",
  meta: {
    titulo: "Pricing | Tintora POS",
    descripcion:
      "Tintora POS plans for dry cleaners and laundries. 14-day trial, no credit card, no lock-in.",
  },
  mensual: "per month",
  anual: "per year",
  aConsultar: "Write to us",
  aConsultarTexto: "We'll send you the price for your case, based on how many stores and employees you have.",
  incluye: "Includes",
  empezar: "Try 14 days free",
  hablar: "Talk to us",
  destacado: "Most popular",
  preguntas: "Frequent questions",
  faq: [
    {
      p: "Do I need a credit card to try it?",
      r: "No. The 14-day trial asks for no card and does not charge you when it ends.",
    },
    {
      p: "What happens when the trial ends?",
      r: "The system stops taking new orders and payments, but you can still see and export everything of yours. Write to us and we'll turn it on.",
    },
    {
      p: "Is there a contract?",
      r: "No. Cancel whenever you want and the service runs until the end of the period you already paid for.",
    },
    {
      p: "Does Tintora POS charge my customers' cards?",
      r: "Not yet. Today it records what you already collected in cash, with your own card terminal or another method.",
    },
  ],
};
