"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useIdioma } from "@/lib/i18n/cliente";
import { Campo, clasesEntrada } from "./campo";

/**
 * EL ÚNICO campo de contraseña del sistema: siempre con el ojito para ver y
 * ocultar. Arranca oculto. ESLint prohíbe un type=password fuera de aquí.
 */
export function CampoClave({
  etiqueta,
  ayuda,
  error,
  className,
  ...resto
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  error?: string | null;
}) {
  const [visible, setVisible] = useState(false);
  const { d } = useIdioma();
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} error={error} className={className}>
      {(a) => (
        <div className="relative">
          <input
            type={visible ? "text" : "password"}
            className={`${clasesEntrada} pr-12`}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            {...a}
            {...resto}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? d.comun.ocultarClave : d.comun.verClave}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-gris hover:text-tinta"
          >
            {visible ? <OjoCerrado /> : <Ojo />}
          </button>
        </div>
      )}
    </Campo>
  );
}

function Ojo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function OjoCerrado() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3 3.9M6.5 6.6A17 17 0 0 0 2.5 12s3.5 7 9.5 7a9.6 9.6 0 0 0 4.4-1.1"
        strokeLinecap="round"
      />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" strokeLinecap="round" />
    </svg>
  );
}
