import type { DatosEtiqueta } from "@/lib/impresion/etiquetas";
import { diccionario, fmt, formatoFecha, textoBilingue } from "@/lib/i18n";
import { leerTienda } from "@/server/ajustes/tienda";
import { verOrden } from "@/server/ordenes/consultas";
import { ruta } from "@/server/ruta";

/**
 * Las etiquetas de una orden, ya con sus textos, para la etiquetera conectada
 * directo. Dicen lo mismo que las de la pantalla de imprimir: van en el idioma
 * del cliente y reimprimirlas no pide autorización.
 */
export const GET = ruta({
  acceso: "sesion",
  permiso: "ordenes.ver",
  manejar: async (c) => {
    const s = c.sesion!;
    const orden = await verOrden(c.db, s.tintoreria.id, c.params.id ?? "", c.ahora);
    const tienda = await leerTienda(c.db, s.tintoreria.id);
    const idioma = orden.cliente.idioma;
    const d = diccionario(idioma);
    const fecha = formatoFecha(orden.fechaPromesa, idioma, tienda.zonaHoraria, {
      month: "short",
      day: "numeric",
    });
    const piezas = orden.prendas.filter((p) => p.estado !== "anulada");
    const etiquetas: DatosEtiqueta[] = piezas.map((p, i) => ({
      numero: `#${orden.numero}`,
      pieza: `${d.ordenes.dias[orden.dia] ?? ""} · ${fmt(d.impresion.pieza, { i: i + 1, n: piezas.length })}`,
      prenda: textoBilingue(idioma, p.prendaEs, p.prendaEn),
      cliente: orden.cliente.nombre,
      fecha: orden.urgente ? `${fecha} · ${d.impresion.urgente}` : fecha,
      detalle: [p.color, p.notas].filter(Boolean).join(" · ") || null,
      qr: `${c.vars.APP_URL}/e/${p.codigoEtiqueta}`,
    }));
    return { numero: orden.numero, etiquetas };
  },
});
