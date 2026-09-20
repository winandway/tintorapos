import type { Idioma } from "@/lib/i18n";

/**
 * Privacidad y términos. BORRADOR para revisión legal antes del lanzamiento
 * (ver PENDIENTES.md). El tipo obliga a tener los dos idiomas completos.
 */
export interface SeccionLegal {
  titulo: string;
  parrafos: string[];
  lista?: string[];
}

export interface DocumentoLegal {
  titulo: string;
  descripcion: string;
  actualizado: string;
  secciones: SeccionLegal[];
  contacto: { titulo: string; con: string; sin: string };
}

export const ACTUALIZADO_LEGAL = "2026-09-19";

const privacidadEs: DocumentoLegal = {
  titulo: "Política de privacidad",
  descripcion: "Qué datos trata Tintora POS, para qué, con quién los comparte y cómo ejercer tus derechos.",
  actualizado: "Última actualización: 19 de septiembre de 2026",
  secciones: [
    {
      titulo: "Quién trata tus datos",
      parrafos: [
        "El responsable de este sitio y del servicio es Windoce LLC (Estados Unidos), que opera Tintora POS en tintorapos.com. Para cualquier asunto de privacidad, escríbenos por el formulario de contacto del sitio; respondemos al correo que nos dejes.",
      ],
    },
    {
      titulo: "A quién aplica",
      parrafos: [
        "Tintora POS es un servicio en la nube para que tintorerías y lavanderías administren órdenes, clientes, caja y avisos. Esta política explica qué datos tratamos cuando visitas este sitio, cuando un negocio usa el sistema y cuando eres cliente de un negocio que lo usa.",
      ],
    },
    {
      titulo: "Dos papeles distintos",
      parrafos: [
        "Cada tintorería es la responsable de los datos de sus clientes: decide qué registra y para qué. Tintora POS guarda y procesa esos datos por encargo de la tintorería y solo para prestarle el servicio.",
        "Si eres cliente de una tintorería y quieres consultar, corregir o borrar tus datos, pídeselo a ella. Nosotros la ayudamos a cumplir.",
      ],
    },
    {
      titulo: "Datos que tratamos",
      parrafos: [],
      lista: [
        "Cuenta del negocio: nombre, país, zona horaria, moneda, nombre y correo del dueño y, si lo da, un teléfono.",
        "Empleados: nombre, rol y un PIN guardado de forma irreversible.",
        "Clientes de la tintorería: nombre, teléfono, correo si lo da, idioma, preferencias de avisos, órdenes, pagos registrados, notas y fotos de prendas que tome la tienda.",
        "Dispositivos y sesiones: un identificador del dispositivo registrado, fechas de uso y una huella cifrada de la dirección IP para frenar abusos.",
        "Historial de acciones: quién hizo cada cobro, anulación, descuento o cambio, y cuándo.",
      ],
    },
    {
      titulo: "Para qué los usamos",
      parrafos: ["No vendemos datos personales ni los usamos para publicidad. Los usamos para:"],
      lista: [
        "Prestar el servicio: órdenes, etiquetas, producción, entregas, caja y reportes.",
        "Enviar los avisos que la tienda activa, como «tu orden está lista».",
        "Proteger las cuentas: frenar intentos repetidos, detectar abusos y hacer respaldos.",
        "Dar soporte cuando el negocio lo pide.",
        "Cumplir obligaciones legales.",
      ],
    },
    {
      titulo: "Avisos por SMS",
      parrafos: [
        "Los avisos solo se envían a clientes que aceptaron recibirlos. Quien responda STOP deja de recibir mensajes desde ese momento.",
      ],
    },
    {
      titulo: "Con quién los compartimos",
      parrafos: [
        "Solo con proveedores que necesitamos para prestar el servicio, y cada uno recibe únicamente lo necesario para su tarea:",
      ],
      lista: [
        "La infraestructura en la nube donde corre el servicio y se guardan la base de datos, los archivos y los respaldos.",
        "El proveedor de SMS (Twilio), para enviar los avisos.",
        "Cloudflare Turnstile, para el filtro contra robots en las pantallas de entrar y registrarse.",
        "Autoridades, solo cuando la ley nos obligue.",
      ],
    },
    {
      titulo: "Cookies",
      parrafos: [
        "Usamos solo cookies necesarias: la sesión, el dispositivo registrado, la protección contra solicitudes falsificadas y el idioma que eliges. No usamos cookies de publicidad ni de seguimiento. Para saber cuántas visitas recibe el sitio usamos una medición anónima de Cloudflare que no usa cookies.",
      ],
    },
    {
      titulo: "Seguridad",
      parrafos: [
        "Conexión cifrada, contraseñas y PIN guardados de forma irreversible, verificación en dos pasos, datos de cada negocio separados, historial que no se puede alterar y respaldos diarios cifrados.",
        "Ningún sistema es infalible. Si detectamos un incidente que afecte datos personales, avisamos a los negocios afectados sin demoras indebidas.",
      ],
    },
    {
      titulo: "Cuánto tiempo los guardamos",
      parrafos: [
        "Mientras la cuenta esté activa. Los respaldos se conservan 30 días. Si un negocio cierra su cuenta, puede descargar sus datos antes; después se eliminan de los sistemas activos, y de los respaldos cuando vencen esos 30 días, salvo lo que la ley obligue a conservar.",
      ],
    },
    {
      titulo: "Tus derechos",
      parrafos: [
        "Puedes pedir acceso, corrección, copia o eliminación de tus datos, y oponerte a ciertos usos. El dueño de un negocio descarga sus datos cuando quiera desde Ajustes.",
        "Según dónde vivas, por ejemplo en California o en países de Latinoamérica como México o Colombia, la ley local puede darte derechos adicionales. Los atendemos igual.",
      ],
    },
    {
      titulo: "Datos fuera de tu país",
      parrafos: [
        "Los datos pueden procesarse en servidores fuera de tu país. Aplicamos las mismas protecciones dondequiera que se procesen.",
      ],
    },
    {
      titulo: "Menores de edad",
      parrafos: ["El servicio es para negocios y no está dirigido a menores de 18 años."],
    },
    {
      titulo: "Cambios a esta política",
      parrafos: [
        "Si hacemos un cambio importante, lo avisaremos dentro del sistema antes de que empiece a aplicar.",
      ],
    },
    {
      titulo: "Encargados que nos ayudan",
      parrafos: [
        "Para prestar el servicio usamos proveedores que tratan datos por nuestra cuenta y solo con nuestras instrucciones:",
      ],
      lista: [
        "YaDominios Cloud (alojamiento, base de datos, archivos y envío de correo del dominio).",
        "Cloudflare (red, protección contra ataques y medición anónima de visitas, sin cookies).",
        "Twilio, solo si la tintorería activa los avisos por mensaje de texto.",
        "Stripe, solo cuando se active el cobro con tarjeta; los datos de la tarjeta nunca pasan por nuestros servidores.",
      ],
    },
    {
      titulo: "Si algo sale mal (incidentes)",
      parrafos: [
        "Si ocurre una brecha de seguridad que afecte datos personales, avisamos a las tintorerías afectadas sin demora indebida y, como máximo, dentro de las 72 horas siguientes a conocerla, con lo que sepamos: qué pasó, a qué datos afectó y qué estamos haciendo.",
      ],
    },
    {
      titulo: "Decisiones automáticas",
      parrafos: [
        "Tintora POS no toma decisiones automatizadas con efectos jurídicos sobre personas, ni hace perfilado con fines publicitarios. No vendemos datos personales ni los compartimos para publicidad de terceros.",
      ],
    },
    {
      titulo: "Si vives en Europa o en California",
      parrafos: [
        "Tratamos los datos de la tintorería por la ejecución del contrato y nuestro interés legítimo en prestar y proteger el servicio; los datos de sus clientes, por encargo de ella. Puedes ejercer tus derechos de acceso, rectificación, supresión, limitación, oposición y portabilidad escribiéndonos.",
        "Si vives en California: no vendemos ni compartimos información personal en el sentido de la CCPA/CPRA, y no discriminamos a quien ejerce sus derechos.",
      ],
    },
  ],
  contacto: {
    titulo: "Contacto",
    con: "Para cualquier pregunta o solicitud sobre tus datos, escríbenos a",
    sin: "Para cualquier pregunta o solicitud sobre tus datos, escríbenos al correo de soporte de Tintora POS.",
  },
};

const privacidadEn: DocumentoLegal = {
  titulo: "Privacy Policy",
  descripcion: "What data Tintora POS processes, why, who it’s shared with, and how to exercise your rights.",
  actualizado: "Last updated: September 19, 2026",
  secciones: [
    {
      titulo: "Who processes your data",
      parrafos: [
        "This site and service are run by Windoce LLC (United States), which operates Tintora POS at tintorapos.com. For any privacy matter, write to us through the contact form on the site; we reply to the email you leave.",
      ],
    },
    {
      titulo: "Who this applies to",
      parrafos: [
        "Tintora POS is a cloud service that dry cleaners and laundries use to manage orders, customers, cash drawers and notifications. This policy explains what data we process when you visit this site, when a business uses the system, and when you’re a customer of a business that uses it.",
      ],
    },
    {
      titulo: "Two different roles",
      parrafos: [
        "Each dry cleaner is responsible for its own customers’ data: it decides what to record and why. Tintora POS stores and processes that data on the dry cleaner’s behalf, solely to provide the service.",
        "If you’re a customer of a dry cleaner and want to access, correct or delete your data, please contact that business. We’ll help them take care of it.",
      ],
    },
    {
      titulo: "Data we process",
      parrafos: [],
      lista: [
        "Business account: business name, country, time zone, currency, the owner’s name and email and, if provided, a phone number.",
        "Staff: name, role and a PIN stored in a non-reversible form.",
        "The dry cleaner’s customers: name, phone number, email if provided, language, notification preferences, orders, recorded payments, notes and any garment photos the store takes.",
        "Devices and sessions: an identifier for each registered device, usage dates and an encrypted fingerprint of the IP address to prevent abuse.",
        "Activity history: who performed each payment, void, discount or change, and when.",
      ],
    },
    {
      titulo: "How we use it",
      parrafos: ["We don’t sell personal data or use it for advertising. We use it to:"],
      lista: [
        "Provide the service: orders, tags, production, pickups, cash drawer and reports.",
        "Send the notifications the store turns on, such as “your order is ready.”",
        "Protect accounts: block repeated attempts, detect abuse and make backups.",
        "Provide support when the business asks for it.",
        "Comply with legal obligations.",
      ],
    },
    {
      titulo: "Text message notifications",
      parrafos: [
        "Notifications are only sent to customers who agreed to receive them. Anyone who replies STOP stops receiving messages right away.",
      ],
    },
    {
      titulo: "Who we share it with",
      parrafos: [
        "Only with the providers we need to run the service, and each one receives only what its task requires:",
      ],
      lista: [
        "The cloud infrastructure that runs the service and stores the database, files and backups.",
        "Our text message provider (Twilio), to deliver notifications.",
        "Cloudflare Turnstile, for bot protection on the sign-in and sign-up screens.",
        "Authorities, only when required by law.",
      ],
    },
    {
      titulo: "Cookies",
      parrafos: [
        "We only use essential cookies: your session, the registered device, protection against forged requests and the language you choose. We don’t use advertising or tracking cookies. To count site visits, we use Cloudflare’s anonymous, cookie-free analytics.",
      ],
    },
    {
      titulo: "Security",
      parrafos: [
        "Encrypted connections, passwords and PINs stored in a non-reversible form, two-step verification, each business’s data kept separate, a tamper-proof activity history and encrypted daily backups.",
        "No system is perfect. If we detect an incident affecting personal data, we’ll notify the affected businesses without undue delay.",
      ],
    },
    {
      titulo: "How long we keep it",
      parrafos: [
        "For as long as the account is active. Backups are kept for 30 days. If a business closes its account, it can download its data first; after that, the data is deleted from our active systems, and from backups once those 30 days pass, except for anything the law requires us to keep.",
      ],
    },
    {
      titulo: "Your rights",
      parrafos: [
        "You can request access to, correction, a copy or deletion of your data, and object to certain uses. A business owner can download their data at any time from Settings.",
        "Depending on where you live, such as California or Latin American countries like Mexico or Colombia, local law may give you additional rights. We honor them.",
      ],
    },
    {
      titulo: "International processing",
      parrafos: [
        "Your data may be processed on servers outside your country. We apply the same protections wherever it’s processed.",
      ],
    },
    {
      titulo: "Children",
      parrafos: ["The service is for businesses and isn’t directed at anyone under 18."],
    },
    {
      titulo: "Changes to this policy",
      parrafos: ["If we make a material change, we’ll let you know inside the app before it takes effect."],
    },
    {
      titulo: "Processors that help us",
      parrafos: [
        "To run the service we use providers that process data on our behalf and only on our instructions:",
      ],
      lista: [
        "YaDominios Cloud (hosting, database, files and sending email from the domain).",
        "Cloudflare (network, attack protection and anonymous, cookie-free visit measurement).",
        "Twilio, only if the store turns on text message notifications.",
        "Stripe, only once card payments are enabled; card details never touch our servers.",
      ],
    },
    {
      titulo: "If something goes wrong (incidents)",
      parrafos: [
        "If a security breach affects personal data, we notify the affected stores without undue delay and within 72 hours of becoming aware of it, with what we know: what happened, which data it touched and what we are doing about it.",
      ],
    },
    {
      titulo: "Automated decisions",
      parrafos: [
        "Tintora POS makes no automated decisions with legal effects on people, and does no profiling for advertising. We do not sell personal data and do not share it for third-party advertising.",
      ],
    },
    {
      titulo: "If you are in Europe or California",
      parrafos: [
        "We process the store's data to perform our contract and on our legitimate interest in running and protecting the service; their customers' data we process on the store's instructions. You can exercise your rights of access, rectification, erasure, restriction, objection and portability by writing to us.",
        "If you live in California: we do not sell or share personal information as defined by the CCPA/CPRA, and we do not discriminate against anyone who exercises their rights.",
      ],
    },
  ],
  contacto: {
    titulo: "Contact",
    con: "For any question or request about your data, email us at",
    sin: "For any question or request about your data, email Tintora POS support.",
  },
};

const terminosEs: DocumentoLegal = {
  titulo: "Términos del servicio",
  descripcion: "Las condiciones para usar Tintora POS en tu negocio.",
  actualizado: "Última actualización: 19 de septiembre de 2026",
  secciones: [
    {
      titulo: "Aceptación",
      parrafos: [
        "Al crear una cuenta o usar Tintora POS aceptas estos términos en nombre de tu negocio. Si no estás de acuerdo, no uses el servicio.",
      ],
    },
    {
      titulo: "El servicio",
      parrafos: [
        "Tintora POS es un sistema en la nube para administrar órdenes, prendas, clientes, caja, avisos y reportes de tintorerías y lavanderías. Lo mejoramos con el tiempo; si retiramos una función importante, lo avisamos con anticipación.",
      ],
    },
    {
      titulo: "Tu cuenta",
      parrafos: [
        "Das información verdadera, cuidas tu contraseña y tus códigos de verificación, y respondes por lo que hagan los empleados y dispositivos que autorizas. Si sospechas un acceso indebido, cambia la contraseña y revoca los dispositivos desde Ajustes.",
      ],
    },
    {
      titulo: "Prueba gratis y planes",
      parrafos: [
        "Las cuentas nuevas tienen 14 días de prueba sin tarjeta. Los planes pagos, sus precios y lo que incluyen se muestran antes de contratarlos, y cualquier cambio de precio se avisa con anticipación.",
      ],
    },
    {
      titulo: "Los pagos de tus clientes",
      parrafos: [
        "Tintora POS registra los pagos que recibes, ya sea en efectivo, con tarjeta en tu propia terminal o con otros métodos, pero no procesa tarjetas ni mueve dinero. Conciliar la caja y los cobros con tu banco o tu procesador de pagos es responsabilidad de tu negocio.",
      ],
    },
    {
      titulo: "Los datos de tus clientes",
      parrafos: [
        "Tu negocio es responsable de tener permiso para registrar los datos de sus clientes y enviarles avisos por SMS. Los avisos son informativos, como «tu orden está lista» o un recordatorio de recogida, y no publicidad. Cuando alguien responde STOP, el sistema deja de enviarle mensajes.",
      ],
    },
    {
      titulo: "Uso aceptable",
      parrafos: ["No puedes usar el servicio para:"],
      lista: [
        "Actividades ilegales o fraudulentas.",
        "Intentar acceder a datos de otros negocios o vulnerar la seguridad del sistema.",
        "Enviar publicidad o mensajes no deseados por medio de los avisos.",
        "Revender el servicio sin un acuerdo por escrito.",
        "Sobrecargar el sistema a propósito o interferir con otros usuarios.",
      ],
    },
    {
      titulo: "Tus datos son tuyos",
      parrafos: [
        "Los datos que cargas pertenecen a tu negocio. Nos das permiso para guardarlos y procesarlos solo para prestarte el servicio, y puedes descargarlos cuando quieras.",
      ],
    },
    {
      titulo: "Disponibilidad",
      parrafos: [
        "Trabajamos para que el servicio esté disponible siempre, pero puede haber interrupciones por mantenimiento o por fallas de terceros. El modo sin conexión de las tablets registradas reduce el impacto, y lo que se hace sin conexión se sincroniza al volver. Hacemos respaldos diarios; aun así, te recomendamos descargar tus datos con regularidad.",
      ],
    },
    {
      titulo: "Suspensión y cierre",
      parrafos: [
        "Puedes cerrar tu cuenta cuando quieras. Podemos suspenderla por falta de pago o por un uso que ponga en riesgo el servicio o a terceros, avisándote antes siempre que sea posible.",
      ],
    },
    {
      titulo: "Propiedad intelectual",
      parrafos: [
        "El software, la marca Tintora POS y sus diseños nos pertenecen. Mientras tu cuenta esté activa, te damos una licencia para usarlos en tu negocio.",
      ],
    },
    {
      titulo: "Garantías y responsabilidad",
      parrafos: [
        "El servicio se ofrece tal como está. En la medida en que la ley lo permita, no respondemos por pérdidas indirectas, ganancias no obtenidas ni daños derivados de interrupciones, y nuestra responsabilidad total se limita a lo que pagaste por el servicio en los 12 meses anteriores al reclamo.",
      ],
    },
    {
      titulo: "Cambios a estos términos",
      parrafos: [
        "Si hacemos un cambio importante, lo avisaremos dentro del sistema antes de que empiece a aplicar. Seguir usando el servicio después de esa fecha significa que aceptas los términos nuevos.",
      ],
    },
    {
      titulo: "Ley aplicable",
      parrafos: [
        "Estos términos se rigen por las leyes de los Estados Unidos de América, sin perjuicio de los derechos que te otorgue la ley de tu país.",
      ],
    },
    {
      titulo: "Precios, facturación y reembolsos",
      parrafos: [
        "Mientras no publiquemos precios, el uso del sistema es gratuito durante la prueba. Cuando existan planes de pago, el precio, la moneda y el período se muestran antes de contratar; el cobro se renueva solo hasta que canceles.",
        "Puedes cancelar cuando quieras desde el panel o escribiéndonos: el servicio sigue hasta el final del período ya pagado y no se cobra el siguiente. No hay reembolsos por períodos ya usados, salvo que la ley de tu país diga otra cosa.",
      ],
    },
    {
      titulo: "Soporte",
      parrafos: [
        "El soporte se presta por el formulario de contacto del sitio, en español e inglés, en días hábiles. Atendemos primero lo que impide operar (no se puede recibir ropa, cobrar o entregar).",
      ],
    },
    {
      titulo: "Si te vas: tus datos se van contigo",
      parrafos: [
        "Antes de cerrar la cuenta puedes exportar clientes, órdenes y pagos en CSV desde Ajustes → Tus datos. Después del cierre conservamos los datos 30 días por si te arrepientes, y luego los borramos junto con los respaldos, salvo lo que la ley nos obligue a guardar.",
      ],
    },
    {
      titulo: "Fuerza mayor",
      parrafos: [
        "Ninguna de las partes responde por incumplimientos causados por hechos fuera de su control razonable (cortes de internet o de energía, desastres, fallos de proveedores de infraestructura, actos de autoridad).",
      ],
    },
    {
      titulo: "Cesión, avisos y acuerdo completo",
      parrafos: [
        "No puedes ceder este contrato sin nuestro consentimiento; nosotros podemos cederlo a una empresa del grupo o en caso de venta del negocio, avisándote. Los avisos se mandan al correo de tu cuenta o se muestran en el panel.",
        "Estos términos y la política de privacidad son el acuerdo completo entre tú y Windoce LLC sobre el servicio. Si una cláusula resulta inválida, el resto sigue vigente.",
      ],
    },
  ],
  contacto: {
    titulo: "Contacto",
    con: "Si tienes preguntas sobre estos términos, escríbenos a",
    sin: "Si tienes preguntas sobre estos términos, escribe al soporte de Tintora POS.",
  },
};

const terminosEn: DocumentoLegal = {
  titulo: "Terms of Service",
  descripcion: "The terms for using Tintora POS at your business.",
  actualizado: "Last updated: September 19, 2026",
  secciones: [
    {
      titulo: "Acceptance",
      parrafos: [
        "By creating an account or using Tintora POS, you agree to these terms on behalf of your business. If you don’t agree, please don’t use the service.",
      ],
    },
    {
      titulo: "The service",
      parrafos: [
        "Tintora POS is a cloud system for managing orders, garments, customers, cash drawers, notifications and reports for dry cleaners and laundries. We improve it over time, and if we retire an important feature, we’ll give you advance notice.",
      ],
    },
    {
      titulo: "Your account",
      parrafos: [
        "You agree to provide accurate information, keep your password and verification codes safe, and take responsibility for what the employees and devices you authorize do. If you suspect unauthorized access, change your password and revoke devices from Settings.",
      ],
    },
    {
      titulo: "Free trial and plans",
      parrafos: [
        "New accounts get a 14-day trial with no credit card required. Paid plans, their prices and what they include are shown before you subscribe, and any price change is announced in advance.",
      ],
    },
    {
      titulo: "Your customers’ payments",
      parrafos: [
        "Tintora POS records the payments you receive, whether cash, cards charged on your own terminal or other methods, but it doesn’t process cards or move money. Reconciling your drawer and payments with your bank or payment processor is your business’s responsibility.",
      ],
    },
    {
      titulo: "Your customers’ data",
      parrafos: [
        "Your business is responsible for having permission to record its customers’ data and to send them text notifications. Notifications are informational, such as “your order is ready” or a pickup reminder, not marketing. When someone replies STOP, the system stops messaging them.",
      ],
    },
    {
      titulo: "Acceptable use",
      parrafos: ["You may not use the service to:"],
      lista: [
        "Engage in illegal or fraudulent activity.",
        "Try to access other businesses’ data or compromise the system’s security.",
        "Send marketing or unwanted messages through notifications.",
        "Resell the service without a written agreement.",
        "Deliberately overload the system or interfere with other users.",
      ],
    },
    {
      titulo: "Your data is yours",
      parrafos: [
        "The data you enter belongs to your business. You give us permission to store and process it only to provide the service, and you can download it at any time.",
      ],
    },
    {
      titulo: "Availability",
      parrafos: [
        "We work to keep the service available at all times, but interruptions can happen due to maintenance or third-party outages. Offline mode on registered tablets reduces the impact, and anything done offline syncs once you’re back online. We make daily backups, but we still recommend downloading your data regularly.",
      ],
    },
    {
      titulo: "Suspension and cancellation",
      parrafos: [
        "You can close your account at any time. We may suspend an account for non-payment or for use that puts the service or others at risk, with prior notice whenever possible.",
      ],
    },
    {
      titulo: "Intellectual property",
      parrafos: [
        "The software, the Tintora POS brand and its designs belong to us. While your account is active, we grant you a license to use them in your business.",
      ],
    },
    {
      titulo: "Warranties and liability",
      parrafos: [
        "The service is provided “as is.” To the extent permitted by law, we aren’t liable for indirect losses, lost profits or damages resulting from interruptions, and our total liability is limited to the amount you paid for the service in the 12 months before the claim.",
      ],
    },
    {
      titulo: "Changes to these terms",
      parrafos: [
        "If we make a material change, we’ll let you know inside the app before it takes effect. Continuing to use the service after that date means you accept the updated terms.",
      ],
    },
    {
      titulo: "Governing law",
      parrafos: [
        "These terms are governed by the laws of the United States of America, without limiting any rights your local law gives you.",
      ],
    },
    {
      titulo: "Pricing, billing and refunds",
      parrafos: [
        "Until we publish prices, using the system is free during the trial. Once paid plans exist, the price, currency and billing period are shown before you subscribe; billing renews automatically until you cancel.",
        "You can cancel whenever you want from the panel or by writing to us: the service runs until the end of the period you already paid for and the next one is not charged. There are no refunds for periods already used, unless the law where you live says otherwise.",
      ],
    },
    {
      titulo: "Support",
      parrafos: [
        "Support is provided through the contact form on the site, in English and Spanish, on business days. We handle first whatever stops you from operating (you cannot take in clothes, charge or hand orders over).",
      ],
    },
    {
      titulo: "If you leave: your data leaves with you",
      parrafos: [
        "Before closing the account you can export customers, orders and payments as CSV from Settings → Your data. After closing we keep the data for 30 days in case you change your mind, and then delete it along with the backups, except what the law requires us to keep.",
      ],
    },
    {
      titulo: "Force majeure",
      parrafos: [
        "Neither party is liable for failures caused by events beyond its reasonable control (internet or power outages, disasters, infrastructure provider failures, acts of authority).",
      ],
    },
    {
      titulo: "Assignment, notices and entire agreement",
      parrafos: [
        "You may not assign this contract without our consent; we may assign it to a group company or on a sale of the business, with notice to you. Notices are sent to your account email or shown in the panel.",
        "These terms and the privacy policy are the entire agreement between you and Windoce LLC about the service. If a clause turns out to be invalid, the rest stays in force.",
      ],
    },
  ],
  contacto: {
    titulo: "Contact",
    con: "If you have questions about these terms, email us at",
    sin: "If you have questions about these terms, contact Tintora POS support.",
  },
};

export const PRIVACIDAD: Record<Idioma, DocumentoLegal> = { es: privacidadEs, en: privacidadEn };
export const TERMINOS: Record<Idioma, DocumentoLegal> = { es: terminosEs, en: terminosEn };
