"use client";

import { pedir } from "@/lib/api";
import { leerImpresora, mandarAImpresora } from "./conexion";
import { codificarEtiquetas, type DatosEtiqueta } from "./etiquetas";
import { reciboAEscPos, type LineaRecibo } from "./recibo";

/**
 * Manda el recibo de una orden DIRECTO a la impresora conectada en este equipo.
 * Devuelve `false` si aquí no hay impresora directa (entonces se usa la ventana
 * de imprimir del navegador). Lanza si la impresora falla, para poder avisar.
 */
export async function imprimirReciboDirecto(ordenId: string, tipo: "recibo" | "interna"): Promise<boolean> {
  const impresora = leerImpresora();
  if (!impresora || impresora.camino === "navegador") return false;
  const { lineas } = await pedir<{ lineas: LineaRecibo[] }>(`/datos/ordenes/${ordenId}/recibo?tipo=${tipo}`);
  await mandarAImpresora(
    impresora,
    reciboAEscPos(lineas, {
      ancho: impresora.ancho,
      cortar: impresora.cortar,
      // El cajón solo se abre con el recibo del cliente, no con la copia interna.
      abrirCajon: impresora.abrirCajon && tipo === "recibo",
    }),
  );
  return true;
}

/**
 * Manda las etiquetas de una orden DIRECTO a la etiquetera de este equipo (o a
 * la impresora de recibos, si así se eligió). Devuelve `false` si aquí las
 * etiquetas van por la ventana del navegador.
 */
export async function imprimirEtiquetasDirecto(ordenId: string): Promise<boolean> {
  const impresora = leerImpresora("etiquetas");
  if (!impresora || impresora.camino === "navegador") return false;
  const { etiquetas } = await pedir<{ etiquetas: DatosEtiqueta[] }>(`/datos/ordenes/${ordenId}/etiquetas`);
  await mandarAImpresora(impresora, bytesDeEtiquetas(etiquetas, impresora));
  return true;
}

/** Los bytes según cómo está puesta la etiquetera de este equipo. */
export function bytesDeEtiquetas(
  etiquetas: DatosEtiqueta[],
  impresora: NonNullable<ReturnType<typeof leerImpresora>>,
): Uint8Array {
  // Por la impresora de recibos siempre es ESC/POS, con el papel y el corte de ESA impresora.
  if (impresora.camino === "recibos") {
    const deRecibos = leerImpresora("recibos");
    return codificarEtiquetas(etiquetas, "escpos", {
      ancho: deRecibos?.ancho,
      cortar: deRecibos?.cortar,
    });
  }
  return codificarEtiquetas(etiquetas, impresora.lenguaje ?? "tspl", {
    tamano: impresora.tamano,
    ancho: impresora.ancho,
    cortar: impresora.cortar,
  });
}

/** La etiqueta de prueba: mismos renglones que una de verdad. */
export function etiquetaDePrueba(textos: {
  pieza: string;
  prenda: string;
  cliente: string;
}): DatosEtiqueta[] {
  return [
    {
      numero: "#1001",
      pieza: textos.pieza,
      prenda: textos.prenda,
      cliente: textos.cliente,
      fecha: "22 sept",
      detalle: null,
      qr: "https://tintorapos.com/docs/impresoras",
    },
  ];
}

/** El papel de prueba: acentos, columnas y QR, que es lo que suele fallar. */
export function reciboDePrueba(tienda: string, titulo: string, texto: string): LineaRecibo[] {
  return [
    { t: "texto", texto: tienda, alinear: "centro", negrita: true, grande: 2 },
    { t: "espacio" },
    { t: "texto", texto: titulo, alinear: "centro", negrita: true },
    { t: "separador" },
    { t: "columnas", izq: "1x Camisa", der: "$3.99" },
    { t: "columnas", izq: "TOTAL", der: "$3.99", negrita: true },
    { t: "separador" },
    { t: "texto", texto, alinear: "centro" },
    { t: "qr", datos: "https://tintorapos.com/docs/impresoras" },
  ];
}
