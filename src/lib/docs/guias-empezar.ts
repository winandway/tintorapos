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
            "Para el lavado por peso, llena el **Precio por kilo** (o **por libra**). La unidad la eliges en **Ajustes → Tienda → La ropa por peso se cobra en**: kilos o libras. De fábrica sale en libras en EE.UU. y Puerto Rico, y en kilos en el resto del mundo.",
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
            "For wash & fold, fill in the **Price per pound** (or **per kilo**). You pick the unit under **Settings → Store → By-weight laundry is charged in**: pounds or kilos. It defaults to pounds in the U.S. and Puerto Rico, and kilos everywhere else.",
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
        { t: "h2", texto: "Conectar un celular escaneando un QR" },
        {
          t: "p",
          texto:
            "Para que un empleado use su celular (por ejemplo, para marcar prendas listas en la planta sin cargar la tablet) no hace falta darle la contraseña del dueño.",
        },
        {
          t: "pasos",
          items: [
            "En la tablet ve a **Ajustes → Dispositivos → Conectar un celular**.",
            "Escribe un nombre, como «Celular de planta», y toca **Mostrar el código**.",
            "En el celular, abre la cámara, apúntala al código y toca el aviso que aparece.",
            "El celular queda registrado y cae en la pantalla de PIN: el empleado toca su nombre y escribe su PIN.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "El código vence en 10 minutos y sirve una sola vez. Si alguien más lo escanea antes, pide otro y listo: con el código solo no se entra a nada, siempre hace falta el PIN.",
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
        { t: "h2", texto: "Connect a phone by scanning a QR" },
        {
          t: "p",
          texto:
            "To let an employee use their own phone (for example, to mark items ready in the plant without carrying the tablet), you don’t have to share the owner’s password.",
        },
        {
          t: "pasos",
          items: [
            "On the tablet go to **Settings → Devices → Connect a phone**.",
            "Type a name, such as “Plant phone”, and tap **Show the code**.",
            "On the phone, open the camera, point it at the code and tap the notification that appears.",
            "The phone is registered and lands on the PIN screen: the employee taps their name and types their PIN.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "The code expires in 10 minutes and works only once. If someone else scans it first, just ask for another one: the code alone opens nothing — the PIN is always required.",
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
      resumen:
        "Qué impresoras sirven, cómo conectar la de recibos y la de etiquetas, cómo probarlas sin comprar nada y cómo reimprimir.",
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
        { t: "h2", texto: "¿Una impresora o dos?" },
        {
          t: "p",
          texto:
            "Lo definitivo son **dos**, y son distintas: la **térmica de recibos** (rollo de 80 mm) saca el recibo del cliente, y la **impresora de etiquetas** saca la etiqueta o el tag de cada prenda. Las dos se conectan en **Ajustes → Impresoras**, cada una en su tarjeta, y el equipo las recuerda por separado.",
        },
        {
          t: "p",
          texto:
            "Pero puedes **empezar con una sola**. En la tarjeta **Impresora de etiquetas** elige **En la misma impresora de recibos**: cada etiqueta sale en papel de recibo, cortada, con su número en grande y su QR. Sirve para probar todo el recorrido hoy mismo y para salir del paso.",
        },
        { t: "captura", captura: "impresoras" },
        {
          t: "nota",
          tono: "importante",
          texto:
            "El papel térmico de recibo **se oscurece con el calor de la plancha y se borra con el solvente**. Para el trabajo de todos los días usa tags o etiquetas **para tintorería** en una impresora de etiquetas. Mira [El camino de una prenda](/docs/camino-de-una-prenda).",
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "¿Todavía no tienes etiquetera? En la pantalla de etiquetas elige **Hoja carta (30 etiquetas)** e imprime en tu impresora normal con hojas de etiquetas adhesivas de 2⅝ × 1 pulgadas (las de tipo Avery 5160). Salen 30 por hoja.",
        },
        { t: "h2", texto: "El tamaño de la etiqueta (por la ventana del navegador)" },
        {
          t: "p",
          texto:
            "Arriba de la pantalla de etiquetas hay un selector con cuatro tamaños. Se elige una vez y **esa computadora lo recuerda**:",
        },
        {
          t: "lista",
          items: [
            "**Rollo 2 × 1 pulgadas**: el más común en tintorerías. Una etiqueta por etiqueta del rollo.",
            "**Rollo 2¼ × 1¼ pulgadas**: si tu rollo es un poco más grande.",
            "**Hoja carta (30 etiquetas)**: para impresora normal con hojas adhesivas.",
            "**Rollo de recibos (80 mm)**: sale por la misma impresora del recibo, para salir del paso.",
          ],
        },
        { t: "h2", texto: "Conectar la impresora de recibos (de un toque, sin ventanas)" },
        {
          t: "p",
          texto:
            "La forma buena de imprimir el recibo es **conectar la impresora directo a Tintora POS**. No pasa por la ventana de imprimir del navegador ni por los programas del sistema: tocas **Imprimir recibo** y sale el papel.",
        },
        {
          t: "pasos",
          items: [
            "En la computadora del mostrador, abre Tintora POS en **Chrome** o **Edge**.",
            "Entra a **Ajustes → Impresoras**.",
            "Toca **Conectar impresora USB**. Sale una lista con lo que está enchufado: elige tu impresora y toca **Conectar**.",
            "Toca **Imprimir una prueba**. Si sale el papel con los acentos bien y un código QR abajo, quedó lista.",
            "Elige el **ancho del papel** (80 mm o 58 mm) y, si tienes cajón de dinero enchufado a la impresora, marca que se abra con el recibo.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Se conecta **una vez por computadora**. La tablet del mostrador tiene su impresora; tu celular no, y está bien: desde ahí no imprimes.",
        },
        { t: "h2", texto: "Conectar la impresora de etiquetas" },
        {
          t: "pasos",
          items: [
            "Enchufa la impresora de etiquetas por USB a la computadora del mostrador y ponle su rollo.",
            "En **Ajustes → Impresoras**, baja a la tarjeta **Impresora de etiquetas** y elige **En una etiquetera conectada**.",
            "Toca **Conectar impresora USB**, elige tu etiquetera en la lista y toca **Conectar**.",
            "Elige el **idioma de la etiquetera**: **TSPL** para casi todas las económicas (Rollo, Munbyn, Polono, iDPRT, TSC, Xprinter) o **ZPL** si es una Zebra. Viene en la caja o en el manual.",
            "Elige el **tamaño de la etiqueta** de tu rollo: 2 × 1, 2¼ × 1¼ o 3 × 1 pulgadas.",
            "Toca **Imprimir una etiqueta de prueba**. Tiene que salir UNA etiqueta, con el QR a la izquierda y el texto a la derecha. Escanea el QR con tu celular.",
          ],
        },
        { t: "captura", captura: "etiquetaDirecta" },
        {
          t: "p",
          texto:
            "Desde ese momento, **Imprimir etiquetas** en el mostrador y dentro de la orden las manda directo: una por prenda, de un toque, sin la ventana de imprimir.",
        },
        { t: "h2", texto: "Si la etiqueta de prueba sale mal" },
        {
          t: "lista",
          items: [
            "**No sale nada, o sale una tira de letras:** el idioma elegido no es el de tu impresora. Cambia de TSPL a ZPL (o al revés) y prueba otra vez.",
            "**Sale corrida o salta etiquetas en blanco:** el tamaño elegido no es el de tu rollo. Cámbialo. Si sigue igual, haz que la impresora mida su rollo (en su manual aparece como «calibrar»; casi siempre es mantener presionado el botón de avance).",
            "**Sale de cabeza:** no es un fallo; depende del lado por el que sale el papel. Se lee y se escanea igual.",
            "**Dice que el sistema tiene tomada la impresora:** estás en Windows. Conéctala por **puerto serie (COM)** o deja las etiquetas por la ventana del navegador.",
          ],
        },
        { t: "h2", texto: "Probar las etiquetas sin tener etiquetera" },
        {
          t: "pasos",
          items: [
            "Conecta tu impresora de recibos, como se explica arriba.",
            "En la tarjeta **Impresora de etiquetas** elige **En la misma impresora de recibos** y toca **Imprimir una etiqueta de prueba**.",
            "Crea una orden de prueba con dos o tres prendas y toca **Imprimir etiquetas**: sale una por prenda, cortada.",
            "Abre **Producción** en tu celular y escanea cada QR con la cámara: la prenda correcta cambia de estado.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Así pruebas todo el recorrido —el botón, los datos de cada prenda, el QR y el escaneo— con la impresora que ya tienes. Cuando compres la etiquetera, lo único que cambia es el papel.",
        },
        { t: "h2", texto: "Qué impresora de etiquetas comprar" },
        {
          t: "lista",
          items: [
            "**De transferencia térmica (la que lleva cinta), de 203 puntos por pulgada y con USB.** Con **cinta de resina** la letra aguanta el solvente, el lavado y la plancha. Una térmica directa (sin cinta) es más barata y sirve para probar, pero su impresión se borra con el calor.",
            "Modelos que se consiguen fácil en Latinoamérica: **TSC TE200** (habla TSPL) y **Zebra ZD220 o ZD230 de transferencia térmica** (hablan ZPL).",
            "**Que hable TSPL o ZPL.** Casi todas las Rollo, Munbyn, Polono, iDPRT, TSC y Xprinter hablan TSPL; las Zebra hablan ZPL. Las dos sirven.",
            "**Evita las que solo funcionan con su propia app del celular** (muchas pequeñas por Bluetooth, de «etiquetas para la casa»): no aceptan órdenes de otro programa.",
            "**Dymo y Brother QL** usan un idioma propio. Funcionan con Tintora POS, pero por la **ventana del navegador**, no directo.",
            "Compra con ella el papel correcto: **cinta de resina** y tags para grapar o etiquetas **para tintorería**, que resisten el solvente y el calor.",
          ],
        },
        { t: "h2", texto: "Según tu equipo" },
        {
          t: "lista",
          items: [
            "**Mac, Chromebook, Linux o tablet Android:** conexión directa por USB. Es el camino más limpio.",
            "**Windows:** el programa de la impresora acapara el USB y no deja que nadie más le hable. Tienes dos salidas: conectarla por **puerto serie (COM)** si tu impresora lo trae, o usar el **modo silencioso de Chrome** que está aquí abajo.",
            "**iPad o iPhone:** el sistema no deja que una página hable directo con la impresora. Se imprime por **AirPrint**, con la ventana de imprimir.",
          ],
        },
        { t: "h2", texto: "Windows: que el recibo salga sin la ventana de imprimir" },
        {
          t: "pasos",
          items: [
            "En Windows, pon tu impresora de recibos como **predeterminada** (Configuración → Bluetooth y dispositivos → Impresoras y escáneres).",
            "Imprime un recibo una vez con la ventana normal: elige tu impresora en **Destino**, márgenes en **Ninguno**, escala **100 %**. Chrome lo recuerda.",
            "Haz clic derecho en el escritorio → **Nuevo → Acceso directo**, y pega este destino:",
          ],
        },
        {
          t: "codigo",
          etiqueta: "Va en la casilla «Escriba la ubicación del elemento»",
          texto:
            '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --kiosk-printing https://tintorapos.com/app',
        },
        {
          t: "p",
          texto:
            "Ponle de nombre **Tintora POS** y abre el sistema SIEMPRE desde ese acceso directo. Desde ahí, al tocar imprimir, el papel sale solo, sin ventana.",
        },
        { t: "h2", texto: "Mi impresora está prendida y no imprime" },
        {
          t: "pasos",
          items: [
            "En la ventana de imprimir, mira la casilla **Destino**. Si dice **Guardar como PDF**, ahí está el problema: tócala, elige **Ver más…** y selecciona tu impresora. Chrome se acuerda para la próxima.",
            "Si tu impresora **no aparece** en esa lista, la computadora no la tiene instalada. Instala el programa del fabricante (en Mac: Ajustes → Impresoras y escáneres → agregar).",
            "Si en **Ajustes → Impresoras** dice que *el sistema tiene tomada la impresora*, estás en Windows: usa el puerto serie o el modo silencioso de arriba.",
            "Si sale **papel en blanco o letras raras**, esa impresora no habla el idioma de las de recibos (ESC/POS). Suele ser una etiquetera: conéctala en la tarjeta **Impresora de etiquetas**, no en la de recibos.",
            "Si por puerto serie sale basura, cambia la **velocidad del puerto**: lo más común es 9600 o 115200.",
          ],
        },
        { t: "h2", texto: "Imprimir con la ventana del navegador (el respaldo)" },
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
        { t: "h2", texto: "Para que aparezca en la ventana de imprimir" },
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
      resumen:
        "Which printers work, how to connect the receipt printer and the tag printer, how to test them without buying anything, and how to reprint.",
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
        { t: "h2", texto: "One printer or two?" },
        {
          t: "p",
          texto:
            "The permanent setup is **two**, and they're different: the **thermal receipt printer** (80 mm roll) prints the customer receipt, and the **tag printer** prints the label or tag for each garment. You connect both under **Settings → Printers**, each in its own card, and the device remembers them separately.",
        },
        {
          t: "p",
          texto:
            "But you can **start with just one**. In the **Tag printer** card choose **On the same receipt printer**: each tag comes out on receipt paper, cut, with its number in large type and its QR code. It lets you test the whole workflow today and works as a stopgap.",
        },
        { t: "captura", captura: "impresoras" },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Thermal receipt paper **darkens under the heat of pressing and fades in solvent**. For everyday work, use **dry-cleaning** tags or labels in a label printer. See [A garment's journey](/docs/camino-de-una-prenda).",
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "No label printer yet? On the tags screen pick **Letter sheet (30 labels)** and print on your regular printer with 2⅝ × 1 inch adhesive label sheets (Avery 5160 style). You get 30 per sheet.",
        },
        { t: "h2", texto: "Tag size (through the browser window)" },
        {
          t: "p",
          texto:
            "At the top of the tags screen there's a size picker with four options. You choose once and **that computer remembers it**:",
        },
        {
          t: "lista",
          items: [
            "**Roll 2 × 1 inches**: the most common in dry cleaners. One tag per label on the roll.",
            "**Roll 2¼ × 1¼ inches**: if your roll is a bit bigger.",
            "**Letter sheet (30 labels)**: for a regular printer with adhesive sheets.",
            "**Receipt roll (80 mm)**: comes out of the same receipt printer, to get by for now.",
          ],
        },
        { t: "h2", texto: "Connect the receipt printer (one tap, no windows)" },
        {
          t: "p",
          texto:
            "The right way to print a receipt is to **connect the printer straight to Tintora POS**. It skips the browser's print window and the system's printer software: you tap **Print receipt** and the paper comes out.",
        },
        {
          t: "pasos",
          items: [
            "On the counter computer, open Tintora POS in **Chrome** or **Edge**.",
            "Go to **Settings → Printers**.",
            "Tap **Connect USB printer**. You'll see a list of what's plugged in: pick your printer and tap **Connect**.",
            "Tap **Print a test**. If the paper comes out with a QR code at the bottom, you're set.",
            "Pick the **paper width** (80 mm or 58 mm) and, if a cash drawer is plugged into the printer, check that it opens with the receipt.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "You connect it **once per computer**. The counter tablet has its printer; your phone doesn't, and that's fine: you don't print from there.",
        },
        { t: "h2", texto: "Connect the tag printer" },
        {
          t: "pasos",
          items: [
            "Plug the label printer into the counter computer by USB and load its roll.",
            "Under **Settings → Printers**, scroll to the **Tag printer** card and choose **On a connected label printer**.",
            "Tap **Connect USB printer**, pick your label printer from the list and tap **Connect**.",
            "Pick the **label printer language**: **TSPL** for almost every budget model (Rollo, Munbyn, Polono, iDPRT, TSC, Xprinter) or **ZPL** for a Zebra. It's on the box or in the manual.",
            "Pick the **tag size** on your roll: 2 × 1, 2¼ × 1¼ or 3 × 1 inches.",
            "Tap **Print a test tag**. ONE tag should come out, with the QR code on the left and the text on the right. Scan the QR code with your phone.",
          ],
        },
        { t: "captura", captura: "etiquetaDirecta" },
        {
          t: "p",
          texto:
            "From then on, **Print tags** at the counter and inside the order sends them straight to the printer: one per garment, in one tap, with no print window.",
        },
        { t: "h2", texto: "If the test tag comes out wrong" },
        {
          t: "lista",
          items: [
            "**Nothing prints, or you get a strip of letters:** the language you picked isn't your printer's. Switch from TSPL to ZPL (or the other way around) and try again.",
            "**It prints off-center or skips blank labels:** the size you picked isn't your roll's. Change it. If it keeps happening, have the printer measure its roll (the manual calls it “calibrate”; it's almost always holding down the feed button).",
            "**It comes out upside down:** that's not a fault; it depends on which side the paper exits. It reads and scans the same.",
            "**It says the system is holding the printer:** you're on Windows. Connect it by **serial port (COM)** or keep tags on the browser window.",
          ],
        },
        { t: "h2", texto: "Test tags without owning a label printer" },
        {
          t: "pasos",
          items: [
            "Connect your receipt printer, as explained above.",
            "In the **Tag printer** card choose **On the same receipt printer** and tap **Print a test tag**.",
            "Create a test order with two or three garments and tap **Print tags**: one comes out per garment, cut.",
            "Open **Production** on your phone and scan each QR code with the camera: the right garment changes status.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "That tests the whole workflow — the button, each garment's data, the QR code and the scan — with the printer you already own. When you buy a label printer, the only thing that changes is the paper.",
        },
        { t: "h2", texto: "Which label printer to buy" },
        {
          t: "lista",
          items: [
            "**Thermal transfer (the kind that uses a ribbon), 203 dpi, with USB.** With a **resin ribbon** the print stands up to solvent, washing and pressing. A direct thermal printer (no ribbon) is cheaper and fine for testing, but its print fades with heat.",
            "Easy-to-find models: **TSC TE200** (speaks TSPL) and **Zebra ZD220 or ZD230 thermal transfer** (speak ZPL).",
            "**It should speak TSPL or ZPL.** Nearly all Rollo, Munbyn, Polono, iDPRT, TSC and Xprinter models speak TSPL; Zebra printers speak ZPL. Both work.",
            "**Avoid the ones that only work with their own phone app** (many small Bluetooth “home label” printers): they don't take commands from other software.",
            "**Dymo and Brother QL** use their own language. They work with Tintora POS, but through the **browser window**, not directly.",
            "Buy the right supplies with it: a **resin ribbon** and staple tags or **dry-cleaning** labels that stand up to solvent and heat.",
          ],
        },
        { t: "h2", texto: "Depending on your device" },
        {
          t: "lista",
          items: [
            "**Mac, Chromebook, Linux or Android tablet:** direct USB connection. It's the cleanest path.",
            "**Windows:** the printer's own software holds the USB and won't let anyone else talk to it. Two ways out: connect it by **serial port (COM)** if your printer has one, or use **Chrome's silent mode** right below.",
            "**iPad or iPhone:** the system doesn't let a page talk straight to the printer. You print through **AirPrint**, with the print window.",
          ],
        },
        { t: "h2", texto: "Windows: print the receipt without the print window" },
        {
          t: "pasos",
          items: [
            "In Windows, set your receipt printer as the **default** (Settings → Bluetooth & devices → Printers & scanners).",
            "Print one receipt with the normal window: pick your printer under **Destination**, margins **None**, scale **100%**. Chrome remembers.",
            "Right-click the desktop → **New → Shortcut**, and paste this target:",
          ],
        },
        {
          t: "codigo",
          etiqueta: "Goes in the “Type the location of the item” box",
          texto:
            '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --kiosk-printing https://tintorapos.com/app',
        },
        {
          t: "p",
          texto:
            "Name it **Tintora POS** and ALWAYS open the system from that shortcut. From there, tapping print sends the paper out by itself, no window.",
        },
        { t: "h2", texto: "My printer is on and nothing prints" },
        {
          t: "pasos",
          items: [
            "In the print window, look at the **Destination** box. If it says **Save as PDF**, that's the problem: tap it, choose **See more…** and select your printer. Chrome remembers it next time.",
            "If your printer **isn't on that list**, the computer doesn't have it installed. Install the manufacturer's software (on Mac: Settings → Printers & Scanners → add).",
            "If **Settings → Printers** says *the system is holding the printer*, you're on Windows: use the serial port or the silent mode above.",
            "If **blank paper or strange letters** come out, that printer doesn't speak the receipt-printer language (ESC/POS). It's usually a label printer: connect it in the **Tag printer** card, not the receipt one.",
            "If garbage comes out over the serial port, change the **port speed**: 9600 or 115200 are the most common.",
          ],
        },
        { t: "h2", texto: "Printing with the browser window (the fallback)" },
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
        { t: "h2", texto: "So it shows up in the print window" },
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
