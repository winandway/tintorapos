import type { correos as base } from "../es/correos";
import type { Forma } from "../../index";

export const correos: Forma<typeof base> = {
  recuperarAsunto: "Reset your Tintora POS password",
  recuperarTexto:
    "Hi {nombre},\n\nYou asked to reset your Tintora POS password. Open this link within the next hour to choose a new one:\n\n{enlace}\n\nIf this wasn't you, ignore this email and your password stays the same.\n\nThe Tintora POS team",
};
