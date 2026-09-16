import type { Guia } from "./tipos";

export const GUIAS_OPERACION: Guia[] = [
  {
    slug: "produccion",
    seccion: "planta",
    icono: "escaner",
    es: {
      titulo: "Producción con escáner",
      resumen:
        "Marca lo que entra a proceso y lo que queda listo escaneando las etiquetas con la cámara o con un lector.",
      bloques: [
        {
          t: "p",
          texto:
            "La pantalla **Producción** muestra las órdenes en tres columnas: **Recibidas**, **En proceso** y **Listas**.",
        },
        { t: "figura", figura: "estados", pie: "El recorrido de una orden." },
        { t: "h2", texto: "Escanear" },
        {
          t: "pasos",
          items: [
            "Toca **Producción**.",
            "Escanea la etiqueta de una prenda con un lector de códigos, o toca **Usar la cámara** y apunta al código QR.",
            "Si no tienes la etiqueta a mano, escribe el número de la orden.",
            "Elige si mueves **Esta pieza** o **Toda la orden**, y a qué estado.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Activa **Marcar como lista al escanear** cuando estés sacando ropa terminada: cada escaneo la marca como lista sin tocar nada más.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto: "Un lector de códigos USB o Bluetooth funciona como un teclado: no hay que configurar nada.",
        },
        { t: "h2", texto: "Ubicación en el rack" },
        {
          t: "p",
          texto:
            "Cuando una orden queda lista, anota su **Ubicación en el rack**, por ejemplo B-12. Al entregar, la pantalla le dice al cajero dónde buscarla.",
        },
        { t: "h2", texto: "Cuándo se avisa al cliente" },
        {
          t: "p",
          texto:
            "Cuando la última pieza de la orden queda lista, sale el aviso de **Orden lista**, siempre que el cliente haya aceptado mensajes y el aviso esté activo. Mira [Avisos por SMS](/docs/avisos).",
        },
        {
          t: "p",
          texto: "Los empleados con rol **Planta** solo trabajan en esta pantalla y no ven montos.",
        },
      ],
    },
    en: {
      titulo: "Production with a scanner",
      resumen:
        "Mark what goes into process and what’s ready by scanning tags with a camera or a barcode scanner.",
      bloques: [
        {
          t: "p",
          texto:
            "The **Production** screen shows orders in three columns: **Received**, **In process** and **Ready**.",
        },
        { t: "figura", figura: "estados", pie: "An order’s journey." },
        { t: "h2", texto: "Scanning" },
        {
          t: "pasos",
          items: [
            "Tap **Production**.",
            "Scan a garment tag with a barcode scanner, or tap **Use camera** and point it at the QR code.",
            "If the tag isn’t handy, type the order number.",
            "Choose whether to move **This item** or the **Whole order**, and to which status.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Turn on **Mark as ready when scanned** when you’re pulling finished clothes: every scan marks the item ready with no extra taps.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto: "A USB or Bluetooth barcode scanner works like a keyboard, so there’s nothing to set up.",
        },
        { t: "h2", texto: "Rack location" },
        {
          t: "p",
          texto:
            "When an order is ready, enter its **Rack location**, such as B-12. At pickup, the screen tells the cashier where to look.",
        },
        { t: "h2", texto: "When the customer is notified" },
        {
          t: "p",
          texto:
            "When the last item in an order is ready, the **Order ready** notification goes out, as long as the customer agreed to messages and the notification is turned on. See [Text notifications](/docs/avisos).",
        },
        {
          t: "p",
          texto: "Employees with the **Production** role only work on this screen and don’t see amounts.",
        },
      ],
    },
  },
  {
    slug: "caja",
    seccion: "dinero",
    icono: "caja",
    es: {
      titulo: "Caja y cierre",
      resumen:
        "Abre la caja con el fondo inicial, registra entradas y salidas, y ciérrala con un conteo a ciegas.",
      bloques: [
        { t: "h2", texto: "Abrir la caja" },
        {
          t: "pasos",
          items: [
            "Al empezar el turno, toca **Caja**.",
            "Cuenta el dinero del cajón y escríbelo en **Dinero inicial en el cajón**.",
            "Toca **Abrir caja**.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto: "Sin caja abierta no se puede cobrar en efectivo en el mostrador.",
        },
        { t: "h2", texto: "Durante el día" },
        {
          t: "p",
          texto:
            "La pantalla muestra lo cobrado en efectivo, con tarjeta y con otros métodos, y el **Efectivo esperado en el cajón**.",
        },
        {
          t: "lista",
          items: [
            "**Entrada de dinero**: cuando agregas cambio al cajón.",
            "**Salida de dinero**: cuando sacas efectivo para un gasto, con su motivo.",
            "**Abrir cajón sin venta**: queda registrado quién lo abrió y por qué.",
          ],
        },
        {
          t: "p",
          texto:
            "Si un cajero hace cualquiera de estos tres movimientos, se pide la autorización de un gerente.",
        },
        { t: "h2", texto: "Cerrar la caja: cierre a ciegas" },
        {
          t: "pasos",
          items: [
            "Toca **Cerrar caja**.",
            "Cuenta los billetes y las monedas del cajón.",
            "Escribe el total en **Efectivo contado** y agrega notas si hace falta.",
            "Confirma el cierre.",
          ],
        },
        { t: "figura", figura: "cierreCaja", pie: "Al cerrar se cuenta primero, sin ver lo esperado." },
        {
          t: "p",
          texto:
            "El sistema no muestra cuánto debería haber antes de contar, para que el conteo sea honesto. Los gerentes y el dueño ven el resultado de cada cierre (**Sobran**, **Faltan** o **Cuadra exacto**) en **Cierres anteriores**.",
        },
      ],
    },
    en: {
      titulo: "Cash register and closing",
      resumen: "Open the register with starting cash, log cash in and out, and close with a blind count.",
      bloques: [
        { t: "h2", texto: "Open the register" },
        {
          t: "pasos",
          items: [
            "At the start of the shift, tap **Register**.",
            "Count the money in the drawer and enter it under **Starting cash in the drawer**.",
            "Tap **Open register**.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto: "You can’t take cash at the counter until the register is open.",
        },
        { t: "h2", texto: "During the day" },
        {
          t: "p",
          texto:
            "The screen shows what was collected in cash, by card and by other methods, plus the **Expected cash in drawer**.",
        },
        {
          t: "lista",
          items: [
            "**Cash in**: when you add change to the drawer.",
            "**Cash out**: when you take cash out for an expense, with a reason.",
            "**Open drawer (no sale)**: the system records who opened it and why.",
          ],
        },
        {
          t: "p",
          texto: "If a cashier does any of these three, a manager has to approve it.",
        },
        { t: "h2", texto: "Close the register: blind count" },
        {
          t: "pasos",
          items: [
            "Tap **Close register**.",
            "Count the bills and coins in the drawer.",
            "Enter the total under **Counted cash** and add notes if needed.",
            "Confirm the close.",
          ],
        },
        {
          t: "figura",
          figura: "cierreCaja",
          pie: "At closing, you count first without seeing the expected amount.",
        },
        {
          t: "p",
          texto:
            "The system doesn’t show the expected amount before you count, so the count stays honest. Managers and the owner see each result (**Over by**, **Short by** or **Balanced**) under **Past closings**.",
        },
      ],
    },
  },
  {
    slug: "autorizaciones",
    seccion: "dinero",
    icono: "pin",
    es: {
      titulo: "Roles y autorizaciones",
      resumen:
        "Qué puede hacer cada rol y cómo un gerente aprueba con su PIN lo que otro empleado no puede hacer solo.",
      bloques: [
        { t: "p", texto: "Cada empleado tiene un rol. El rol decide qué pantallas ve y qué puede hacer." },
        { t: "figura", figura: "roles", pie: "Qué puede hacer cada rol." },
        { t: "h2", texto: "Cuándo se pide autorización" },
        {
          t: "p",
          texto:
            "Si un empleado intenta algo que su rol no permite, aparece la ventana **Autorización de gerente**. Un gerente o el dueño toca su nombre y escribe su PIN, y la acción sigue.",
        },
        {
          t: "lista",
          items: [
            "Descuentos mayores al máximo definido en **Ajustes → Tu tienda**.",
            "Bajar el precio de una prenda por debajo del catálogo.",
            "Anular una orden o un pago.",
            "Marcar una orden como abandonada.",
            "Entradas y salidas de dinero, y abrir el cajón sin venta.",
            "Reimprimir un recibo después de los primeros 15 minutos.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Queda registrado quién hizo la acción y quién la autorizó. Lo ves en **Ajustes → Seguridad → Registro de actividad**, y no se puede editar ni borrar.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Para autorizar hace falta un PIN. Si el dueño también atiende en el mostrador, ponte un PIN en **Ajustes → Empleados**.",
        },
        {
          t: "p",
          texto:
            "Sin conexión no se pueden pedir autorizaciones: esas acciones esperan a que vuelva internet.",
        },
      ],
    },
    en: {
      titulo: "Roles and manager approval",
      resumen:
        "What each role can do, and how a manager approves with their PIN what another employee can’t do alone.",
      bloques: [
        {
          t: "p",
          texto: "Every employee has a role. The role decides which screens they see and what they can do.",
        },
        { t: "figura", figura: "roles", pie: "What each role can do." },
        { t: "h2", texto: "When approval is required" },
        {
          t: "p",
          texto:
            "If an employee tries something their role doesn’t allow, the **Manager approval** window appears. A manager or the owner taps their name and enters their PIN, and the action goes through.",
        },
        {
          t: "lista",
          items: [
            "Discounts above the maximum set in **Settings → Your store**.",
            "Lowering a garment’s price below the catalog price.",
            "Voiding an order or a payment.",
            "Marking an order as abandoned.",
            "Cash in, cash out, and opening the drawer with no sale.",
            "Reprinting a receipt after the first 15 minutes.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "The system records who performed the action and who approved it. You’ll find it in **Settings → Security → Activity log**, and it can’t be edited or deleted.",
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Approving requires a PIN. If the owner also works the counter, set yourself a PIN in **Settings → Employees**.",
        },
        {
          t: "p",
          texto: "Approvals aren’t available offline, so those actions wait until you’re back online.",
        },
      ],
    },
  },
  {
    slug: "reportes",
    seccion: "dinero",
    icono: "grafica",
    es: {
      titulo: "Reportes",
      resumen: "Cuánto cobraste, cómo te pagaron, qué servicios vendes más y qué órdenes necesitan atención.",
      bloques: [
        {
          t: "pasos",
          items: [
            "Toca **Reportes**.",
            "Elige el período: **Hoy**, **Ayer**, **7 días**, **30 días** o **Este mes**, o fechas propias con **Desde** y **Hasta**.",
          ],
        },
        { t: "h2", texto: "Qué muestra" },
        {
          t: "lista",
          items: [
            "**Cobrado**: el dinero que entró en el período, según la fecha de cada pago.",
            "**Vendido**: el total de las órdenes recibidas en el período.",
            "**Órdenes**, **Ticket promedio**, **Descuentos** y **Anuladas**.",
            "**Cobrado por día** en una gráfica. Toca **Ver como tabla** para ver los números.",
            "**Por forma de pago**, **Por servicio** y **Por empleado**.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Cobrado y vendido no son lo mismo: una orden recibida hoy puede pagarse cuando la recojan la semana que viene.",
        },
        { t: "h2", texto: "Para atender hoy" },
        {
          t: "p",
          texto:
            "Esta sección junta las **Órdenes atrasadas**, las **Listas sin recoger** y las que **Pasaron los días de abandono**, para que llames a esos clientes a tiempo.",
        },
        { t: "h2", texto: "Descargar" },
        { t: "p", texto: "Toca **Descargar CSV** para abrir el reporte en Excel o en Google Sheets." },
      ],
    },
    en: {
      titulo: "Reports",
      resumen:
        "How much you collected, how customers paid, your top services and which orders need attention.",
      bloques: [
        {
          t: "pasos",
          items: [
            "Tap **Reports**.",
            "Pick a period: **Today**, **Yesterday**, **7 days**, **30 days** or **This month**, or set your own dates with **From** and **To**.",
          ],
        },
        { t: "h2", texto: "What you’ll see" },
        {
          t: "lista",
          items: [
            "**Collected**: the money that came in during the period, based on each payment’s date.",
            "**Sold**: the total of the orders taken in during the period.",
            "**Orders**, **Average ticket**, **Discounts** and **Voided**.",
            "**Collected per day** as a chart. Tap **View as table** to see the numbers.",
            "**By payment method**, **By service** and **By employee**.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Collected and sold aren’t the same: an order taken in today may be paid when it’s picked up next week.",
        },
        { t: "h2", texto: "Needs attention today" },
        {
          t: "p",
          texto:
            "This section groups **Late orders**, orders that are **Ready, not picked up** and those **Past the abandonment days**, so you can call those customers in time.",
        },
        { t: "h2", texto: "Download" },
        { t: "p", texto: "Tap **Download CSV** to open the report in Excel or Google Sheets." },
      ],
    },
  },
];
