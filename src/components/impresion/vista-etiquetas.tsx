"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Boton } from "@/components/ui/boton";
import { diccionario, type Idioma } from "@/lib/i18n";

/**
 * Las etiquetas y el recibo NO salen de la misma impresora: el recibo va en la
 * térmica de 80 mm del mostrador y la etiqueta en la de etiquetas adhesivas.
 * Quien no tenga etiquetera puede elegir «Hoja carta» e imprimir en cualquier
 * impresora con hojas de etiquetas, o sacarlas por el rollo de recibos.
 *
 * El tamaño de papel se manda con `@page`, que hay que escribir en el momento
 * (no se puede cambiar con una variable de CSS).
 */
export const FORMATOS = ["rollo2x1", "rollo225", "tag3x1", "hoja", "recibo80"] as const;
export type FormatoEtiqueta = (typeof FORMATOS)[number];

const PAPEL: Record<FormatoEtiqueta, string> = {
  rollo2x1: "size: 2in 1in; margin: 0;",
  rollo225: "size: 2.25in 1.25in; margin: 0;",
  tag3x1: "size: 3in 1in; margin: 0;",
  hoja: "size: letter; margin: 0.5in 0.19in;",
  recibo80: "size: 80mm auto; margin: 0;",
};

const CLAVE = "tintora:formato-etiqueta";

function esFormato(v: unknown): v is FormatoEtiqueta {
  return typeof v === "string" && (FORMATOS as readonly string[]).includes(v);
}

export function VistaEtiquetas({
  idioma,
  automatico,
  children,
}: {
  idioma: Idioma;
  automatico: boolean;
  children: ReactNode;
}) {
  const d = diccionario(idioma).impresion;
  const [formato, setFormato] = useState<FormatoEtiqueta>("rollo2x1");
  const [listo, setListo] = useState(false);

  // El formato se recuerda en la computadora de la tienda: se elige una vez.
  useEffect(() => {
    let guardado: string | null = null;
    try {
      guardado = localStorage.getItem(CLAVE);
    } catch {
      /* modo privado */
    }
    // Se lee del navegador al montar (no existe en el servidor).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormato(esFormato(guardado) ? guardado : "rollo2x1");
    setListo(true);
  }, []);

  // El diálogo de impresión se abre cuando ya se sabe el tamaño del papel.
  useEffect(() => {
    if (!automatico || !listo || navigator.webdriver) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [automatico, listo]);

  const elegir = (v: FormatoEtiqueta) => {
    setFormato(v);
    try {
      localStorage.setItem(CLAVE, v);
    } catch {
      /* modo privado */
    }
  };

  return (
    <>
      <style>{`@page { ${PAPEL[formato]} } body { background: #fff; }`}</style>
      <div className="no-imprimir sticky top-0 z-10 flex flex-wrap items-center justify-center gap-3 bg-papel/95 p-3 backdrop-blur">
        <label className="flex items-center gap-2 text-[14px] font-semibold">
          {d.formato}
          <select
            value={formato}
            onChange={(e) => elegir(e.target.value as FormatoEtiqueta)}
            className="h-10 rounded-xl bg-superficie px-3 text-[15px] font-normal ring-1 ring-percha"
          >
            {FORMATOS.map((f) => (
              <option key={f} value={f}>
                {d.formatos[f]}
              </option>
            ))}
          </select>
        </label>
        <Boton onClick={() => window.print()}>{d.imprimir}</Boton>
        <Boton variante="secundario" onClick={() => window.close()}>
          {d.cerrar}
        </Boton>
        <p className="w-full text-center text-[13px] text-gris">
          {d.queImpresora} {formato === "hoja" ? "" : d.sinEtiquetera}
        </p>
      </div>
      <div className="hoja-etiquetas" data-formato={formato}>
        {children}
      </div>
    </>
  );
}
