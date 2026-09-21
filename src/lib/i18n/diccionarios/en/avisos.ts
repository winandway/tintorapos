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
  recibo: {
    titulo: "Digital receipt by email",
    texto:
      "When you create the order, the customer gets their receipt by email: the items, the total, what they paid, when it will be ready and a button to check the status. It only goes out if the customer has an email on file.",
    nota: "It's free and doesn't depend on the notification below.",
  },
  tipos: {
    recibida: {
      titulo: "Order received notification",
      texto:
        "A short message when the customer drops off their clothes, by text and email. The digital receipt is separate.",
    },
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
