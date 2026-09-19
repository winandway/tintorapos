"use client";

import { useEffect, useRef, useState } from "react";
import { Captura } from "@/components/sitio/captura";
import { Ticket } from "@/components/ui/ticket";
import type { ClaveCaptura } from "@/lib/contenido/capturas";
import type { Idioma } from "@/lib/i18n";

export interface PasoConCaptura {
  titulo: string;
  texto: string;
  captura: ClaveCaptura;
}

/**
 * Los pasos de una orden con su pantalla real al lado. Se toca un paso y cambia
 * la imagen; también va solo, y se detiene en cuanto alguien toca o pasa el
 * ratón (y no se mueve si el sistema pide menos animación).
 */
export function CarruselFlujo({
  pasos,
  idioma,
  etiquetaAnterior,
  etiquetaSiguiente,
}: {
  pasos: PasoConCaptura[];
  idioma: Idioma;
  etiquetaAnterior: string;
  etiquetaSiguiente: string;
}) {
  const [activo, setActivo] = useState(0);
  const [detenido, setDetenido] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (detenido) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActivo((i) => (i + 1) % pasos.length), 6000);
    return () => clearInterval(id);
  }, [detenido, pasos.length]);

  const mover = (delta: number) => {
    setDetenido(true);
    setActivo((i) => (i + delta + pasos.length) % pasos.length);
  };

  const paso = pasos[activo]!;
  return (
    <div
      ref={caja}
      onMouseEnter={() => setDetenido(true)}
      onFocusCapture={() => setDetenido(true)}
      onTouchStart={() => setDetenido(true)}
      className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center"
    >
      <ol className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:gap-2 lg:overflow-visible lg:pb-0">
        {pasos.map((p, i) => {
          const esActivo = i === activo;
          return (
            <li key={p.titulo} className="min-w-[70%] sm:min-w-[45%] lg:min-w-0">
              <button
                type="button"
                aria-current={esActivo}
                onClick={() => {
                  setDetenido(true);
                  setActivo(i);
                }}
                className={`flex h-full w-full items-start gap-3 rounded-2xl p-4 text-left transition ${
                  esActivo
                    ? "bg-superficie ring-2 ring-tinta"
                    : "bg-superficie/60 ring-1 ring-percha/60 hover:ring-tinta"
                }`}
              >
                <Ticket numero={i + 1} dia={i + 1} tamano="chico" />
                <span className="min-w-0">
                  <span className="titulo-ancho block text-lg">{p.titulo}</span>
                  <span className={`mt-1 block text-[15px] ${esActivo ? "text-noche" : "text-gris"}`}>
                    {p.texto}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div>
        <Captura key={paso.captura} clave={paso.captura} idioma={idioma} />
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label={etiquetaAnterior}
            onClick={() => mover(-1)}
            className="grid size-9 place-items-center rounded-full bg-superficie text-gris ring-1 ring-percha hover:text-tinta"
          >
            ‹
          </button>
          <div className="flex gap-1.5">
            {pasos.map((p, i) => (
              <button
                key={p.titulo}
                type="button"
                aria-label={p.titulo}
                aria-current={i === activo}
                onClick={() => {
                  setDetenido(true);
                  setActivo(i);
                }}
                className={`h-2 rounded-full transition-all ${i === activo ? "w-6 bg-tinta" : "w-2 bg-percha"}`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label={etiquetaSiguiente}
            onClick={() => mover(1)}
            className="grid size-9 place-items-center rounded-full bg-superficie text-gris ring-1 ring-percha hover:text-tinta"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
