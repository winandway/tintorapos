"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIdioma } from "@/lib/i18n/cliente";
import { Boton } from "./boton";
import { EscanerCamara } from "./escaner";

/**
 * Campo que recibe lo que manda un lector USB/Bluetooth (se comporta como un
 * teclado y termina con Enter) o lo que lee la cámara.
 */
export function CampoEscaneo({
  alLeer,
  placeholder,
  ocupado = false,
}: {
  alLeer: (texto: string) => void;
  placeholder: string;
  ocupado?: boolean;
}) {
  const { d } = useIdioma();
  const [valor, setValor] = useState("");
  const [camara, setCamara] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ocupado) ref.current?.focus();
  }, [ocupado]);

  const leidoCamara = useCallback(
    (texto: string) => {
      setCamara(false);
      alLeer(texto);
    },
    [alLeer],
  );

  return (
    <div className="flex gap-2">
      <input
        ref={ref}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && valor.trim()) {
            alLeer(valor.trim());
            setValor("");
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        autoCapitalize="characters"
        enterKeyHint="search"
        className="h-14 min-w-0 flex-1 rounded-2xl bg-superficie px-4 text-[18px] ring-2 ring-tinta/40 focus:ring-tinta focus:outline-none"
      />
      <Boton
        tamano="grande"
        variante="secundario"
        className="h-14"
        onClick={() => setCamara(true)}
        aria-label={d.produccion.camara}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path
            d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10"
            strokeLinecap="round"
          />
        </svg>
      </Boton>
      <EscanerCamara abierto={camara} alCerrar={() => setCamara(false)} alLeer={leidoCamara} />
    </div>
  );
}
