import type { IconoSitio } from "@/components/marca/iconos-sitio";
import type { Idioma } from "@/lib/i18n";

/**
 * Textos de la página principal. El tipo obliga a que español e inglés estén
 * completos y con la misma forma (si falta uno, no compila).
 */
export interface ContenidoInicio {
  meta: { titulo: string; descripcion: string };
  nav: { funciones: string; seguridad: string; preguntas: string };
  hero: {
    etiqueta: string;
    titulo: string;
    tituloResaltado: string;
    texto: string;
    cta: string;
    ctaSecundario: string;
    sellos: [string, string, string];
    dias: [string, string, string, string, string, string];
    lista: string;
    riel: string;
    smsDe: string;
    sms: string;
  };
  dolores: {
    titulo: string;
    antes: string;
    ahora: string;
    items: { antes: string; ahora: string }[];
  };
  flujo: { titulo: string; texto: string; pasos: { titulo: string; texto: string }[] };
  funciones: { titulo: string; items: { icono: IconoSitio; titulo: string; texto: string }[] };
  sinConexion: {
    titulo: string;
    texto: string;
    nota: string;
    estados: [string, string, string];
  };
  seguridad: {
    titulo: string;
    texto: string;
    items: { icono: IconoSitio; titulo: string; texto: string }[];
  };
  empezar: {
    titulo: string;
    pasos: { titulo: string; texto: string }[];
    banda: string;
    bandaTexto: string;
  };
  preguntas: { titulo: string; items: { p: string; r: string }[] };
}

const es: ContenidoInicio = {
  meta: {
    titulo: "Software para tintorerías y lavanderías | Tintora POS",
    descripcion:
      "Punto de venta en la nube para tintorerías y lavanderías: etiquetas con QR por prenda, avisos por SMS, caja y reportes. Funciona sin internet. Prueba 14 días gratis.",
  },
  nav: { funciones: "Funciones", seguridad: "Seguridad", preguntas: "Preguntas" },
  hero: {
    etiqueta: "Punto de venta para tintorerías y lavanderías",
    titulo: "Cada prenda en su lugar.",
    tituloResaltado: "Cada cliente avisado.",
    texto:
      "Recibe, etiqueta, procesa, avisa y cobra desde la tablet del mostrador. Tintora POS lleva el control de cada pieza y sigue funcionando aunque se caiga el internet.",
    cta: "Empieza gratis",
    ctaSecundario: "Ver cómo funciona",
    sellos: ["14 días gratis", "Sin tarjeta", "Español e inglés"],
    dias: ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"],
    lista: "LISTA",
    riel: "El color del ticket dice qué día entró la ropa.",
    smsDe: "Tu tintorería",
    sms: "Hola, tu orden #1043 ya está lista para recoger. Mira el estado aquí:",
  },
  dolores: {
    titulo: "Lo que deja de pasar en tu tienda",
    antes: "Antes",
    ahora: "Con Tintora POS",
    items: [
      {
        antes: "Una camisa se cruza de orden y nadie sabe dónde quedó.",
        ahora: "Cada prenda lleva su etiqueta con código QR y se escanea en cada paso.",
      },
      {
        antes: "El teléfono no para: «¿ya está lista mi ropa?».",
        ahora: "El cliente recibe un SMS cuando su orden está lista, con un enlace para ver el estado.",
      },
      {
        antes: "Al cerrar, la caja no cuadra y no sabes por qué.",
        ahora: "Cierre a ciegas: se cuenta el efectivo sin ver lo esperado y la diferencia queda registrada.",
      },
      {
        antes: "Descuentos y anulaciones que nadie autorizó.",
        ahora:
          "Lo delicado pide el PIN de un gerente, y cada acción queda en un historial que no se puede borrar.",
      },
      {
        antes: "Se cae el internet y se para el mostrador.",
        ahora:
          "Sigues recibiendo ropa, imprimiendo etiquetas y cobrando. Todo se sube solo cuando vuelve la conexión.",
      },
      {
        antes: "Ropa olvidada ocupando espacio durante meses.",
        ahora:
          "Recordatorios automáticos a quien no recoge y una lista clara de lo que lleva demasiado tiempo.",
      },
    ],
  },
  flujo: {
    titulo: "Una orden, de principio a fin",
    texto: "El mismo recorrido de siempre, sin papelitos perdidos ni llamadas.",
    pasos: [
      {
        titulo: "Recibir",
        texto:
          "Buscas al cliente o lo creas en segundos, eliges prendas y servicios con tus precios y fijas la fecha de entrega.",
      },
      {
        titulo: "Etiquetar",
        texto: "Imprimes el recibo del cliente y una etiqueta con código QR para cada prenda.",
      },
      {
        titulo: "Procesar",
        texto: "En la planta se escanea cada etiqueta para marcar lo que va quedando listo.",
      },
      {
        titulo: "Avisar",
        texto: "Cuando la última prenda queda lista, el cliente recibe su SMS.",
      },
      {
        titulo: "Entregar",
        texto: "Escaneas el recibo, cobras el saldo y la orden se cierra.",
      },
    ],
  },
  funciones: {
    titulo: "Todo lo que usa una tintorería, en un solo lugar",
    items: [
      {
        icono: "mostrador",
        titulo: "Mostrador rápido",
        texto:
          "Pensado para la tablet: botones grandes, búsqueda por teléfono o nombre y el total siempre a la vista.",
      },
      {
        icono: "precio",
        titulo: "Precios a tu manera",
        texto:
          "Por pieza o por peso (kilos o libras), con recargo por urgencia, descuentos e impuesto configurable.",
      },
      {
        icono: "escaner",
        titulo: "Producción por escaneo",
        texto: "La cámara del celular o un lector de códigos marca cada prenda sin escribir nada.",
      },
      {
        icono: "caja",
        titulo: "Caja y turnos",
        texto: "Apertura, entradas y salidas de efectivo, y cierre a ciegas con la diferencia registrada.",
      },
      {
        icono: "clientes",
        titulo: "Clientes",
        texto: "Historial de órdenes, saldo, preferencias de avisos e idioma de cada cliente.",
      },
      {
        icono: "mensaje",
        titulo: "Avisos por SMS",
        texto: "Orden lista y recordatorios de recogida, en el idioma del cliente y con tus propios textos.",
      },
      {
        icono: "enlace",
        titulo: "Página del cliente",
        texto: "Cada orden tiene su enlace para ver si ya está lista, sin crear una cuenta.",
      },
      {
        icono: "pin",
        titulo: "Empleados con PIN",
        texto:
          "Cada quien entra con su PIN y ve solo lo que su rol permite: dueño, gerente, cajero, planta o repartidor.",
      },
      {
        icono: "grafica",
        titulo: "Reportes",
        texto: "Ventas cobradas por día, métodos de pago, servicios más vendidos y resultados por empleado.",
      },
      {
        icono: "descarga",
        titulo: "Tus datos son tuyos",
        texto: "Descarga clientes, órdenes y pagos en CSV cuando quieras.",
      },
      {
        icono: "impresora",
        titulo: "Imprime con lo que tienes",
        texto: "Recibos y etiquetas en tu impresora de siempre, sin instalar programas.",
      },
      {
        icono: "idioma",
        titulo: "Español e inglés",
        texto: "Tu equipo trabaja en su idioma y cada cliente recibe sus avisos en el suyo.",
      },
    ],
  },
  sinConexion: {
    titulo: "Se fue el internet. El mostrador sigue.",
    texto:
      "Las tablets registradas guardan una copia de las órdenes abiertas y de tus clientes. Sin conexión puedes recibir ropa, marcar producción, entregar y cobrar. Cuando vuelve, todo se sube en orden y sin duplicados.",
    nota: "Lo que necesita la autorización de un gerente, como un descuento grande, espera a que vuelva la conexión.",
    estados: ["Sin conexión · 3 cambios por subir", "Sincronizando…", "En línea"],
  },
  seguridad: {
    titulo: "Seguridad seria, sin complicarte",
    texto: "Tu negocio maneja dinero y datos de tus clientes. Así los protegemos:",
    items: [
      {
        icono: "llave",
        titulo: "Verificación en dos pasos",
        texto:
          "El dueño confirma su entrada con una app autenticadora, y los gerentes también pueden activarla.",
      },
      {
        icono: "dispositivo",
        titulo: "Solo tus dispositivos",
        texto:
          "Los PIN de los empleados funcionan únicamente en las tablets y computadoras que tú registras.",
      },
      {
        icono: "historial",
        titulo: "Historial que no se borra",
        texto: "Cada cobro, anulación, descuento y cambio de precio queda registrado con quién y cuándo.",
      },
      {
        icono: "capas",
        titulo: "Cada negocio, aparte",
        texto: "Cada tintorería ve solo lo suyo, y eso se comprueba con pruebas automáticas en cada cambio.",
      },
      {
        icono: "respaldo",
        titulo: "Respaldos diarios cifrados",
        texto: "Una copia cifrada de tu información todos los días, guardada durante 30 días.",
      },
      {
        icono: "candado",
        titulo: "Contraseñas protegidas",
        texto: "Nunca se guardan como se escriben, y los intentos repetidos se bloquean durante un rato.",
      },
      {
        icono: "escudo",
        titulo: "Conexión cifrada siempre",
        texto: "Todo viaja por HTTPS, con cabeceras de seguridad modernas en cada página.",
      },
      {
        icono: "robot",
        titulo: "Filtro contra robots",
        texto:
          "La entrada y el registro frenan los ataques automáticos sin hacerle perder tiempo a tu equipo.",
      },
    ],
  },
  empezar: {
    titulo: "Configúralo hoy, atiende mañana",
    pasos: [
      { titulo: "Crea tu cuenta", texto: "Nombre del negocio, tu correo y una contraseña." },
      {
        titulo: "Pon tus precios",
        texto: "Las prendas y los servicios de siempre ya vienen cargados. Solo escribes cuánto cobras.",
      },
      {
        titulo: "Registra la tablet",
        texto: "Abre Tintora POS en la tablet del mostrador y regístrala con un toque.",
      },
      {
        titulo: "Recibe la primera orden",
        texto: "Tu equipo entra con su PIN y empieza a trabajar.",
      },
    ],
    banda: "Pruébalo 14 días en tu tienda de verdad",
    bandaTexto: "Sin tarjeta de crédito y sin instalar nada.",
  },
  preguntas: {
    titulo: "Preguntas frecuentes",
    items: [
      {
        p: "¿Necesito comprar equipo especial?",
        r: "No. Funciona en el navegador de cualquier tablet, celular o computadora. Usas la impresora de recibos o de etiquetas que ya tengas, y la cámara del celular sirve como lector de códigos.",
      },
      {
        p: "¿Qué pasa si se va el internet?",
        r: "Las tablets registradas siguen recibiendo órdenes, marcando producción, entregando y cobrando. Cuando vuelve la conexión, todo se sincroniza solo y sin duplicados.",
      },
      {
        p: "¿Tintora POS cobra con tarjeta?",
        r: "Todavía no procesa tarjetas. Cobras con tu terminal de siempre y registras el pago como tarjeta, efectivo u otro método; la caja y los reportes lo cuentan.",
      },
      {
        p: "¿Funciona en español y en inglés?",
        r: "Sí. Cada persona elige su idioma con las banderas de arriba, y cada cliente recibe sus avisos y su página de estado en el idioma que prefiera.",
      },
      {
        p: "¿Mis clientes tienen que instalar algo?",
        r: "No. Reciben un SMS con un enlace y ven el estado de su orden en el navegador del celular.",
      },
      {
        p: "¿Qué pasa si un empleado deja de trabajar conmigo?",
        r: "Lo desactivas en Ajustes y su PIN deja de funcionar al instante. Todo lo que hizo queda en el historial.",
      },
      {
        p: "¿Puedo llevarme mis datos?",
        r: "Sí. El dueño descarga clientes, órdenes y pagos en CSV, o una copia completa, cuando quiera.",
      },
    ],
  },
};

const en: ContenidoInicio = {
  meta: {
    titulo: "Dry Cleaning & Laundry POS Software | Tintora POS",
    descripcion:
      "Cloud point of sale for dry cleaners and laundries: QR garment tags, text notifications, cash drawer and reports. Works offline, in English and Spanish. 14-day free trial.",
  },
  nav: { funciones: "Features", seguridad: "Security", preguntas: "FAQ" },
  hero: {
    etiqueta: "Point of sale for dry cleaners and laundries",
    titulo: "Every garment tracked.",
    tituloResaltado: "Every customer in the loop.",
    texto:
      "Check in, tag, process, notify and collect payment from the counter tablet. Tintora POS keeps track of every piece and keeps working even when the internet goes down.",
    cta: "Start free trial",
    ctaSecundario: "See how it works",
    sellos: ["14-day free trial", "No credit card", "English & Spanish"],
    dias: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
    lista: "READY",
    riel: "Ticket color shows the day the order came in.",
    smsDe: "Your cleaner",
    sms: "Hi! Your order #1043 is ready for pickup. Check the status here:",
  },
  dolores: {
    titulo: "What stops happening at your store",
    antes: "Before",
    ahora: "With Tintora POS",
    items: [
      {
        antes: "A shirt ends up in the wrong order and nobody knows where it went.",
        ahora: "Every garment gets its own QR tag and is scanned at every step.",
      },
      {
        antes: "The phone keeps ringing: “Is my order ready yet?”",
        ahora: "Customers get a text the moment their order is ready, with a link to check its status.",
      },
      {
        antes: "At closing, the drawer doesn’t balance and you can’t tell why.",
        ahora:
          "Blind close: staff count the cash without seeing the expected total, and any difference is recorded.",
      },
      {
        antes: "Discounts and voids nobody approved.",
        ahora:
          "Sensitive actions require a manager’s PIN, and every action goes into a history that can’t be erased.",
      },
      {
        antes: "The internet drops and the counter grinds to a halt.",
        ahora:
          "Keep checking in orders, printing tags and taking payments. Everything syncs on its own once you’re back online.",
      },
      {
        antes: "Unclaimed clothes taking up rack space for months.",
        ahora: "Automatic pickup reminders, plus a clear list of everything that has been waiting too long.",
      },
    ],
  },
  flujo: {
    titulo: "One order, start to finish",
    texto: "The workflow you already know, minus the lost slips and phone calls.",
    pasos: [
      {
        titulo: "Check in",
        texto:
          "Find or add the customer in seconds, pick garments and services at your prices, and set the due date.",
      },
      { titulo: "Tag", texto: "Print the customer receipt and a QR tag for every garment." },
      { titulo: "Process", texto: "In the back, staff scan each tag to mark items done as they go." },
      { titulo: "Notify", texto: "When the last item is done, the customer gets a text." },
      { titulo: "Pick up", texto: "Scan the receipt, collect the balance, and the order is closed." },
    ],
  },
  funciones: {
    titulo: "Everything a dry cleaner needs, in one place",
    items: [
      {
        icono: "mostrador",
        titulo: "Fast counter screen",
        texto: "Built for tablets: big buttons, search by phone or name, and the total always in view.",
      },
      {
        icono: "precio",
        titulo: "Your prices, your way",
        texto:
          "Per piece or by weight (pounds or kilos), with rush fees, discounts and configurable sales tax.",
      },
      {
        icono: "escaner",
        titulo: "Scan-based production",
        texto: "A phone camera or a barcode scanner marks each garment done. No typing.",
      },
      {
        icono: "caja",
        titulo: "Cash drawer & shifts",
        texto: "Open the drawer, log cash in and out, and run a blind close with any variance on record.",
      },
      {
        icono: "clientes",
        titulo: "Customers",
        texto: "Order history, balances, notification preferences and each customer’s language.",
      },
      {
        icono: "mensaje",
        titulo: "Text notifications",
        texto: "Ready-for-pickup texts and reminders in the customer’s language, using your own wording.",
      },
      {
        icono: "enlace",
        titulo: "Customer status page",
        texto: "Every order gets its own link to check whether it’s ready. No account needed.",
      },
      {
        icono: "pin",
        titulo: "Staff PINs & roles",
        texto:
          "Everyone signs in with a PIN and sees only what their role allows: owner, manager, cashier, production or driver.",
      },
      {
        icono: "grafica",
        titulo: "Reports",
        texto: "Daily collected sales, payment methods, top services and results by employee.",
      },
      {
        icono: "descarga",
        titulo: "Your data stays yours",
        texto: "Download customers, orders and payments as CSV whenever you want.",
      },
      {
        icono: "impresora",
        titulo: "Print with what you have",
        texto: "Receipts and tags on the printer you already own. Nothing to install.",
      },
      {
        icono: "idioma",
        titulo: "English & Spanish",
        texto: "Your team works in their language, and every customer is notified in theirs.",
      },
    ],
  },
  sinConexion: {
    titulo: "Internet down? The counter keeps going.",
    texto:
      "Registered tablets keep a copy of open orders and your customers. While offline you can check in orders, mark items done, hand them over and take payment. When the connection comes back, everything uploads in order with no duplicates.",
    nota: "Anything that needs a manager’s approval, like a large discount, waits until you’re back online.",
    estados: ["Offline · 3 changes to upload", "Syncing…", "Online"],
  },
  seguridad: {
    titulo: "Serious security, zero hassle",
    texto: "Your business handles money and customer data. Here’s how we protect both:",
    items: [
      {
        icono: "llave",
        titulo: "Two-step verification",
        texto: "Owners confirm every sign-in with an authenticator app, and managers can turn it on too.",
      },
      {
        icono: "dispositivo",
        titulo: "Only your devices",
        texto: "Staff PINs work only on the tablets and computers you register.",
      },
      {
        icono: "historial",
        titulo: "Tamper-proof history",
        texto: "Every payment, void, discount and price change is logged with who did it and when.",
      },
      {
        icono: "capas",
        titulo: "Every business kept separate",
        texto: "Each store sees only its own data, verified by automated tests on every change.",
      },
      {
        icono: "respaldo",
        titulo: "Encrypted daily backups",
        texto: "An encrypted copy of your data every day, kept for 30 days.",
      },
      {
        icono: "candado",
        titulo: "Protected passwords",
        texto:
          "Passwords are never stored as typed, and repeated failed attempts are locked out for a while.",
      },
      {
        icono: "escudo",
        titulo: "Encrypted, always",
        texto: "Everything travels over HTTPS, with modern security headers on every page.",
      },
      {
        icono: "robot",
        titulo: "Bot protection",
        texto: "Sign-in and sign-up screens stop automated attacks without slowing your team down.",
      },
    ],
  },
  empezar: {
    titulo: "Set it up today, open for business tomorrow",
    pasos: [
      { titulo: "Create your account", texto: "Your business name, email and a password." },
      {
        titulo: "Add your prices",
        texto: "Common garments and services come preloaded. Just enter what you charge.",
      },
      {
        titulo: "Register your tablet",
        texto: "Open Tintora POS on the counter tablet and register it with one tap.",
      },
      { titulo: "Take your first order", texto: "Your team signs in with their PIN and gets to work." },
    ],
    banda: "Try it free for 14 days at your real store",
    bandaTexto: "No credit card, nothing to install.",
  },
  preguntas: {
    titulo: "Frequently asked questions",
    items: [
      {
        p: "Do I need to buy special hardware?",
        r: "No. It runs in the browser on any tablet, phone or computer. Use the receipt or label printer you already have, and a phone camera works as a barcode scanner.",
      },
      {
        p: "What happens if the internet goes down?",
        r: "Registered tablets keep checking in orders, marking production, handing orders over and taking payment. When the connection returns, everything syncs automatically with no duplicates.",
      },
      {
        p: "Does Tintora POS process card payments?",
        r: "Not yet. Charge cards on your existing terminal and record the payment as card, cash or another method. Your drawer and reports account for it.",
      },
      {
        p: "Does it work in English and Spanish?",
        r: "Yes. Everyone picks their language with the flags at the top, and each customer gets their texts and status page in the language they prefer.",
      },
      {
        p: "Do my customers need to install anything?",
        r: "No. They get a text with a link and check their order status in their phone’s browser.",
      },
      {
        p: "What if an employee leaves?",
        r: "Deactivate them in Settings and their PIN stops working immediately. Everything they did stays in the history.",
      },
      {
        p: "Can I take my data with me?",
        r: "Yes. The owner can download customers, orders and payments as CSV, or a full copy, at any time.",
      },
    ],
  },
};

export const CONTENIDO_INICIO: Record<Idioma, ContenidoInicio> = { es, en };
