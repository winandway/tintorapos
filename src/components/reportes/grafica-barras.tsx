"use client";

import { useState } from "react";

/** Máximo «limpio» del eje: 1, 2 o 5 × 10^n por encima del valor. */
export function maximoLimpio(valor: number): number {
  if (valor <= 0) return 1;
  const potencia = 10 ** Math.floor(Math.log10(valor));
  for (const m of [1, 2, 5, 10]) if (m * potencia >= valor) return m * potencia;
  return 10 * potencia;
}

/**
 * Columnas de una sola serie (sin librería): barras de ≤24 px con punta redondeada,
 * base cuadrada, 2 px de aire entre barras, rejilla fina y detalle al pasar o enfocar.
 */
export function GraficaBarras({
  datos,
  formato,
  etiquetaEje,
  titulo,
}: {
  datos: { etiqueta: string; etiquetaLarga: string; valor: number }[];
  formato: (n: number) => string;
  etiquetaEje: (n: number) => string;
  titulo: string;
}) {
  const [activo, setActivo] = useState<number | null>(null);
  const max = maximoLimpio(Math.max(...datos.map((d) => d.valor), 0));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const cadaCuanto = Math.max(1, Math.ceil(datos.length / 8));
  return (
    <figure aria-label={titulo} className="select-none">
      <div className="relative grid grid-cols-[auto_1fr] gap-2">
        <div className="relative h-52 w-12 text-right text-[11px] text-gris" aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="cifra absolute right-0 -translate-y-1/2"
              style={{ bottom: `${(t / max) * 100}%` }}
            >
              {etiquetaEje(t)}
            </span>
          ))}
        </div>
        <div className="relative h-52">
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 h-px bg-grafica-rejilla"
              style={{ bottom: `${(t / max) * 100}%` }}
              aria-hidden="true"
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {datos.map((d, i) => (
              <button
                key={d.etiquetaLarga}
                type="button"
                className="group relative flex h-full min-w-0 flex-1 items-end justify-center outline-none"
                onPointerEnter={() => setActivo(i)}
                onPointerLeave={() => setActivo((a) => (a === i ? null : a))}
                onFocus={() => setActivo(i)}
                onBlur={() => setActivo((a) => (a === i ? null : a))}
                aria-label={`${d.etiquetaLarga}: ${formato(d.valor)}`}
              >
                <span
                  className={`block w-full max-w-6 rounded-t-[4px] transition-opacity ${activo !== null && activo !== i ? "opacity-60" : ""} ${d.valor > 0 ? "bg-grafica" : ""}`}
                  style={{ height: d.valor > 0 ? `max(2px, ${(d.valor / max) * 100}%)` : 0 }}
                />
                {activo === i && (
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-xl bg-noche px-2.5 py-1.5 text-center whitespace-nowrap text-white shadow-lg">
                    <span className="cifra block text-[14px] font-bold">{formato(d.valor)}</span>
                    <span className="block text-[11px] opacity-80">{d.etiquetaLarga}</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div />
        <div className="flex gap-[2px] text-[11px] text-gris" aria-hidden="true">
          {datos.map((d, i) => (
            <span key={d.etiquetaLarga} className="min-w-0 flex-1 truncate text-center">
              {i % cadaCuanto === 0 || i === datos.length - 1 ? d.etiqueta : ""}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

/** Barras horizontales para desgloses (magnitud en un solo tono, valor al final). */
export function BarrasHorizontales({
  filas,
  formato,
}: {
  filas: { etiqueta: string; detalle?: string; valor: number }[];
  formato: (n: number) => string;
}) {
  const max = Math.max(...filas.map((f) => f.valor), 1);
  return (
    <ul className="space-y-3">
      {filas.map((f) => (
        <li key={f.etiqueta}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[14px]">
            <span className="min-w-0 truncate">
              {f.etiqueta}
              {f.detalle && <span className="text-gris"> · {f.detalle}</span>}
            </span>
            <span className="cifra font-semibold">{formato(f.valor)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-grafica-rejilla">
            <div
              className="h-full rounded-full bg-grafica"
              style={{ width: `${Math.max(1, (f.valor / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
