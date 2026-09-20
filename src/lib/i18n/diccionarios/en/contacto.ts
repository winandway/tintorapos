import type { contacto as base } from "../es/contacto";
import type { Forma } from "../../index";

export const contacto: Forma<typeof base> = {
  titulo: "Let's talk",
  texto:
    "Questions before opening your dry cleaner on Tintora POS, a problem with your account, or something about privacy? Write to us and we'll reply to the email you leave.",
  meta: {
    titulo: "Contact | Tintora POS",
    descripcion:
      "Write to us: support, questions about the software for dry cleaners and laundries, privacy and data.",
  },
  nombre: "Your name",
  nombrePlaceholder: "First and last name",
  correo: "Your email",
  correoPlaceholder: "you@example.com",
  asunto: "Subject",
  asuntoPlaceholder: "What we can help with",
  mensaje: "Message",
  mensajePlaceholder: "Tell us what you need",
  enviar: "Send message",
  enviando: "Sending…",
  gracias: "Message received",
  graciasTexto: "Thanks. We'll reply to the email you left, usually the same business day.",
  privacidad:
    "We keep your name, email and message only to reply to you. You can ask us to delete it whenever you want.",
  otraForma: "You can also write from the same address you signed up with.",
};
