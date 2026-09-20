import type { Guia } from "./tipos";

export const GUIAS_CONTABILIDAD: Guia[] = [
  {
    slug: "contabilidad",
    seccion: "contabilidad",
    icono: "libro",
    es: {
      titulo: "La contabilidad de tu tintorería",
      resumen: "Cuánto entró, cuánto salió y cuánto te quedó, con los números que de verdad manda el oficio.",
      bloques: [
        {
          t: "p",
          texto:
            "En **Contabilidad** ves tu negocio completo: las ventas que cobraste, todo lo que sale de la caja y la ganancia que queda. No hace falta saber contabilidad: se llenan dos o tres casillas y el programa hace las cuentas.",
        },
        { t: "h2", texto: "Ganancia" },
        {
          t: "p",
          texto:
            "La primera pantalla resta los gastos de las ventas del período. Abajo ves en qué se fue el dinero, agrupado (local, servicios, gente, máquinas, reparto, venta, oficina) y con el detalle de cada categoría.",
        },
        {
          t: "lista",
          items: [
            "**Margen**: lo que queda de cada dólar que entra. En el oficio, lo normal es entre 20 % y 35 %.",
            "**Sueldos sobre la venta**: lo normal es entre 10 % y 20 %.",
            "**Luz, agua y gas sobre la venta**: lo normal es entre 15 % y 25 %. Si sube de ahí, revisa la caldera y los horarios de máquina.",
          ],
        },
        { t: "h2", texto: "Gastos" },
        {
          t: "pasos",
          items: [
            "Toca **Contabilidad** y después **Gastos**.",
            "Toca **Registrar gasto**.",
            "Elige la fecha, la categoría (renta, luz, sueldos, mantenimiento…) y escribe el monto.",
            "Di cómo se pagó y, si quieres, a qué proveedor o a qué empleado fue.",
            "Guarda. Al momento se ve en la ganancia.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Los gastos que nacen de una compra a proveedor no se editan aquí: se cambian desde **Compras**, para que los dos números nunca se contradigan.",
        },
        { t: "h2", texto: "Por cobrar" },
        {
          t: "p",
          texto:
            "Si le facturas a hoteles, restaurantes o consultorios, **Por cobrar** te dice quién debe, cuánto y desde cuándo, repartido en 0–10, 11–30, 31–60 y más de 60 días. Lo que pase de 60 días es lo primero que hay que llamar.",
        },
        { t: "h2", texto: "Impuestos" },
        {
          t: "p",
          texto:
            "**Impuestos** separa la venta gravada de la exenta y te dice cuánto impuesto cobraste en el período: es lo que tu contador necesita para declarar. El programa no presenta la declaración por ti.",
        },
        { t: "h2", texto: "El archivo para el contador" },
        {
          t: "p",
          texto:
            "El botón **Archivo para el contador** baja un solo archivo con el libro del período: las ventas de cada día, cada gasto, cada compra y el impuesto. Se abre en Excel y se carga en cualquier programa de contabilidad.",
        },
      ],
    },
    en: {
      titulo: "Your dry cleaner's books",
      resumen: "What came in, what went out and what's left, with the numbers the trade actually runs on.",
      bloques: [
        {
          t: "p",
          texto:
            "**Accounting** shows the whole business: the sales you collected, everything that leaves the register and the profit that's left. You don't need to know bookkeeping: fill in two or three boxes and the software does the math.",
        },
        { t: "h2", texto: "Profit" },
        {
          t: "p",
          texto:
            "The first screen subtracts expenses from the period's sales. Below it you see where the money went, grouped (premises, utilities, people, equipment, delivery, selling, office) and broken down by category.",
        },
        {
          t: "lista",
          items: [
            "**Margin**: what's left of every dollar that comes in. In this trade, 20% to 35% is normal.",
            "**Wages against sales**: 10% to 20% is normal.",
            "**Power, water and gas against sales**: 15% to 25% is normal. Higher than that, check the boiler and your machine hours.",
          ],
        },
        { t: "h2", texto: "Expenses" },
        {
          t: "pasos",
          items: [
            "Tap **Accounting**, then **Expenses**.",
            "Tap **Record expense**.",
            "Pick the date, the category (rent, power, wages, maintenance…) and type the amount.",
            "Say how it was paid and, if you want, which supplier or employee it went to.",
            "Save. It shows up in the profit right away.",
          ],
        },
        {
          t: "nota",
          tono: "importante",
          texto:
            "Expenses that come from a supplier purchase aren't edited here: change them from **Purchases**, so the two numbers can never disagree.",
        },
        { t: "h2", texto: "Receivables" },
        {
          t: "p",
          texto:
            "If you invoice hotels, restaurants or clinics, **Receivables** tells you who owes you, how much and since when, split into 0–10, 11–30, 31–60 and over 60 days. Anything past 60 days is the first call you should make.",
        },
        { t: "h2", texto: "Sales tax" },
        {
          t: "p",
          texto:
            "**Sales tax** separates taxable from exempt sales and tells you how much tax you collected in the period: exactly what your accountant needs to file. The software doesn't file for you.",
        },
        { t: "h2", texto: "The file for your accountant" },
        {
          t: "p",
          texto:
            "The **File for your accountant** button downloads a single file with the period's ledger: each day's sales, every expense, every purchase and the tax. It opens in Excel and loads into any accounting program.",
        },
      ],
    },
  },
  {
    slug: "insumos-y-compras",
    seccion: "contabilidad",
    icono: "capas",
    es: {
      titulo: "Insumos, compras y proveedores",
      resumen:
        "Ganchos, bolsas y detergente: cuánto queda, cuándo pedir más y cuánto le debes a cada proveedor.",
      bloques: [
        {
          t: "p",
          texto:
            "Los insumos son lo que se gasta EN la ropa y sube con el volumen del día: ganchos, bolsas, detergente, solvente, quitamanchas, hombreras.",
        },
        { t: "h2", texto: "Cargar tus insumos" },
        {
          t: "pasos",
          items: [
            "Entra a **Contabilidad → Insumos**.",
            "Toca **Agregar los de siempre** y el programa crea en cero los que usa toda tintorería.",
            "Abre cada uno y pon **Avisarme cuando baje de**: cuando la existencia llegue ahí, sale el aviso de **Hay que pedir**.",
          ],
        },
        { t: "h2", texto: "Registrar una compra" },
        {
          t: "pasos",
          items: [
            "Entra a **Contabilidad → Compras** y toca **Registrar compra**.",
            "Elige el proveedor y escribe el número de factura.",
            "Agrega un renglón por cosa comprada: el insumo, cuántos y a cuánto.",
            "Si la pagaste ahí mismo, deja marcado **Pagado ahora**; si te la fiaron, quítalo.",
            "Guarda: sube la existencia de cada insumo y el gasto entra solo en la ganancia.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "Cuando le pagues una factura que debías, abre el menú **⋮** de esa compra y toca **Abonar**.",
        },
        { t: "h2", texto: "Cuando se gasta un insumo" },
        {
          t: "p",
          texto:
            "Toca **Sumar o restar** en el insumo y escribe la cantidad con el signo menos para descontar lo que se usó o se dañó. Queda el movimiento con su motivo.",
        },
        { t: "h2", texto: "Proveedores" },
        {
          t: "p",
          texto:
            "En **Proveedores** guardas a quién le compras, su teléfono y a cuántos días te da para pagar. Cada ficha te dice cuánto le has comprado y cuánto le debes hoy.",
        },
      ],
    },
    en: {
      titulo: "Supplies, purchases and suppliers",
      resumen:
        "Hangers, bags and detergent: what's left, when to reorder and how much you owe each supplier.",
      bloques: [
        {
          t: "p",
          texto:
            "Supplies are what gets used ON the garments and goes up with the day's volume: hangers, bags, detergent, solvent, spotting chemicals, shoulder guards.",
        },
        { t: "h2", texto: "Load your supplies" },
        {
          t: "pasos",
          items: [
            "Go to **Accounting → Supplies**.",
            "Tap **Add the usual ones** and the software creates, at zero, the ones every dry cleaner uses.",
            "Open each one and set **Warn me when it drops below**: when stock hits that number, the **Time to reorder** flag shows up.",
          ],
        },
        { t: "h2", texto: "Record a purchase" },
        {
          t: "pasos",
          items: [
            "Go to **Accounting → Purchases** and tap **Record purchase**.",
            "Pick the supplier and type the invoice number.",
            "Add one line per item: the supply, how many and at what cost.",
            "If you paid on the spot, leave **Paid now** checked; if they billed you, uncheck it.",
            "Save: stock goes up for each supply and the expense lands in your profit by itself.",
          ],
        },
        {
          t: "nota",
          tono: "consejo",
          texto:
            "When you pay an invoice you owed, open that purchase's **⋮** menu and tap **Make a payment**.",
        },
        { t: "h2", texto: "When a supply gets used" },
        {
          t: "p",
          texto:
            "Tap **Add or subtract** on the supply and type the amount with a minus sign to take out what was used or damaged. The movement is kept with its reason.",
        },
        { t: "h2", texto: "Suppliers" },
        {
          t: "p",
          texto:
            "In **Suppliers** you keep who you buy from, their phone and how many days they give you to pay. Each card tells you how much you've bought and how much you owe today.",
        },
      ],
    },
  },
];
