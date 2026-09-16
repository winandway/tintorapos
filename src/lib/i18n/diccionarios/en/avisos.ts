import type { avisos as base } from "../es/avisos";
import type { Forma } from "../../index";

export const avisos: Forma<typeof base> = {
  canales: "Channels",
  sms: "Text (SMS)",
  correo: "Email",
  configurado: "Set up",
  noConfigurado: "Not set up",
  noConfiguradoTexto:
    "Messages can't be sent through this channel yet. Notifications are logged as “skipped.”",
  tipos: {
    recibida: { titulo: "Order received", texto: "When the customer drops off their clothes." },
    lista: { titulo: "Order ready", texto: "When every item is ready." },
    recordatorio: {
      titulo: "Reminder",
      texto: "If ready clothes aren't picked up, every few days (Settings → Your store).",
    },
  },
  activo: "Send",
  textoEs: "Message in Spanish",
  textoEn: "Message in English",
  variables: "You can use: {tienda} {nombre} {numero} {fecha} {enlace}",
  restaurar: "Restore the original text",
  vistaPrevia: "Preview",
  prueba: "Send a test",
  pruebaTexto: "Enter your mobile number or email to see how it arrives.",
  destino: "Mobile or email",
  enviar: "Send test",
  resultado: { enviado: "Sent", fallido: "Failed", omitido: "Skipped", pendiente: "Pending" },
  historial: "Recent notifications",
  sinAvisos: "No notifications have been sent yet.",
  consentimiento:
    "They're only sent to customers who agreed to receive them (checkbox on their profile). They can opt out by replying STOP.",
};
