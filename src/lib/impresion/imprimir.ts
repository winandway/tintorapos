"use client";

import { pedir } from "@/lib/api";
import { leerImpresora, mandarAImpresora } from "./conexion";
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
