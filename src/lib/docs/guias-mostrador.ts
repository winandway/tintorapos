import type { Guia } from "./tipos";

export const GUIAS_MOSTRADOR: Guia[] = [
  {
    slug: "recibir-ropa",
    seccion: "mostrador",
    icono: "mostrador",
    es: {
      titulo: "Recibir ropa (nueva orden)",
      resumen: "Crea una orden en tres pasos: cliente, prendas y cobro.",
      bloques: [
        {
          t: "p",
          texto: "Toca **Nueva orden**. La pantalla tiene tres pasos: **Cliente**, **Prendas** y **Cobro**.",
        },
        { t: "h2", texto: "Cliente" },
        {
          t: "pasos",
          items: [
            "Busca por celular o nombre.",
            "Si no aparece, toca **Cliente nuevo**, escribe su nombre y su celular, y elige su idioma.",
            "Marca **Acepta mensajes de texto sobre sus órdenes** solo si el cliente te dijo que sí.",
          ],
        },
        {
          t: "p",
          texto:
            "Si el cliente tiene órdenes abiertas o debe dinero de órdenes anteriores, lo verás en ese momento.",
        },
        { t: "h2", texto: "Prendas" },
        {
          t: "pasos",
          items: [
            "Toca una prenda dentro del servicio que corresponde. Cada toque suma una pieza.",
            "Para el lavado por peso, escribe los **Kilos** (o las **Libras**, según la unidad de tu tienda) y toca **Agregar**. Acepta decimales: 2.5 kilos.",
            "Si una prenda no tiene precio, escríbelo en ese momento.",
            "Abajo aparece la barra **Marcas de la prenda** con la última que tocaste: marca de un toque los **Daños** (botón roto, cuello roto…), las **Manchas** (vino, café, tinta…) y el **Color**. Cada toque va a ESA pieza, no a todas.",
            "Si necesitas escribir algo distinto, abre la prenda en la orden de la derecha y usa **Manchas o daños**, la **Marca** de la prenda y la foto.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto: "Anotar las manchas y los daños al recibir la ropa te protege de reclamos al entregarla.",
        },
        { t: "h2", texto: "Cobro" },
        {
          t: "pasos",
          items: [
            "Revisa la fecha de **Lista para**. Marca **Urgente** si el cliente la necesita antes: se suma el recargo de tu tienda.",
            "Si corresponde, aplica un **Descuento** con su motivo.",
            "Elige cómo paga: **Paga al recoger**, **Todo ahora** o un **Abono**.",
            "Si paga en efectivo, escribe lo **Recibido del cliente** y el sistema calcula el **Vuelto**.",
            "Toca **Crear orden**.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Un descuento mayor al máximo de tu tienda, o bajar el precio de una prenda del catálogo, pide la autorización de un gerente. Mira [Roles y autorizaciones](/docs/autorizaciones).",
        },
        {
          t: "p",
          texto:
            "Para cobrar en efectivo, la caja tiene que estar abierta. Mira [Caja y cierre](/docs/caja).",
        },
        { t: "h2", texto: "Después de crearla" },
        {
          t: "p",
          texto:
            "Imprime el recibo para el cliente y las etiquetas para las prendas. La guía [Etiquetas y recibos](/docs/etiquetas) explica cómo se usan.",
        },
      ],
    },
    en: {
      titulo: "Taking in orders",
      resumen: "Create an order in three steps: customer, items and payment.",
      bloques: [
        {
          t: "p",
          texto: "Tap **New order**. The screen has three steps: **Customer**, **Items** and **Payment**.",
        },
        { t: "h2", texto: "Customer" },
        {
          t: "pasos",
          items: [
            "Search by mobile number or name.",
            "If they don’t come up, tap **New customer**, enter their name and mobile number, and choose their language.",
            "Check **Agrees to text messages about their orders** only if the customer said yes.",
          ],
        },
        {
          t: "p",
          texto:
            "If the customer has open orders or owes money on previous orders, you’ll see it right away.",
        },
        { t: "h2", texto: "Items" },
        {
          t: "pasos",
          items: [
            "Tap a garment under the right service. Each tap adds one piece.",
            "For wash & fold, enter the **Pounds** (or **Kilos**, depending on your store's unit) and tap **Add**. Decimals are fine: 2.5 pounds.",
            "If a garment has no price, type it in on the spot.",
            "The **Item marks** bar at the bottom shows the last item you tapped: mark **Damage** (button broken, collar torn…), **Stains** (wine, coffee, ink…) and the **Color** with one tap. Each tap applies to THAT piece, not to all of them.",
            "If you need to write something else, open the item in the order on the right and use **Stains or damage**, the item **Brand** and the photo.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto: "Noting stains and damage at drop-off protects you from disputes at pickup.",
        },
        { t: "h2", texto: "Payment" },
        {
          t: "pasos",
          items: [
            "Check the **Ready by** date. Turn on **Rush** if the customer needs it sooner; your store’s surcharge is added.",
            "If it applies, add a **Discount** with its reason.",
            "Choose how they’re paying: **Pay at pickup**, **Pay in full** or a **Deposit**.",
            "For cash, enter the **Cash received** and the system calculates the **Change due**.",
            "Tap **Create order**.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "A discount above your store’s maximum, or lowering a garment’s catalog price, requires a manager’s approval. See [Roles and manager approval](/docs/autorizaciones).",
        },
        {
          t: "p",
          texto: "To take cash, the register must be open. See [Cash register and closing](/docs/caja).",
        },
        { t: "h2", texto: "After you create it" },
        {
          t: "p",
          texto:
            "Print the receipt for the customer and the tags for the garments. [Tags and receipts](/docs/etiquetas) explains how to use them.",
        },
      ],
    },
  },
  {
    slug: "etiquetas",
    seccion: "mostrador",
    icono: "etiqueta",
    es: {
      titulo: "Etiquetas y recibos",
      resumen: "Para qué sirven el recibo del cliente, la etiqueta de cada prenda y el color del ticket.",
      bloques: [
        {
          t: "p",
          texto:
            "Cada orden genera un recibo para el cliente y una etiqueta por cada pieza. Así cada prenda se puede rastrear sola, aunque se separe del resto de la orden.",
        },
        {
          t: "figura",
          figura: "etiquetas",
          pie: "El recibo lleva el código de la orden; cada etiqueta, el de su pieza.",
        },
        { t: "h2", texto: "La etiqueta de cada prenda" },
        {
          t: "pasos",
          items: [
            "Imprime las etiquetas al crear la orden.",
            "Pega o engrapa cada etiqueta en su prenda, en un lugar donde no se dañe durante el proceso.",
            "En la planta, escanea la etiqueta para mover esa pieza. Mira [Producción](/docs/produccion).",
          ],
        },
        {
          t: "p",
          texto:
            "Cada etiqueta dice **Pieza 1 de 3**, **Pieza 2 de 3** y así, para que nadie entregue una orden incompleta sin darse cuenta.",
        },
        { t: "h2", texto: "El recibo del cliente" },
        {
          t: "lista",
          items: [
            "Lleva las prendas, el total, lo pagado y el saldo.",
            "Tiene un código QR para que el cliente consulte si su orden ya está lista. Mira [La página de estado](/docs/pagina-del-cliente).",
            "Al recoger, escaneas el recibo y encuentras la orden en un segundo.",
          ],
        },
        { t: "h2", texto: "El color del ticket" },
        {
          t: "p",
          texto:
            "Como en las tintorerías de siempre, cada orden tiene el color del día en que entró. En las pantallas de órdenes, producción y entrega lo ves de un vistazo, y lo más antiguo salta a la vista.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "La **Copia interna** sirve si en tu tienda guardan un comprobante en papel junto a la ropa.",
        },
      ],
    },
    en: {
      titulo: "Tags and receipts",
      resumen: "What the customer receipt, the garment tags and the ticket color are for.",
      bloques: [
        {
          t: "p",
          texto:
            "Every order produces a receipt for the customer and one tag per piece. That way each garment can be tracked on its own, even if it gets separated from the rest of the order.",
        },
        {
          t: "figura",
          figura: "etiquetas",
          pie: "The receipt carries the order code; each tag carries its own item code.",
        },
        { t: "h2", texto: "The garment tag" },
        {
          t: "pasos",
          items: [
            "Print the tags when you create the order.",
            "Pin or staple each tag to its garment, somewhere it won’t get damaged during cleaning.",
            "In production, scan the tag to move that item. See [Production](/docs/produccion).",
          ],
        },
        {
          t: "p",
          texto:
            "Each tag reads **Item 1 of 3**, **Item 2 of 3** and so on, so nobody hands over an incomplete order by mistake.",
        },
        { t: "h2", texto: "The customer receipt" },
        {
          t: "lista",
          items: [
            "It lists the items, the total, the amount paid and the balance due.",
            "It has a QR code so the customer can check whether the order is ready. See [The status page](/docs/pagina-del-cliente).",
            "At pickup, scan the receipt to find the order in a second.",
          ],
        },
        { t: "h2", texto: "The ticket color" },
        {
          t: "p",
          texto:
            "Just like classic dry cleaning tickets, every order gets the color of the day it came in. You can spot it at a glance on the orders, production and pickup screens, so the oldest orders stand out.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto: "The **Store copy** is handy if your store keeps a paper slip with the clothes.",
        },
      ],
    },
  },
  {
    slug: "entrega-y-cobro",
    seccion: "mostrador",
    icono: "entrega",
    es: {
      titulo: "Entregar y cobrar",
      resumen: "Encuentra la orden, cobra el saldo y entrégala sin errores.",
      bloques: [
        {
          t: "pasos",
          items: [
            "Toca **Entregar**.",
            "Escanea el recibo del cliente o búscalo por celular, nombre o número de orden.",
            "Elige la orden que se lleva. Si tiene varias abiertas, las verás todas.",
            "Revisa dónde buscar la ropa: si en producción anotaron la ubicación en el rack, aparece aquí.",
            "Si hay saldo, elige el método de pago y toca el botón de cobrar y entregar, que muestra el monto. Si ya está pagada, toca **Entregar**.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Si alguna prenda todavía no está lista, la pantalla te avisa. Usa **Entregar igual** solo si el cliente decide llevársela así.",
        },
        { t: "h2", texto: "Métodos de pago" },
        {
          t: "lista",
          items: [
            "**Efectivo**: necesita la caja abierta y se suma al efectivo esperado del cierre. Si la caja está cerrada, al tocar entregar se abre ahí mismo (escribes el dinero inicial del cajón) y la entrega sigue; si no tienes permiso de abrir caja, te lo dice para que la abra un cajero o gerente, o cobras con tarjeta u otro.",
            "**Tarjeta**: cobras en tu terminal de siempre y aquí registras el pago, con los últimos 4 dígitos o el número de aprobación como referencia.",
            "**Otro**: transferencias, pagos por app u otros medios.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto: "Tintora POS no procesa tarjetas: registra el pago que ya cobraste en tu terminal.",
        },
        { t: "h2", texto: "Si te equivocaste" },
        {
          t: "p",
          texto:
            "Un pago mal registrado se anula desde el detalle de la orden: abre el menú de tres puntos y toca **Anular pago**. Si no eres gerente, se pide su autorización.",
        },
      ],
    },
    en: {
      titulo: "Pickup and payment",
      resumen: "Find the order, collect the balance and hand it over without mistakes.",
      bloques: [
        {
          t: "pasos",
          items: [
            "Tap **Pick up**.",
            "Scan the customer’s receipt or search by mobile number, name or order number.",
            "Choose the order being picked up. If they have several open orders, you’ll see them all.",
            "Check where to find the clothes: if production recorded a rack location, it shows up here.",
            "If there’s a balance, choose the payment method and tap the collect and hand over button, which shows the amount. If it’s already paid, tap **Hand over**.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "If any item isn’t ready yet, the screen warns you. Only use **Hand over anyway** if the customer chooses to take the order as is.",
        },
        { t: "h2", texto: "Payment methods" },
        {
          t: "lista",
          items: [
            "**Cash**: requires an open register and counts toward the expected cash at closing. If the register is closed, tapping hand over opens it right there (you enter the drawer's starting cash) and the pickup goes ahead; if you can't open the register, it tells you so a cashier or manager can open it, or you take card or other.",
            "**Card**: charge it on your usual terminal and record the payment here, with the last 4 digits or the approval number as the reference.",
            "**Other**: bank transfers, payment apps or any other method.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Tintora POS doesn’t process cards. It records the payment you already charged on your terminal.",
        },
        { t: "h2", texto: "If you made a mistake" },
        {
          t: "p",
          texto:
            "To undo a payment recorded by mistake, open the order details, tap the three-dot menu and choose **Void payment**. If you’re not a manager, a manager has to approve it.",
        },
      ],
    },
  },
  {
    slug: "sin-conexion",
    seccion: "mostrador",
    icono: "sinConexion",
    es: {
      titulo: "Trabajar sin conexión",
      resumen: "Qué puedes hacer cuando se cae el internet y cómo se suben los cambios cuando vuelve.",
      bloques: [
        {
          t: "p",
          texto:
            "Los dispositivos registrados guardan una copia de las órdenes abiertas y de tus clientes, y la actualizan cada pocos minutos. Si se cae el internet, el mostrador sigue.",
        },
        { t: "figura", figura: "conexion", pie: "El indicador de conexión, arriba de la pantalla." },
        { t: "h2", texto: "Qué puedes hacer sin conexión" },
        {
          t: "lista",
          items: [
            "Crear órdenes nuevas e imprimir sus etiquetas.",
            "Marcar prendas en producción.",
            "Entregar órdenes y registrar pagos, también en efectivo.",
            "Buscar los clientes y las órdenes guardados en el dispositivo.",
          ],
        },
        { t: "h2", texto: "Qué espera a que vuelva la conexión" },
        {
          t: "lista",
          items: [
            "Lo que necesita la autorización de un gerente, como un descuento grande o un precio rebajado.",
            "Los avisos por SMS: salen cuando el cambio llega al sistema.",
            "Los reportes, los ajustes y la apertura o el cierre de la caja.",
          ],
        },
        { t: "h2", texto: "Cuando vuelve internet" },
        {
          t: "p",
          texto:
            "Los cambios se suben solos, en el orden en que se hicieron y sin duplicados. El indicador muestra cuántos quedan por subir. Y suben en cuanto vuelve la conexión, no cada tanto: si el envío de un cambio se cae a mitad con internet, el sistema lo reintenta una vez y, si vuelve a fallar, lo guarda y lo sube solo enseguida.",
        },
        {
          t: "p",
          texto:
            "Si un cambio no se puede aplicar, por ejemplo porque otra persona ya entregó esa orden, aparece en **Cambios pendientes** para que lo revises. Ahí puedes tocar **Subir ahora**, o **Descartar** si ya lo registraste de otra forma.",
        },
        {
          t: "nota",
          tono: "importante",
          texto: "No borres los datos del navegador mientras haya cambios por subir: se perderían.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Si la sesión venció mientras no había internet, verás **Entra de nuevo para subir los cambios**. Entra con tu PIN y se suben solos.",
        },
      ],
    },
    en: {
      titulo: "Working offline",
      resumen: "What you can do when the internet goes down, and how changes upload once it’s back.",
      bloques: [
        {
          t: "p",
          texto:
            "Registered devices keep a copy of open orders and your customers, refreshed every few minutes. If the internet goes down, the counter keeps going.",
        },
        { t: "figura", figura: "conexion", pie: "The connection indicator at the top of the screen." },
        { t: "h2", texto: "What you can do offline" },
        {
          t: "lista",
          items: [
            "Create new orders and print their tags.",
            "Mark items in production.",
            "Hand over orders and record payments, including cash.",
            "Look up the customers and orders saved on the device.",
          ],
        },
        { t: "h2", texto: "What waits until you’re back online" },
        {
          t: "lista",
          items: [
            "Anything that needs a manager’s approval, like a large discount or a reduced price.",
            "Text notifications: they go out once the change reaches the system.",
            "Reports, settings, and opening or closing the register.",
          ],
        },
        { t: "h2", texto: "When the internet comes back" },
        {
          t: "p",
          texto:
            "Changes upload on their own, in the order they were made, with no duplicates. The indicator shows how many are left. And they upload as soon as the connection is back, not every so often: if sending a change fails halfway while online, the system retries once and, if it fails again, saves it and uploads it right away on its own.",
        },
        {
          t: "p",
          texto:
            "If a change can’t be applied, for example because someone else already handed over that order, it appears in **Pending changes** for you to review. There you can tap **Upload now**, or **Discard** if you already recorded it another way.",
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Don’t clear the browser’s data while there are changes waiting to upload, or they’ll be lost.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "If your session expired while offline, you’ll see **Sign in again to upload changes**. Sign in with your PIN and they’ll upload automatically.",
        },
      ],
    },
  },
];
