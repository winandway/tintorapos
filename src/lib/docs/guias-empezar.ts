import type { Guia } from "./tipos";

export const GUIAS_EMPEZAR: Guia[] = [
  {
    slug: "primeros-pasos",
    seccion: "empezar",
    icono: "cohete",
    es: {
      titulo: "Primeros pasos",
      resumen:
        "Deja tu tintorería lista para atender en una tarde: datos de la tienda, precios, empleados, la tablet y la primera orden.",
      bloques: [
        {
          t: "p",
          texto:
            "Al crear tu cuenta, Tintora POS ya trae las prendas y los servicios más comunes de una tintorería, sin precios. En la pantalla de **Inicio** verás la lista de **Primeros pasos**, y cada punto se marca solo cuando lo completas.",
        },
        { t: "figura", figura: "primerosPasos", pie: "La lista de primeros pasos en la pantalla de Inicio." },
        { t: "h2", texto: "Datos de tu tienda" },
        {
          t: "pasos",
          items: [
            "Entra a **Ajustes → Tu tienda**.",
            "Escribe la dirección y el teléfono: salen en el recibo del cliente.",
            "Pon el **Impuesto sobre servicios (%)** si en tu estado o ciudad se cobra. Si no aplica, déjalo en 0.",
            "Revisa los **Días hábiles para entregar**: con ese número se propone la fecha de entrega de cada orden.",
            "Toca **Guardar cambios**.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Las reglas de impuestos cambian por estado y ciudad. Confirma el porcentaje con tu contador.",
        },
        { t: "h2", texto: "Tus precios" },
        {
          t: "pasos",
          items: [
            "Entra a **Ajustes → Prendas y precios**.",
            "Escribe el precio de cada prenda en cada servicio. Lo que dejes vacío se escribe a mano en el mostrador.",
            "Para el lavado por libra, llena el **Precio por libra**.",
            "Toca **Guardar precios**.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "¿Te falta una prenda o un servicio? Usa **Agregar prenda** o **Agregar servicio** y escribe el nombre en español y en inglés.",
        },
        { t: "h2", texto: "Tus empleados" },
        {
          t: "pasos",
          items: [
            "Entra a **Ajustes → Empleados** y toca **Agregar empleado**.",
            "Escribe su nombre, elige su rol y dale un PIN de 4 a 6 números.",
            "Repite con cada persona. Los roles se explican en [Roles y autorizaciones](/docs/autorizaciones).",
          ],
        },
        { t: "h2", texto: "La tablet del mostrador" },
        {
          t: "p",
          texto:
            "Tus empleados entran con su PIN solo en dispositivos registrados. Sigue la guía [Registrar la tablet del mostrador](/docs/dispositivos).",
        },
        { t: "h2", texto: "Tu primera orden" },
        {
          t: "p",
          texto:
            "Toca **Nueva orden**, elige al cliente, agrega las prendas y crea la orden. La guía [Recibir ropa](/docs/recibir-ropa) lo explica paso a paso.",
        },
      ],
    },
    en: {
      titulo: "Getting started",
      resumen:
        "Get your store ready in an afternoon: store details, prices, employees, the counter tablet and your first order.",
      bloques: [
        {
          t: "p",
          texto:
            "When you create your account, Tintora POS comes preloaded with the most common dry cleaning garments and services, without prices. The **Home** screen shows a **Getting started** checklist, and each item checks itself off once you complete it.",
        },
        { t: "figura", figura: "primerosPasos", pie: "The Getting started checklist on the Home screen." },
        { t: "h2", texto: "Your store details" },
        {
          t: "pasos",
          items: [
            "Go to **Settings → Your store**.",
            "Enter your address and phone number. They appear on the customer receipt.",
            "Set the **Sales tax on services (%)** if your state or city charges it. If not, leave it at 0.",
            "Check the **Business days to have orders ready**. That number sets the suggested due date for each order.",
            "Tap **Save changes**.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto: "Sales tax rules vary by state and city. Confirm the rate with your accountant.",
        },
        { t: "h2", texto: "Your prices" },
        {
          t: "pasos",
          items: [
            "Go to **Settings → Items & prices**.",
            "Enter the price of each garment for each service. Anything left blank can be typed in at the counter.",
            "For wash & fold, fill in the **Price per pound**.",
            "Tap **Save prices**.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Missing a garment or service? Use **Add item** or **Add service** and enter the name in both English and Spanish.",
        },
        { t: "h2", texto: "Your employees" },
        {
          t: "pasos",
          items: [
            "Go to **Settings → Employees** and tap **Add employee**.",
            "Enter their name, choose a role and give them a 4- to 6-digit PIN.",
            "Repeat for everyone on your team. Roles are explained in [Roles and manager approval](/docs/autorizaciones).",
          ],
        },
        { t: "h2", texto: "The counter tablet" },
        {
          t: "p",
          texto:
            "Employees can only sign in with their PIN on registered devices. Follow [Register the counter tablet](/docs/dispositivos).",
        },
        { t: "h2", texto: "Your first order" },
        {
          t: "p",
          texto:
            "Tap **New order**, choose the customer, add the items and create the order. [Taking in orders](/docs/recibir-ropa) walks you through it step by step.",
        },
      ],
    },
  },
  {
    slug: "dispositivos",
    seccion: "empezar",
    icono: "dispositivo",
    es: {
      titulo: "Registrar la tablet del mostrador",
      resumen:
        "Autoriza las tablets y los celulares de la tienda para que tus empleados entren con su PIN, y desactiva uno si se pierde.",
      bloques: [
        {
          t: "p",
          texto:
            "Por seguridad, los PIN de los empleados solo funcionan en dispositivos que registra el dueño o un gerente. Así, aunque alguien conozca un PIN, no puede usarlo desde su casa.",
        },
        { t: "h2", texto: "Registrar un dispositivo" },
        {
          t: "pasos",
          items: [
            "En la tablet de la tienda, abre el navegador y entra a Tintora POS con el correo y la contraseña del dueño o de un gerente.",
            "Ve a **Ajustes → Dispositivos**.",
            "Escribe un nombre que lo identifique, como «Tablet del mostrador».",
            "Toca **Registrar este dispositivo**.",
            "Toca **Ir a la pantalla de PIN**. Desde ahora, cada empleado toca su nombre y escribe su PIN.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Agrega Tintora POS a la pantalla de inicio de la tablet desde el menú del navegador («Agregar a la pantalla de inicio»). Se abre a pantalla completa, como una app.",
        },
        { t: "h2", texto: "La pantalla de PIN" },
        {
          t: "lista",
          items: [
            "Si alguien escribe mal su PIN 5 veces seguidas, su usuario se bloquea durante 15 minutos.",
            "La pantalla se bloquea sola después de los minutos sin uso que definas en **Ajustes → Tu tienda**.",
            "Al terminar su turno, cada persona puede tocar **Bloquear pantalla** en el menú de la cuenta.",
          ],
        },
        { t: "h2", texto: "Si se pierde o te roban un dispositivo" },
        {
          t: "pasos",
          items: [
            "Entra desde otro dispositivo a **Ajustes → Dispositivos**.",
            "Abre el menú de tres puntos del dispositivo perdido.",
            "Toca **Desactivar dispositivo** y confirma.",
          ],
        },
        {
          t: "p",
          texto: "Quien lo esté usando sale en el acto y ya no puede entrar con PIN en ese dispositivo.",
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Si crees que alguien vio los PIN de tus empleados, cámbialos también en **Ajustes → Empleados**.",
        },
      ],
    },
    en: {
      titulo: "Register the counter tablet",
      resumen:
        "Authorize your store’s tablets and phones so employees can sign in with their PIN, and turn one off if it’s lost.",
      bloques: [
        {
          t: "p",
          texto:
            "For security, employee PINs only work on devices registered by the owner or a manager. Even if someone learns a PIN, they can’t use it from home.",
        },
        { t: "h2", texto: "Register a device" },
        {
          t: "pasos",
          items: [
            "On the store tablet, open the browser and sign in to Tintora POS with the owner’s or a manager’s email and password.",
            "Go to **Settings → Devices**.",
            "Enter a name that identifies it, such as “Counter tablet.”",
            "Tap **Register this device**.",
            "Tap **Go to the PIN screen**. From now on, each employee taps their name and enters their PIN.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Add Tintora POS to the tablet’s home screen from the browser menu (“Add to Home Screen”). It opens full screen, just like an app.",
        },
        { t: "h2", texto: "The PIN screen" },
        {
          t: "lista",
          items: [
            "If someone enters the wrong PIN 5 times in a row, their user is locked for 15 minutes.",
            "The screen locks itself after the idle minutes you set in **Settings → Your store**.",
            "At the end of a shift, anyone can tap **Lock screen** in the account menu.",
          ],
        },
        { t: "h2", texto: "If a device is lost or stolen" },
        {
          t: "pasos",
          items: [
            "From another device, go to **Settings → Devices**.",
            "Open the three-dot menu for the lost device.",
            "Tap **Turn off device** and confirm.",
          ],
        },
        {
          t: "p",
          texto:
            "Whoever is using it is signed out immediately and can no longer sign in with a PIN on that device.",
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "If you think someone saw your employees’ PINs, change them too in **Settings → Employees**.",
        },
      ],
    },
  },
  {
    slug: "impresoras",
    seccion: "empezar",
    icono: "impresora",
    es: {
      titulo: "Impresoras de recibos y etiquetas",
      resumen: "Qué impresoras sirven, cómo configurar la impresión y cómo reimprimir.",
      bloques: [
        {
          t: "p",
          texto:
            "Tintora POS imprime desde el navegador, así que no hay programas que instalar. Sirve cualquier impresora que tu tablet o computadora ya reconozca.",
        },
        { t: "h2", texto: "Qué se imprime" },
        {
          t: "lista",
          items: [
            "**Recibo del cliente**: en rollo térmico de 80 mm, con las prendas, el total y un código QR para consultar el estado de la orden.",
            "**Etiquetas**: una por prenda, de 2 × 1 pulgadas (51 × 25 mm), con el número de la orden, la pieza y su código QR.",
            "**Copia interna**: el mismo recibo, marcado como copia de la tienda.",
          ],
        },
        { t: "figura", figura: "etiquetas", pie: "El recibo del cliente y la etiqueta de cada prenda." },
        { t: "h2", texto: "Configurar la impresión" },
        {
          t: "pasos",
          items: [
            "Crea una orden y toca **Imprimir recibo** o **Imprimir etiquetas**.",
            "En la ventana de impresión, elige la impresora correcta.",
            "Pon los márgenes en **Ninguno** y la escala en **100 %**.",
            "Desactiva los encabezados y pies de página del navegador.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto: "Chrome recuerda la última impresora que usaste, así que solo lo configuras la primera vez.",
        },
        { t: "h2", texto: "Según tu equipo" },
        {
          t: "lista",
          items: [
            "**iPad o iPhone**: la impresora tiene que ser compatible con AirPrint.",
            "**Tablet Android**: instala desde Google Play el complemento de impresión del fabricante de tu impresora.",
            "**Computadora con Windows o Mac**: instala el controlador de la impresora y úsala como cualquier otra.",
          ],
        },
        { t: "h2", texto: "Reimprimir" },
        {
          t: "p",
          texto:
            "Desde el detalle de la orden puedes volver a imprimir. El recibo se reimprime libremente durante los primeros 15 minutos; después pide la autorización de un gerente, para evitar recibos duplicados. Las etiquetas se reimprimen sin autorización. Cada reimpresión queda registrada.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Sin conexión también puedes imprimir las etiquetas: se generan en el mismo dispositivo. Mira [Trabajar sin conexión](/docs/sin-conexion).",
        },
      ],
    },
    en: {
      titulo: "Receipt and tag printers",
      resumen: "Which printers work, how to set up printing and how to reprint.",
      bloques: [
        {
          t: "p",
          texto:
            "Tintora POS prints straight from the browser, so there’s no software to install. Any printer your tablet or computer already recognizes will work.",
        },
        { t: "h2", texto: "What gets printed" },
        {
          t: "lista",
          items: [
            "**Customer receipt**: on 80 mm thermal paper, with the items, the total and a QR code to check the order status.",
            "**Tags**: one per garment, 2 × 1 inches (51 × 25 mm), with the order number, the item number and its QR code.",
            "**Store copy**: the same receipt, marked as the store’s copy.",
          ],
        },
        { t: "figura", figura: "etiquetas", pie: "The customer receipt and a tag for each garment." },
        { t: "h2", texto: "Set up printing" },
        {
          t: "pasos",
          items: [
            "Create an order and tap **Print receipt** or **Print tags**.",
            "In the print dialog, choose the right printer.",
            "Set margins to **None** and scale to **100%**.",
            "Turn off the browser’s headers and footers.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto: "Chrome remembers the last printer you used, so you only need to set this up once.",
        },
        { t: "h2", texto: "Depending on your device" },
        {
          t: "lista",
          items: [
            "**iPad or iPhone**: the printer must support AirPrint.",
            "**Android tablet**: install your printer manufacturer’s print service plugin from Google Play.",
            "**Windows or Mac computer**: install the printer driver and use it like any other printer.",
          ],
        },
        { t: "h2", texto: "Reprinting" },
        {
          t: "p",
          texto:
            "You can reprint from the order details. Receipts can be reprinted freely for the first 15 minutes; after that, a manager has to approve it to prevent duplicate receipts. Tags can be reprinted without approval. Every reprint is logged.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "You can print tags even while offline: they’re generated right on the device. See [Working offline](/docs/sin-conexion).",
        },
      ],
    },
  },
];
