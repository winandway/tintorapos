"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useIdioma } from "@/lib/i18n/cliente";
import { Campo } from "./campo";

export function simboloMoneda(moneda: string, idioma: string): string {
  return (
    new Intl.NumberFormat(`${idioma}-US`, { style: "currency", currency: moneda })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? "$"
  );
}

/** Campo de dinero: se escribe como texto («12.50») y se convierte a centavos con aCentavos. */
export function CampoDinero({
  etiqueta,
  moneda,
  valor,
  alCambiar,
  error,
  ayuda,
  grande = false,
  className,
  ...resto
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "children"> & {
  etiqueta: ReactNode;
  moneda: string;
  valor: string;
  alCambiar: (texto: string) => void;
  error?: string | null;
  ayuda?: ReactNode;
  grande?: boolean;
}) {
  const { idioma } = useIdioma();
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda} className={className}>
      {(a) => (
        <div
          className={`flex items-center rounded-xl bg-superficie ring-1 ring-inset focus-within:ring-2 focus-within:ring-tinta ${error ? "ring-peligro" : "ring-percha"} ${grande ? "px-4" : "px-3.5"}`}
        >
          <span className={`text-gris ${grande ? "text-2xl" : ""}`}>{simboloMoneda(moneda, idioma)}</span>
          <input
            inputMode="decimal"
            autoComplete="off"
            value={valor}
            onChange={(e) => alCambiar(e.target.value.replace(/[^\d.,]/g, ""))}
            className={`cifra w-full bg-transparent pl-1.5 outline-none ${grande ? "numero-ticket py-3 text-4xl" : "py-2.5 text-[16px]"}`}
            {...a}
            {...resto}
          />
        </div>
      )}
    </Campo>
  );
}
