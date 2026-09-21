import type { Idioma } from "@/lib/i18n";

/**
 * Capturas REALES del sistema (se generan con `scripts/capturas.mjs` sobre la
 * tintorería de trabajo local). El texto de cada una se lee en voz alta para
 * quien no ve la imagen y también lo lee Google: se escribe completo en los dos
 * idiomas.
 */
export interface Captura {
  archivo: string;
  ancho: number;
  alto: number;
  marco: "escritorio" | "tablet" | "celular" | "papel";
  alt: Record<Idioma, string>;
  pie: Record<Idioma, string>;
}

export const CAPTURAS = {
  orden: {
    archivo: "/capturas/orden.webp",
    ancho: 1440,
    alto: 900,
    marco: "escritorio",
    alt: {
      es: "Detalle de una orden en Tintora POS: el cliente, las prendas con su estado y su etiqueta, el saldo y los botones para imprimir y cobrar.",
      en: "Order detail in Tintora POS: the customer, each garment with its status and tag, the balance and the buttons to print and charge.",
    },
    pie: {
      es: "La orden por dentro: cada prenda con su etiqueta y su estado.",
      en: "Inside an order: every garment with its tag and its status.",
    },
  },
  etiquetasPantalla: {
    archivo: "/capturas/etiquetas-pantalla.webp",
    ancho: 900,
    alto: 420,
    marco: "escritorio",
    alt: {
      es: "Pantalla de impresión de etiquetas con el selector de tamaño arriba: rollo, tag para grapar, hoja carta o rollo de recibos.",
      en: "Tag printing screen with the size picker on top: roll, staple tag, letter sheet or receipt roll.",
    },
    pie: {
      es: "Arriba se elige el tamaño; esa computadora lo recuerda.",
      en: "You pick the size up top; that computer remembers it.",
    },
  },
  impresoras: {
    archivo: "/capturas/impresoras.webp",
    ancho: 768,
    alto: 1203,
    marco: "escritorio",
    alt: {
      es: "Pantalla Ajustes → Impresoras con dos tarjetas: la impresora de recibos conectada, con su ancho de papel, y la impresora de etiquetas con tres opciones (ventana del navegador, la misma de recibos o una etiquetera conectada), su idioma, su tamaño y el botón de imprimir una etiqueta de prueba.",
      en: "Settings → Printers screen with two cards: the connected receipt printer with its paper width, and the tag printer with three options (browser window, the same receipt printer, or a connected label printer), its language, its size and the button to print a test tag.",
    },
    pie: {
      es: "Cada equipo recuerda sus dos impresoras: la de recibos y la de etiquetas.",
      en: "Each device remembers its two printers: receipts and tags.",
    },
  },
  etiquetaDirecta: {
    archivo: "/capturas/etiqueta-directa.webp",
    ancho: 860,
    alto: 454,
    marco: "papel",
    alt: {
      es: "Etiqueta de 2 × 1 pulgadas tal como la dibuja una etiquetera conectada: el código QR a la izquierda y, a la derecha, el número de la orden en grande, el día y la pieza, la prenda, el cliente, la fecha de entrega y las marcas.",
      en: "A 2 × 1 inch tag as a connected label printer draws it: the QR code on the left and, on the right, the order number in large type, the day and piece, the garment, the customer, the due date and the marks.",
    },
    pie: {
      es: "Así dibuja la etiqueta una etiquetera conectada (2 × 1 pulgadas).",
      en: "How a connected label printer draws the tag (2 × 1 inches).",
    },
  },
  reciboCorreo: {
    archivo: "/capturas/recibo-correo.webp",
    ancho: 440,
    alto: 900,
    marco: "celular",
    alt: {
      es: "Correo con el recibo digital de una lavandería: el nombre de la tienda, el número de orden en grande, cuándo estará lista, las prendas (una de ellas cobrada por kilo), el total, el saldo y el botón «Ver el estado de mi orden».",
      en: "Email with a laundry's digital receipt: the store name, the order number in large type, when it will be ready, the items (one charged by weight), the total, the balance and the “Check my order status” button.",
    },
    pie: {
      es: "El recibo digital, tal como le llega al cliente.",
      en: "The digital receipt, as the customer gets it.",
    },
  },
  mostrador: {
    archivo: "/capturas/mostrador.webp",
    ancho: 1440,
    alto: 900,
    marco: "escritorio",
    alt: {
      es: "Pantalla de nueva orden de Tintora POS: cada prenda con su dibujo, la barra de marcas con daños, manchas y color, y el ticket con el total a la derecha.",
      en: "Tintora POS new order screen: every garment with its own icon, the marks bar with damage, stains and color, and the ticket with the total on the right.",
    },
    pie: {
      es: "Nueva orden: toca la prenda, marca lo que trae y cobra.",
      en: "New order: tap the garment, mark what it has, take the payment.",
    },
  },
  etiquetas: {
    archivo: "/capturas/etiquetas.webp",
    ancho: 900,
    alto: 340,
    marco: "papel",
    alt: {
      es: "Etiquetas de 2 × 1 pulgadas listas para imprimir, una por prenda, con el número de orden, el día, el cliente y su código QR.",
      en: "Two-by-one-inch tags ready to print, one per garment, with the order number, the day, the customer and its QR code.",
    },
    pie: {
      es: "Una etiqueta por prenda, con QR: ninguna se pierde.",
      en: "One tag per garment, with a QR code: nothing gets lost.",
    },
  },
  produccion: {
    archivo: "/capturas/produccion.webp",
    ancho: 1440,
    alto: 900,
    marco: "escritorio",
    alt: {
      es: "Pantalla de producción de Tintora POS con las órdenes separadas en recibidas, en proceso y listas, y el campo para escanear la etiqueta.",
      en: "Tintora POS production screen with orders split into received, in progress and ready, and the field to scan the tag.",
    },
    pie: {
      es: "Producción: escanea y la prenda cambia de estado.",
      en: "Production: scan and the garment moves along.",
    },
  },
  produccionCelular: {
    archivo: "/capturas/produccion-celular.webp",
    ancho: 390,
    alto: 844,
    marco: "celular",
    alt: {
      es: "La misma pantalla de producción en un celular, con el botón de la cámara para escanear la etiqueta de la prenda.",
      en: "The same production screen on a phone, with the camera button to scan the garment tag.",
    },
    pie: {
      es: "Desde el celular del empleado, con la cámara.",
      en: "From the employee's phone, using the camera.",
    },
  },
  clienteCelular: {
    archivo: "/capturas/cliente-celular.webp",
    ancho: 390,
    alto: 844,
    marco: "celular",
    alt: {
      es: "Página que ve el cliente en su celular: «¡Tu ropa está lista! Puedes pasar a recogerla», con el avance de la orden y el botón para llamar a la tienda.",
      en: "The page the customer sees on their phone: “Your clothes are ready for pickup”, with the order progress and a button to call the store.",
    },
    pie: {
      es: "El cliente ve su orden sin llamar a nadie.",
      en: "Customers check their order without calling anyone.",
    },
  },
  entrega: {
    archivo: "/capturas/entrega.webp",
    ancho: 1440,
    alto: 900,
    marco: "escritorio",
    alt: {
      es: "Pantalla de entrega: se busca la orden, se ve el saldo a cobrar y se elige la forma de pago antes de entregar la ropa.",
      en: "Pickup screen: find the order, see the balance due and pick the payment method before handing over the clothes.",
    },
    pie: {
      es: "Entrega: cobra el saldo y cierra la orden.",
      en: "Pickup: collect the balance and close the order.",
    },
  },
  caja: {
    archivo: "/capturas/caja.webp",
    ancho: 1440,
    alto: 900,
    marco: "escritorio",
    alt: {
      es: "Pantalla de caja con el fondo inicial, lo cobrado por forma de pago y el botón para cerrar con conteo a ciegas.",
      en: "Cash register screen with the opening float, what was collected by payment method and the button to close with a blind count.",
    },
    pie: {
      es: "Caja: cierre a ciegas y diferencia a la vista.",
      en: "Register: blind close, difference in plain sight.",
    },
  },
  reportes: {
    archivo: "/capturas/reportes.webp",
    ancho: 1440,
    alto: 900,
    marco: "escritorio",
    alt: {
      es: "Reportes de Tintora POS: cobrado del período, ticket promedio, gráfico por día y desglose por forma de pago, servicio y empleado.",
      en: "Tintora POS reports: revenue for the period, average ticket, a chart by day and a breakdown by payment method, service and employee.",
    },
    pie: {
      es: "Reportes: qué entró, por día, servicio y empleado.",
      en: "Reports: what came in, by day, service and employee.",
    },
  },
  ordenes: {
    archivo: "/capturas/ordenes.webp",
    ancho: 1440,
    alto: 900,
    marco: "escritorio",
    alt: {
      es: "Lista de órdenes con su número, cliente, estado y saldo, con filtros por estado y buscador.",
      en: "Order list with number, customer, status and balance, with status filters and a search box.",
    },
    pie: { es: "Todas las órdenes, siempre a mano.", en: "Every order, always at hand." },
  },
  panel: {
    archivo: "/capturas/panel.webp",
    ancho: 1440,
    alto: 900,
    marco: "escritorio",
    alt: {
      es: "Pantalla de inicio de Tintora POS con lo cobrado hoy, las órdenes recibidas, las listas para entregar y las atrasadas.",
      en: "Tintora POS home screen with today's revenue, orders received, orders ready for pickup and overdue ones.",
    },
    pie: { es: "El día de la tienda, de un vistazo.", en: "The store's day at a glance." },
  },
  mostradorTablet: {
    archivo: "/capturas/mostrador-tablet.webp",
    ancho: 1024,
    alto: 768,
    marco: "tablet",
    alt: {
      es: "Tintora POS en la tablet del mostrador, armando una orden con la rejilla de prendas.",
      en: "Tintora POS on the counter tablet, building an order from the garment grid.",
    },
    pie: {
      es: "En la tablet del mostrador, con o sin internet.",
      en: "On the counter tablet, online or not.",
    },
  },
  recibo: {
    archivo: "/capturas/recibo.webp",
    ancho: 700,
    alto: 900,
    marco: "papel",
    alt: {
      es: "Recibo térmico de 80 mm con el número de orden, las prendas, el estado de cada una al recibirla, el total y el QR para consultar la orden.",
      en: "80 mm thermal receipt with the order number, the garments, the condition of each at drop-off, the total and the QR code to check the order.",
    },
    pie: { es: "El recibo del cliente, con su QR.", en: "The customer receipt, with its QR code." },
  },
} satisfies Record<string, Captura>;

export type ClaveCaptura = keyof typeof CAPTURAS;
