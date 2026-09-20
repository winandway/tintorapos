import { CATEGORIAS_GASTO, ganancia, impuestos, listarCompras, listarGastos } from "@/server/contabilidad";
import { aCsv } from "@/server/respaldos";
import { ruta } from "@/server/ruta";
import { rangoDe } from "../_rango";

const COLUMNAS = ["fecha", "tipo", "concepto", "detalle", "entrada", "salida", "impuesto"] as const;
const dinero = (cents: number) => (cents / 100).toFixed(2);

/**
 * El libro del período para el contador: un solo archivo con las ventas del
 * día, cada gasto y cada compra, en el orden en que pasaron. Se abre en Excel
 * y se carga en cualquier programa de contabilidad.
 */
export const GET = ruta({
  acceso: "sesion",
  permiso: "contabilidad.ver",
  manejar: async (c) => {
    const [desde, hasta] = rangoDe(c.req.url, c.sesion!, c.ahora);
    const t = c.sesion!.tintoreria.id;
    const idioma = c.idioma;
    const [g, gastos, compras, imp] = await Promise.all([
      ganancia(c.db, t, desde, hasta),
      listarGastos(c.db, t, { desde, hasta, limite: 500 }),
      listarCompras(c.db, t, { desde, hasta, limite: 300 }),
      impuestos(c.db, t, desde, hasta),
    ]);
    const nombreCategoria = (clave: string) =>
      CATEGORIAS_GASTO.find((x) => x.clave === clave)?.[idioma] ?? clave;
    const filas: Record<string, unknown>[] = [];
    for (const d of g.porDia)
      if (d.ventasCents > 0)
        filas.push({
          fecha: d.fecha,
          tipo: idioma === "en" ? "Sales" : "Ventas",
          concepto: idioma === "en" ? "Collected that day" : "Cobrado del día",
          detalle: "",
          entrada: dinero(d.ventasCents),
          salida: "",
          impuesto: "",
        });
    for (const x of gastos.gastos)
      filas.push({
        fecha: x.fecha,
        tipo: x.compraId ? (idioma === "en" ? "Purchase" : "Compra") : idioma === "en" ? "Expense" : "Gasto",
        concepto: nombreCategoria(x.categoria),
        detalle: [x.proveedor, x.empleado, x.descripcion, x.referencia].filter(Boolean).join(" · "),
        entrada: "",
        salida: dinero(x.montoCents),
        impuesto: "",
      });
    for (const x of compras.compras)
      if (x.impuestoCents > 0)
        filas.push({
          fecha: x.fecha,
          tipo: idioma === "en" ? "Purchase tax" : "Impuesto de compra",
          concepto: x.proveedor ?? "",
          detalle: x.numeroFactura ?? "",
          entrada: "",
          salida: "",
          impuesto: dinero(x.impuestoCents),
        });
    filas.push({
      fecha: hasta,
      tipo: idioma === "en" ? "Sales tax collected" : "Impuesto cobrado",
      concepto: idioma === "en" ? "Taxable sales" : "Venta gravada",
      detalle: dinero(imp.gravadaCents),
      entrada: "",
      salida: "",
      impuesto: dinero(imp.impuestoCents),
    });
    filas.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    return new Response(aCsv(filas, COLUMNAS), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="tintora-libro-${desde}-${hasta}.csv"`,
        "cache-control": "no-store",
      },
    });
  },
});
