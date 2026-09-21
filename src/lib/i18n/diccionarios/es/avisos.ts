export const avisos = {
  canales: "Canales",
  sms: "SMS",
  correo: "Correo",
  configurado: "Configurado",
  noConfigurado: "Sin configurar",
  noConfiguradoTexto:
    "Todavía no se pueden enviar mensajes por este canal. Los avisos quedan registrados como «omitidos».",
  recibo: {
    titulo: "Recibo digital por correo",
    texto:
      "Al crear la orden, al cliente le llega por correo su recibo: las prendas, el total, lo que pagó, cuándo estará lista y un botón para ver el estado. Sale solo si el cliente tiene correo en su ficha.",
    nota: "No cuesta nada y no depende del aviso de abajo.",
  },
  tipos: {
    recibida: {
      titulo: "Aviso de orden recibida",
      texto:
        "Un mensaje corto cuando el cliente deja su ropa, por SMS y por correo. El recibo digital va aparte.",
    },
    lista: { titulo: "Orden lista", texto: "Cuando todas las prendas están listas." },
    recordatorio: {
      titulo: "Recordatorio",
      texto: "Si la ropa lista no se recoge, cada tantos días (Ajustes → Tu tienda).",
    },
  },
  activo: "Enviar",
  textoEs: "Mensaje en español",
  textoEn: "Mensaje en inglés",
  variables: "Puedes usar: {tienda} {nombre} {numero} {fecha} {enlace}",
  restaurar: "Volver al texto original",
  vistaPrevia: "Vista previa",
  prueba: "Enviar una prueba",
  pruebaTexto: "Escribe tu celular o tu correo para ver cómo llega.",
  destino: "Celular o correo",
  enviar: "Enviar prueba",
  resultado: { enviado: "Enviado", fallido: "Falló", omitido: "Omitido", pendiente: "Pendiente" },
  historial: "Últimos avisos",
  sinAvisos: "Todavía no se ha enviado ningún aviso.",
  consentimiento:
    "Solo se envían a clientes que aceptaron recibirlos (casilla en su ficha). Pueden darse de baja respondiendo STOP.",
};
