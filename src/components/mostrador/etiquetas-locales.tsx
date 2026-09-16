"use client";

import { renderSVG } from "uqr";
import { fmt, formatoFecha } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";

export interface DatosEtiquetasLocales {
  cliente: string;
  promesa: number;
  urgente: boolean;
  piezas: { codigo: string; nombre: string }[];
}

/**
 * Etiquetas generadas en el dispositivo (sin conexión): mismo QR y mismo tamaño
 * que las del servidor. Solo aparecen al imprimir.
 */
export function EtiquetasLocales({
  datos,
  codigoPublico,
  dia,
  zona,
}: {
  datos: DatosEtiquetasLocales;
  codigoPublico: string;
  dia: number;
  zona: string;
}) {
  const { d, idioma } = useIdioma();
  const origen = typeof window === "undefined" ? "" : window.location.origin;
  return (
    <div
      className="hidden print:fixed print:inset-0 print:z-50 print:block print:bg-white"
      data-codigo-publico={codigoPublico}
    >
      <style>{`@media print { @page { size: 2in 1in; margin: 0; } body * { visibility: hidden; } .etiquetas-locales, .etiquetas-locales * { visibility: visible; } .etiquetas-locales { position: absolute; left: 0; top: 0; } }`}</style>
      <div className="etiquetas-locales">
        {datos.piezas.map((p, i) => (
          <section
            key={p.codigo}
            className="flex h-[1in] w-[2in] break-after-page items-center gap-[0.06in] overflow-hidden bg-white p-[0.06in] text-left text-black"
          >
            <div
              className="w-[0.82in] shrink-0 [&_svg]:h-auto [&_svg]:w-full"
              dangerouslySetInnerHTML={{
                __html: renderSVG(`${origen}/e/${p.codigo}`, { border: 0, ecc: "M", pixelSize: 4 }),
              }}
            />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="numero-ticket text-[16pt] leading-none">{p.codigo.slice(0, 6)}</p>
              <p className="truncate text-[7.5pt] font-bold">
                {d.ordenes.dias[dia]} · {fmt(d.impresion.pieza, { i: i + 1, n: datos.piezas.length })}
              </p>
              <p className="truncate text-[7.5pt]">{p.nombre}</p>
              <p className="truncate text-[7.5pt]">{datos.cliente}</p>
              <p className="truncate text-[7pt]">
                {formatoFecha(datos.promesa, idioma, zona, { month: "short", day: "numeric" })}
                {datos.urgente ? ` · ${d.impresion.urgente}` : ""}
              </p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
