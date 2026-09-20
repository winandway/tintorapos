import type { Guia } from "./tipos";

/**
 * El recorrido completo de una prenda, del mostrador a la entrega, con lo que
 * pasa con la etiqueta en cada paso. Nació de una pregunta de un dueño: «si le
 * quito las etiquetas a diez prendas para lavarlas, ¿cómo sé después cuál es
 * cuál?». La respuesta corta —la etiqueta NO se quita— es la primera línea.
 */
export const GUIAS_CAMINO: Guia[] = [
  {
    slug: "camino-de-una-prenda",
    seccion: "planta",
    icono: "capas",
    es: {
      titulo: "El camino de una prenda, paso a paso",
      resumen:
        "Del mostrador a la entrega: qué pasa con la etiqueta en cada paso, si se moja, y cómo sabes cuál prenda es cuál al sacarlas de la máquina.",
      bloques: [
        {
          t: "nota",
          tono: "importante",
          texto:
            "**La etiqueta NO se quita para lavar.** Va con la prenda todo el camino: recepción, lavado, planchado y ensamblado. Se retira al final, al empacar la orden. Por eso la etiqueta tiene que ser del material correcto, y por eso nunca hay que arrancarlas todas y ponerlas en una mesa: ahí se pierde la cuenta de cuál es cuál.",
        },
        { t: "h2", texto: "Paso 1 · Llega el cliente" },
        {
          t: "p",
          texto:
            "En el mostrador cuentas las prendas, marcas el color, la marca y los daños que trae cada una (botón roto, mancha, descosido), y cobras o dejas el saldo pendiente.",
        },
        { t: "captura", captura: "mostrador", pie: "Cada prenda con su color, sus marcas y su precio." },
        {
          t: "p",
          texto:
            "Al guardar salen **dos impresiones distintas**: el **recibo del cliente** (rollo de 80 mm) y **una etiqueta por prenda**. Mira [Impresoras de recibos y etiquetas](/docs/impresoras).",
        },
        { t: "h2", texto: "Paso 2 · Se etiqueta cada prenda" },
        {
          t: "p",
          texto:
            "Una etiqueta por prenda, no una por orden. Cada una trae el **número de la orden**, **qué pieza es** (Pieza 2 de 4), la prenda, el cliente, la fecha de entrega y su **código QR**.",
        },
        { t: "captura", captura: "etiquetas", pie: "Tres piezas de la orden #1001, cada una con su QR." },
        {
          t: "p",
          texto:
            "**Dónde se pone:** en la **etiqueta de cuidado** de la prenda (la de tela con las instrucciones de lavado) o en una costura interior. Nunca en la tela a la vista: puede dejar marca.",
        },
        {
          t: "lista",
          items: [
            "**Grapada** al cuello de la etiqueta de cuidado: lo más común y lo más barato.",
            "**Con alfiler de gancho**, para telas delicadas donde no quieres grapa.",
            "**Termosellada** (heat seal): una etiqueta de nylon que se pega con una planchita. Es la que usan las tintorerías grandes; aguanta todo y se puede dejar puesta varios servicios.",
          ],
        },
        { t: "h2", texto: "Paso 3 · Clasificar y tratar manchas" },
        {
          t: "p",
          texto:
            "Se separa por tipo de tela y color, y se tratan las manchas antes de lavar. Las marcas que pusiste en el mostrador le dicen al de planta qué revisar en cada pieza.",
        },
        { t: "h2", texto: "Paso 4 · Lavado (aquí está la pregunta de siempre)" },
        {
          t: "p",
          texto:
            "**La prenda entra a la máquina con su etiqueta puesta.** Así es como trabajan todas las tintorerías: las prendas de varios clientes se lavan juntas por tipo de tela, y lo único que dice de quién es cada una es la etiqueta.",
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Por eso el papel importa. La etiqueta térmica común de supermercado **se borra con el calor y se despega con el solvente**. Pide etiquetas o tags **para tintorería**: papel resistente a solvente para grapar, o termosellables de nylon. Cuestan centavos y te ahorran la peor discusión del negocio.",
        },
        {
          t: "lista",
          items: [
            "**Lavado en seco (percloro o hidrocarburo):** el tag de papel para tintorería aguanta sin problema.",
            "**Lavado con agua:** usa termosellable, o mete las piezas de una misma orden en una **bolsa de malla** con el tag por fuera.",
            "**Secadora y plancha:** el calor es el enemigo del papel térmico barato. Con tag de tintorería o termosellable no pasa nada.",
          ],
        },
        { t: "h2", texto: "Paso 5 · Planchado y acabado" },
        {
          t: "p",
          texto:
            "La prenda se plancha con su etiqueta puesta. Si la etiqueta estorba para planchar esa parte, se corre al otro lado de la costura; no se quita.",
        },
        { t: "h2", texto: "Paso 6 · Ensamblado: aquí el sistema te dice cuál es cuál" },
        {
          t: "p",
          texto:
            "Este es el paso que responde tu pregunta. Cuando sacas diez prendas de la máquina y están revueltas, **no tienes que adivinar nada**: escaneas el QR de cada etiqueta con la cámara del celular o con un lector, y la pantalla te dice a qué orden pertenece y cuántas piezas de esa orden faltan.",
        },
        {
          t: "captura",
          captura: "produccion",
          pie: "Producción: escaneas y la pieza se mueve sola de columna.",
        },
        {
          t: "pasos",
          items: [
            "Entra a **Producción**.",
            "Escanea la etiqueta de la prenda (cámara o lector).",
            "Elige si mueves **esa pieza** o **toda la orden**, y a qué estado.",
            "Cuelga la prenda en el sitio de esa orden.",
            "Cuando la última pieza de la orden queda **lista**, el sistema la marca lista y le avisa al cliente.",
          ],
        },
        {
          t: "captura",
          captura: "produccionCelular",
          pie: "Desde el celular del empleado, con la cámara.",
        },
        {
          t: "p",
          texto:
            "En el detalle de la orden ves **cada pieza con su etiqueta y su estado**, así que en cualquier momento sabes cuántas van y cuál falta.",
        },
        { t: "captura", captura: "orden", pie: "La orden por dentro: pieza por pieza." },
        { t: "h2", texto: "Paso 7 · Al rack, con su ubicación" },
        {
          t: "p",
          texto:
            "Cuando la orden queda lista, escribe su **ubicación en el rack** (por ejemplo B-12). Al entregar, la pantalla se la dice al cajero y nadie camina de más buscando.",
        },
        { t: "h2", texto: "Paso 8 · Entrega: aquí sí se quitan las etiquetas" },
        {
          t: "p",
          texto:
            "El cliente llega con su recibo (o solo dice su teléfono). Buscas, cobras el saldo y entregas. **Las etiquetas se retiran al empacar**, justo antes de meter la ropa en la funda.",
        },
        { t: "captura", captura: "entrega", pie: "Entrega: cobra el saldo y cierra la orden." },
        { t: "h2", texto: "¿Y si se cae una etiqueta?" },
        {
          t: "pasos",
          items: [
            "Busca la orden por el teléfono o el nombre del cliente en **Órdenes**.",
            "Abre la orden y compara: cada pieza tiene su prenda, su color y las marcas que anotaste al recibirla.",
            "Cuando la identifiques, vuelve a imprimir solo esa etiqueta desde el detalle de la orden (reimprimir etiquetas no pide autorización).",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Por eso vale la pena marcar el color y los daños en el mostrador: es lo que te salva cuando una etiqueta se suelta.",
        },
        { t: "h2", texto: "Qué etiquetas comprar" },
        {
          t: "lista",
          items: [
            "**Tag de papel para tintorería, 3 × 1 pulgadas, para grapar.** Lo más usado. En el sistema elige el formato **Tag para grapar**.",
            "**Rollo de etiquetas adhesivas de 2 × 1 pulgadas** resistentes a solvente. Formato **Rollo 2 × 1**.",
            "**Termosellables de nylon** (necesitan una planchita selladora). Son las más duraderas.",
            "**Hojas de etiquetas adhesivas tamaño carta** si todavía no tienes impresora de etiquetas. Formato **Hoja carta**: salen 30 por hoja.",
          ],
        },
        {
          t: "captura",
          captura: "etiquetasPantalla",
          pie: "El tamaño se elige arriba y esa computadora lo recuerda.",
        },
      ],
    },
    en: {
      titulo: "A garment's journey, step by step",
      resumen:
        "From the counter to pickup: what happens to the tag at every step, whether it gets wet, and how you know which garment is which when they come out of the machine.",
      bloques: [
        {
          t: "nota",
          tono: "importante",
          texto:
            "**The tag does NOT come off for cleaning.** It travels with the garment the whole way: intake, cleaning, pressing and assembly. It comes off at the end, when the order is bagged. That's why the tag has to be the right material, and why you never rip ten tags off and pile them on a table: that's exactly how you lose track of which is which.",
        },
        { t: "h2", texto: "Step 1 · The customer walks in" },
        {
          t: "p",
          texto:
            "At the counter you count the garments, mark the color, the brand and whatever damage each one has (broken button, stain, loose seam), and take payment or leave a balance.",
        },
        { t: "captura", captura: "mostrador", pie: "Every garment with its color, its marks and its price." },
        {
          t: "p",
          texto:
            "Saving prints **two different things**: the **customer receipt** (80 mm roll) and **one tag per garment**. See [Receipt and tag printers](/docs/impresoras).",
        },
        { t: "h2", texto: "Step 2 · Tag every garment" },
        {
          t: "p",
          texto:
            "One tag per garment, not one per order. Each tag carries the **order number**, **which piece it is** (Piece 2 of 4), the garment, the customer, the due date and its **QR code**.",
        },
        { t: "captura", captura: "etiquetas", pie: "Three pieces of order #1001, each with its QR code." },
        {
          t: "p",
          texto:
            "**Where it goes:** on the garment's **care label** (the fabric one with the washing instructions) or on an inside seam. Never on visible fabric: it can leave a mark.",
        },
        {
          t: "lista",
          items: [
            "**Stapled** to the neck of the care label: the most common and the cheapest.",
            "**With a safety pin**, for delicate fabrics where you don't want a staple.",
            "**Heat-sealed**: a nylon label pressed on with a small sealer. It's what big cleaners use; it survives everything and can stay on for several visits.",
          ],
        },
        { t: "h2", texto: "Step 3 · Sort and treat stains" },
        {
          t: "p",
          texto:
            "Garments are split by fabric and color, and stains are treated before cleaning. The marks you entered at the counter tell the plant what to look at on each piece.",
        },
        { t: "h2", texto: "Step 4 · Cleaning (the question everyone asks)" },
        {
          t: "p",
          texto:
            "**The garment goes into the machine with its tag on.** That's how every dry cleaner works: garments from several customers are cleaned together by fabric type, and the only thing that says whose is whose is the tag.",
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "That's why the paper matters. A plain thermal sticker from the office store **fades with heat and peels off with solvent**. Ask for tags made **for dry cleaners**: solvent-resistant paper for stapling, or heat-seal nylon. They cost pennies and save you the worst argument in the business.",
        },
        {
          t: "lista",
          items: [
            "**Dry cleaning (perc or hydrocarbon):** a dry cleaner's paper tag holds up fine.",
            "**Wet cleaning:** use heat-seal, or put the pieces of one order in a **mesh bag** with the tag outside.",
            "**Dryer and press:** heat is the enemy of cheap thermal paper. With a proper tag or heat-seal, nothing happens.",
          ],
        },
        { t: "h2", texto: "Step 5 · Pressing and finishing" },
        {
          t: "p",
          texto:
            "The garment is pressed with its tag on. If the tag is in the way, move it to the other side of the seam; don't take it off.",
        },
        { t: "h2", texto: "Step 6 · Assembly: this is where the system tells you which is which" },
        {
          t: "p",
          texto:
            "This is the step that answers your question. When ten garments come out of the machine all mixed up, **you don't have to guess anything**: scan each tag's QR with the phone camera or a scanner, and the screen tells you which order it belongs to and how many pieces of that order are still missing.",
        },
        {
          t: "captura",
          captura: "produccion",
          pie: "Production: you scan and the piece moves column by itself.",
        },
        {
          t: "pasos",
          items: [
            "Go to **Production**.",
            "Scan the garment's tag (camera or scanner).",
            "Choose whether you move **that piece** or **the whole order**, and to which status.",
            "Hang the garment in that order's spot.",
            "When the last piece of the order is **ready**, the system marks the order ready and notifies the customer.",
          ],
        },
        {
          t: "captura",
          captura: "produccionCelular",
          pie: "From the employee's phone, using the camera.",
        },
        {
          t: "p",
          texto:
            "The order detail shows **each piece with its tag and its status**, so at any moment you know how many are done and which one is missing.",
        },
        { t: "captura", captura: "orden", pie: "Inside the order: piece by piece." },
        { t: "h2", texto: "Step 7 · Onto the rack, with its location" },
        {
          t: "p",
          texto:
            "When the order is ready, write its **rack location** (B-12, for example). At pickup the screen tells the cashier, and nobody walks around hunting for it.",
        },
        { t: "h2", texto: "Step 8 · Pickup: now the tags come off" },
        {
          t: "p",
          texto:
            "The customer shows up with their receipt (or just says their phone number). You search, collect the balance and hand it over. **Tags come off at bagging**, right before the clothes go into the garment bag.",
        },
        { t: "captura", captura: "entrega", pie: "Pickup: collect the balance and close the order." },
        { t: "h2", texto: "What if a tag falls off?" },
        {
          t: "pasos",
          items: [
            "Find the order by the customer's phone or name in **Orders**.",
            "Open the order and compare: every piece has its garment, its color and the marks you wrote down at intake.",
            "Once you've identified it, reprint just that tag from the order detail (reprinting tags doesn't need approval).",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "That's why marking color and damage at the counter pays off: it's what saves you when a tag comes loose.",
        },
        { t: "h2", texto: "Which tags to buy" },
        {
          t: "lista",
          items: [
            "**Dry cleaner paper tag, 3 × 1 inches, for stapling.** The most used. In the system pick the **Staple tag** size.",
            "**Roll of 2 × 1 inch adhesive labels** that are solvent resistant. Size **Roll 2 × 1**.",
            "**Heat-seal nylon labels** (they need a small sealer). The most durable.",
            "**Letter-size adhesive label sheets** if you don't have a label printer yet. Size **Letter sheet**: 30 per sheet.",
          ],
        },
        {
          t: "captura",
          captura: "etiquetasPantalla",
          pie: "You pick the size up top and that computer remembers it.",
        },
      ],
    },
  },
];
