import type { correos as base } from "../es/correos";
import type { Forma } from "../../index";

export const correos: Forma<typeof base> = {
  verificarAsunto: "Confirm your Tintora POS email",
  verificarTexto:
    "Hi {nombre},\n\nThanks for opening your dry cleaner on Tintora POS. Confirm this email is yours by opening this link:\n\n{enlace}\n\nThat way you can reset your password if you ever forget it. The link works for 7 days.\n\nThe Tintora POS team",
  recuperarAsunto: "Reset your Tintora POS password",
  recuperarTexto:
    "Hi {nombre},\n\nYou asked to reset your Tintora POS password. Open this link within the next hour to choose a new one:\n\n{enlace}\n\nIf this wasn't you, ignore this email and your password stays the same.\n\nThe Tintora POS team",
  ticketAsunto: "Tintora POS · reply to your message (#{numero})",
  ticketHola: "Hi {nombre},",
  ticketPie: "— The Tintora POS team\nIf you need anything else, just reply to this email.",
};
