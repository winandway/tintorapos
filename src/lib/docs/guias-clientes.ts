import type { Guia } from "./tipos";

export const GUIAS_CLIENTES: Guia[] = [
  {
    slug: "avisos",
    seccion: "clientes",
    icono: "mensaje",
    es: {
      titulo: "Avisos por SMS",
      resumen: "Activa los mensajes de orden recibida, orden lista y recordatorio, y personaliza los textos.",
      bloques: [
        { t: "p", texto: "Tintora POS puede avisarle al cliente por SMS en tres momentos:" },
        {
          t: "lista",
          items: [
            "**Orden recibida**: cuando deja su ropa.",
            "**Orden lista**: cuando todas las prendas están listas.",
            "**Recordatorio**: si la ropa lista no se recoge, cada tantos días.",
          ],
        },
        { t: "figura", figura: "sms", pie: "Así le llega al cliente el aviso de orden lista." },
        { t: "h2", texto: "Activarlos" },
        {
          t: "pasos",
          items: [
            "Entra a **Ajustes → Avisos a clientes**.",
            "Activa **Enviar** en cada aviso que quieras usar.",
            "Si quieres, cambia el **Mensaje en español** y el **Mensaje en inglés**. Puedes usar {tienda}, {nombre}, {numero}, {fecha} y {enlace}.",
            "Toca **Enviar una prueba** con tu celular para ver cómo llega.",
          ],
        },
        {
          t: "p",
          texto:
            "Cada cliente recibe el mensaje en su idioma. La frecuencia y el máximo de recordatorios se definen en **Ajustes → Tu tienda**.",
        },
        { t: "h2", texto: "El permiso del cliente" },
        {
          t: "p",
          texto:
            "Solo se envían mensajes a clientes con la casilla **Acepta mensajes de texto sobre sus órdenes** marcada. Pregúntale antes de marcarla. Si el cliente responde STOP, deja de recibir mensajes.",
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "En Estados Unidos, los mensajes de texto de negocios están regulados. Usa los avisos solo para informar sobre las órdenes, nunca para publicidad.",
        },
        { t: "h2", texto: "Si un aviso no llega" },
        {
          t: "p",
          texto:
            "En **Últimos avisos** ves cada mensaje con su resultado: **Enviado**, **Falló**, **Omitido** o **Pendiente**. Omitido quiere decir que el canal todavía no está configurado o que el cliente no aceptó mensajes. Si el canal SMS aparece **Sin configurar**, escribe a soporte.",
        },
      ],
    },
    en: {
      titulo: "Text notifications",
      resumen: "Turn on order received, order ready and reminder texts, and customize the wording.",
      bloques: [
        { t: "p", texto: "Tintora POS can text your customers at three moments:" },
        {
          t: "lista",
          items: [
            "**Order received**: when they drop off their clothes.",
            "**Order ready**: when every item is ready.",
            "**Reminder**: if ready clothes aren’t picked up, every few days.",
          ],
        },
        { t: "figura", figura: "sms", pie: "What the customer receives when an order is ready." },
        { t: "h2", texto: "Turn them on" },
        {
          t: "pasos",
          items: [
            "Go to **Settings → Customer notifications**.",
            "Turn on **Send** for each notification you want to use.",
            "If you like, edit the **Message in Spanish** and the **Message in English**. You can use {tienda}, {nombre}, {numero}, {fecha} and {enlace}.",
            "Tap **Send a test** with your own mobile number to see how it arrives.",
          ],
        },
        {
          t: "p",
          texto:
            "Each customer gets the message in their language. Reminder frequency and the maximum number of reminders are set in **Settings → Your store**.",
        },
        { t: "h2", texto: "Customer consent" },
        {
          t: "p",
          texto:
            "Texts only go to customers with **Agrees to text messages about their orders** checked. Ask them before you check it. If a customer replies STOP, they stop receiving messages.",
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Business text messaging is regulated in the United States. Use notifications only to update customers about their orders, never for marketing.",
        },
        { t: "h2", texto: "If a notification doesn’t arrive" },
        {
          t: "p",
          texto:
            "**Recent notifications** lists every message with its result: **Sent**, **Failed**, **Skipped** or **Pending**. Skipped means the channel isn’t set up yet or the customer didn’t agree to messages. If the SMS channel shows **Not set up**, contact support.",
        },
      ],
    },
  },
  {
    slug: "recibo-por-correo",
    seccion: "clientes",
    icono: "mensaje",
    es: {
      titulo: "El recibo digital por correo",
      resumen:
        "Al crear la orden, al cliente le llega su recibo por correo. Cómo funciona, cómo reenviarlo y qué revisar si no llega.",
      bloques: [
        {
          t: "p",
          texto:
            "Cuando creas una orden, Tintora POS le manda al cliente **su recibo por correo**, solo: las prendas, el total, lo que pagó, el saldo, cuándo estará lista y un botón para ver el estado de su orden. Es el mismo recibo que sale en papel. Viene **encendido de fábrica** y no cuesta nada.",
        },
        { t: "captura", captura: "reciboCorreo" },
        { t: "h2", texto: "Lo único que hace falta: el correo del cliente" },
        {
          t: "pasos",
          items: [
            "Al crear el cliente (o en su ficha, en **Clientes**), escribe su **correo**. Al escribirlo se marca sola la casilla de que acepta recibir correos.",
            "Crea la orden como siempre. El recibo sale en ese momento.",
            "Si el cliente no tiene correo, el mostrador te lo avisa debajo de su nombre: *Sin correo en su ficha: no le llegará el recibo digital*.",
          ],
        },
        {
          t: "p",
          texto:
            "El cliente ve el correo **a nombre de tu tienda**, y si responde, la respuesta te llega al correo que pusiste en **Ajustes → Tu tienda**.",
        },
        { t: "h2", texto: "Reenviarlo" },
        {
          t: "pasos",
          items: [
            "Abre la orden.",
            "Toca los **tres puntos** de arriba a la derecha y elige **Enviar recibo por correo**.",
            "En pantalla te dice si salió. Se manda al correo que el cliente tiene en su ficha.",
          ],
        },
        { t: "h2", texto: "Saber si le llegó" },
        {
          t: "p",
          texto:
            "Dentro de la orden, debajo del nombre del cliente, está la línea **Recibo por correo**: *Enviado a…*, *Saliendo hacia…*, *No se pudo enviar…* (con el motivo) o *Este cliente no tiene correo*. El historial completo está en **Ajustes → Avisos a clientes → Últimos avisos**.",
        },
        { t: "h2", texto: "Si no le llega" },
        {
          t: "lista",
          items: [
            "**La orden dice que el cliente no tiene correo:** agrégalo en su ficha y reenvía el recibo.",
            "**Dice *Enviado* y el cliente no lo ve:** que revise **Spam** o **Promociones**, y que el correo esté bien escrito (un punto o una letra de más y se va a otra persona).",
            "**Dice *No se pudo enviar*:** al lado sale el motivo. Si habla de *rebote*, esa dirección no existe o está llena.",
            "**Dice que el correo de la plataforma no está configurado:** escríbenos desde [Contacto](/contacto).",
          ],
        },
        { t: "h2", texto: "Apagarlo" },
        {
          t: "p",
          texto:
            "En **Ajustes → Avisos a clientes**, quita la palomita de **Recibo digital por correo** y guarda. Aun apagado, puedes mandarlo a pedido desde la orden.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "El recibo digital va aparte de los [avisos por SMS](/docs/avisos): el aviso de *orden recibida* viene apagado porque los SMS tienen costo; el recibo por correo no.",
        },
      ],
    },
    en: {
      titulo: "The digital receipt by email",
      resumen:
        "When you create an order, the customer gets their receipt by email. How it works, how to resend it and what to check if it doesn’t arrive.",
      bloques: [
        {
          t: "p",
          texto:
            "When you create an order, Tintora POS emails the customer **their receipt**, automatically: the items, the total, what they paid, the balance, when it will be ready and a button to check the order status. It’s the same receipt that prints on paper. It’s **on by default** and costs nothing.",
        },
        { t: "captura", captura: "reciboCorreo" },
        { t: "h2", texto: "All it needs: the customer’s email" },
        {
          t: "pasos",
          items: [
            "When you create the customer (or on their profile, under **Customers**), enter their **email**. Typing it checks the box that says they agree to get emails.",
            "Create the order as usual. The receipt goes out right then.",
            "If the customer has no email, the counter tells you under their name: *No email on file: they won’t get the digital receipt*.",
          ],
        },
        {
          t: "p",
          texto:
            "The customer sees the email **under your store’s name**, and if they reply, the reply goes to the email you set under **Settings → Your store**.",
        },
        { t: "h2", texto: "Resend it" },
        {
          t: "pasos",
          items: [
            "Open the order.",
            "Tap the **three dots** at the top right and choose **Email the receipt**.",
            "The screen tells you whether it went out. It goes to the email on the customer’s profile.",
          ],
        },
        { t: "h2", texto: "Know whether it arrived" },
        {
          t: "p",
          texto:
            "Inside the order, under the customer’s name, there’s a **Receipt by email** line: *Sent to…*, *On its way to…*, *Couldn’t send…* (with the reason) or *This customer has no email*. The full history is under **Settings → Customer notifications → Recent notifications**.",
        },
        { t: "h2", texto: "If it doesn’t arrive" },
        {
          t: "lista",
          items: [
            "**The order says the customer has no email:** add it to their profile and resend the receipt.",
            "**It says *Sent* and the customer can’t find it:** have them check **Spam** or **Promotions**, and make sure the address is spelled right (one extra dot or letter sends it to someone else).",
            "**It says *Couldn’t send*:** the reason is right next to it. If it mentions a *bounce*, that address doesn’t exist or the mailbox is full.",
            "**It says the platform’s email isn’t set up:** reach us through [Contact](/contacto).",
          ],
        },
        { t: "h2", texto: "Turn it off" },
        {
          t: "p",
          texto:
            "Under **Settings → Customer notifications**, uncheck **Digital receipt by email** and save. Even when it’s off, you can still send it on request from the order.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "The digital receipt is separate from [text notifications](/docs/avisos): the *order received* notification ships turned off because texts cost money; the emailed receipt doesn’t.",
        },
      ],
    },
  },
  {
    slug: "pagina-del-cliente",
    seccion: "clientes",
    icono: "enlace",
    es: {
      titulo: "La página de estado para tus clientes",
      resumen:
        "Cada orden tiene su propio enlace para que el cliente vea si su ropa está lista, sin crear una cuenta.",
      bloques: [
        {
          t: "p",
          texto:
            "Cada orden tiene una página pública con un código difícil de adivinar. El cliente llega a ella desde el enlace del SMS o escaneando el código QR de su recibo.",
        },
        { t: "figura", figura: "paginaCliente", pie: "La página de estado en el celular del cliente." },
        { t: "h2", texto: "Qué ve el cliente" },
        {
          t: "lista",
          items: [
            "El nombre de tu tienda, su nombre y el número de su orden.",
            "En qué paso va: **Recibida**, **En proceso**, **Lista para recoger** o **Entregada**.",
            "Cuántas prendas están listas y para cuándo está prometida.",
            "Si tiene un saldo pendiente, y un botón para llamar a la tienda.",
          ],
        },
        { t: "h2", texto: "Qué no ve" },
        {
          t: "p",
          texto:
            "La página no muestra el teléfono, la dirección ni los montos de la orden, y no permite cambiar nada. Si alguien consulta demasiadas veces seguidas, se le pide esperar un minuto.",
        },
      ],
    },
    en: {
      titulo: "The customer status page",
      resumen:
        "Every order has its own link where the customer can check if their clothes are ready, no account needed.",
      bloques: [
        {
          t: "p",
          texto:
            "Each order has a public page with a hard-to-guess code. Customers reach it from the link in their text message or by scanning the QR code on their receipt.",
        },
        { t: "figura", figura: "paginaCliente", pie: "The status page on the customer’s phone." },
        { t: "h2", texto: "What the customer sees" },
        {
          t: "lista",
          items: [
            "Your store name, their name and their order number.",
            "Where the order stands: **Received**, **In process**, **Ready for pickup** or **Picked up**.",
            "How many items are ready and when the order is due.",
            "Whether they have a balance due, plus a button to call the store.",
          ],
        },
        { t: "h2", texto: "What they don’t see" },
        {
          t: "p",
          texto:
            "The page doesn’t show phone numbers, addresses or order amounts, and nothing can be changed from it. If someone checks too many times in a row, they’re asked to wait a minute.",
        },
      ],
    },
  },
];

export const GUIAS_SEGURIDAD: Guia[] = [
  {
    slug: "dos-pasos",
    seccion: "seguridad",
    icono: "llave",
    es: {
      titulo: "Verificación en dos pasos",
      resumen: "Protege tu cuenta con un código de tu celular además de la contraseña.",
      bloques: [
        {
          t: "p",
          texto:
            "La cuenta del dueño puede exportar todos los datos y cambiar cualquier ajuste. Por eso la verificación en dos pasos es obligatoria para el dueño, y los gerentes que entran con correo también pueden activarla.",
        },
        { t: "h2", texto: "Activarla" },
        {
          t: "pasos",
          items: [
            "Instala en tu celular una app autenticadora, como Google Authenticator, Microsoft Authenticator o 1Password.",
            "Tintora POS te muestra un código QR. Escanéalo con la app. Si no puedes, escribe en la app la clave que aparece debajo.",
            "Escribe el **Código de 6 números** que muestra la app.",
            "Guarda los 10 códigos de respaldo en un lugar seguro, fuera del celular.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Cada código de respaldo sirve una sola vez. Úsalos si pierdes el celular: en la pantalla del código, toca **Usar un código de respaldo**.",
        },
        { t: "h2", texto: "Al entrar" },
        {
          t: "p",
          texto:
            "Después de la contraseña, escribe el código de 6 números de la app. El código cambia cada 30 segundos.",
        },
        { t: "h2", texto: "Si te quedan pocos códigos de respaldo" },
        {
          t: "pasos",
          items: [
            "Entra a **Ajustes → Seguridad**.",
            "En **Generar códigos de respaldo nuevos**, escribe el código actual de tu app.",
            "Toca **Generar** y guarda los nuevos. Los anteriores dejan de servir.",
          ],
        },
        { t: "h2", texto: "Si olvidaste la contraseña" },
        {
          t: "p",
          texto:
            "En la pantalla de entrar, toca **¿Olvidaste tu contraseña?** y escribe tu correo. Te llega un enlace para crear una nueva. Después se te sigue pidiendo el código de tu app.",
        },
      ],
    },
    en: {
      titulo: "Two-step verification",
      resumen: "Protect your account with a code from your phone in addition to your password.",
      bloques: [
        {
          t: "p",
          texto:
            "The owner account can export all data and change any setting. That’s why two-step verification is required for owners, and managers who sign in with email can turn it on too.",
        },
        { t: "h2", texto: "Turn it on" },
        {
          t: "pasos",
          items: [
            "Install an authenticator app on your phone, such as Google Authenticator, Microsoft Authenticator or 1Password.",
            "Tintora POS shows you a QR code. Scan it with the app. If you can’t, type the key shown below it into the app.",
            "Enter the **6-digit code** the app displays.",
            "Save the 10 backup codes somewhere safe, away from your phone.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Each backup code works only once. Use them if you lose your phone: on the code screen, tap **Use a backup code**.",
        },
        { t: "h2", texto: "When you sign in" },
        {
          t: "p",
          texto:
            "After your password, enter the 6-digit code from the app. The code changes every 30 seconds.",
        },
        { t: "h2", texto: "Running low on backup codes" },
        {
          t: "pasos",
          items: [
            "Go to **Settings → Security**.",
            "Under **Generate new backup codes**, enter the current code from your app.",
            "Tap **Generate** and save the new codes. The old ones stop working.",
          ],
        },
        { t: "h2", texto: "Forgot your password" },
        {
          t: "p",
          texto:
            "On the sign-in screen, tap **Forgot your password?** and enter your email. You’ll get a link to create a new one. You’ll still be asked for the code from your app.",
        },
      ],
    },
  },
  {
    slug: "exportar",
    seccion: "seguridad",
    icono: "descarga",
    es: {
      titulo: "Exportar tus datos",
      resumen: "Descarga tus clientes, órdenes y pagos cuando quieras. Tus datos son tuyos.",
      bloques: [
        {
          t: "p",
          texto:
            "Solo el dueño puede exportar, porque los archivos tienen los datos personales de tus clientes.",
        },
        {
          t: "pasos",
          items: [
            "Entra a **Ajustes → Tus datos**.",
            "Elige qué descargar: **Clientes (CSV)**, **Órdenes (CSV)**, **Pagos (CSV)** o **Todo (JSON)**.",
          ],
        },
        {
          t: "lista",
          items: [
            "Los CSV se abren en Excel, Numbers o Google Sheets.",
            "El JSON es la copia completa de tu tintorería, útil para llevar tus datos a otro sistema.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Los archivos nunca incluyen contraseñas, PIN ni códigos de seguridad. Aun así, guárdalos en un lugar protegido: tienen los teléfonos y correos de tus clientes.",
        },
        { t: "p", texto: "Cada exportación queda en el registro de actividad." },
      ],
    },
    en: {
      titulo: "Export your data",
      resumen: "Download your customers, orders and payments whenever you want. Your data is yours.",
      bloques: [
        {
          t: "p",
          texto: "Only the owner can export, because the files contain your customers’ personal information.",
        },
        {
          t: "pasos",
          items: [
            "Go to **Settings → Your data**.",
            "Choose what to download: **Customers (CSV)**, **Orders (CSV)**, **Payments (CSV)** or **Everything (JSON)**.",
          ],
        },
        {
          t: "lista",
          items: [
            "CSV files open in Excel, Numbers or Google Sheets.",
            "The JSON file is a complete copy of your store’s data, useful for moving to another system.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Exports never include passwords, PINs or security codes. Still, keep the files somewhere secure: they contain your customers’ phone numbers and emails.",
        },
        { t: "p", texto: "Every export is recorded in the activity log." },
      ],
    },
  },
  {
    slug: "respaldos",
    seccion: "seguridad",
    icono: "respaldo",
    es: {
      titulo: "Respaldos diarios",
      resumen: "Cada día se guarda una copia cifrada de toda tu tintorería, y se conserva durante 30 días.",
      bloques: [
        {
          t: "p",
          texto:
            "No tienes que hacer nada: todos los días se crea sola una copia cifrada de toda la información de tu tintorería.",
        },
        {
          t: "lista",
          items: [
            "Se conservan los últimos 30 días.",
            "Están cifradas: sin la clave del sistema, nadie puede leerlas.",
            "Se suman a la protección propia de la plataforma donde funciona Tintora POS.",
          ],
        },
        { t: "h2", texto: "Ver tus respaldos" },
        {
          t: "p",
          texto:
            "En **Ajustes → Tus datos → Respaldos automáticos** ves la fecha y la cantidad de registros de cada copia. El primer respaldo se hace durante las primeras 24 horas.",
        },
        { t: "h2", texto: "Recuperar información" },
        {
          t: "p",
          texto:
            "Si borraste algo por error o necesitas volver a un día anterior, escribe a soporte con la fecha. Restauramos la información desde el respaldo de ese día.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Además de los respaldos, descarga tus datos de vez en cuando. Mira [Exportar tus datos](/docs/exportar).",
        },
      ],
    },
    en: {
      titulo: "Daily backups",
      resumen: "Every day, an encrypted copy of your entire store is saved and kept for 30 days.",
      bloques: [
        {
          t: "p",
          texto:
            "There’s nothing to do: every day, an encrypted copy of all your store’s information is created automatically.",
        },
        {
          t: "lista",
          items: [
            "The last 30 days are kept.",
            "Backups are encrypted, so nobody can read them without the system key.",
            "They’re in addition to the built-in protection of the platform Tintora POS runs on.",
          ],
        },
        { t: "h2", texto: "See your backups" },
        {
          t: "p",
          texto:
            "Under **Settings → Your data → Automatic backups** you’ll see the date and record count of each copy. The first backup runs within the first 24 hours.",
        },
        { t: "h2", texto: "Restoring information" },
        {
          t: "p",
          texto:
            "If you deleted something by mistake or need to go back to an earlier day, contact support with the date. We’ll restore the information from that day’s backup.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Besides backups, download your data from time to time. See [Export your data](/docs/exportar).",
        },
      ],
    },
  },
];
