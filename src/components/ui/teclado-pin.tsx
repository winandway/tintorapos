"use client";

import { useCallback, useEffect, useState } from "react";
import { useIdioma } from "@/lib/i18n/cliente";

/** Teclado numérico grande para PIN (táctil y con el teclado físico). */
export function TecladoPin({
  alEnviar,
  ocupado = false,
  error,
  etiquetaEnviar,
}: {
  alEnviar: (pin: string) => void | Promise<void>;
  ocupado?: boolean;
  error?: string | null;
  etiquetaEnviar: string;
}) {
  const [pin, setPin] = useState("");
  const { d } = useIdioma();

  const enviar = useCallback(async () => {
    if (pin.length < 4 || ocupado) return;
    const valor = pin;
    setPin("");
    await alEnviar(valor);
  }, [pin, ocupado, alEnviar]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) setPin((p) => (p.length < 6 ? p + e.key : p));
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
      else if (e.key === "Enter") void enviar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [enviar]);

  const teclas = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "borrar", "0", "ok"];
  return (
    <div className="mx-auto w-full max-w-72">
      <div
        className="mb-4 flex h-6 items-center justify-center gap-3"
        aria-live="polite"
        aria-label={`${pin.length}`}
      >
        {Array.from({ length: Math.max(4, pin.length) }, (_, i) => (
          <span
            key={i}
            className={`size-3.5 rounded-full transition ${i < pin.length ? "scale-110 bg-tinta" : "bg-percha"}`}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="mb-3 text-center text-sm font-medium text-peligro">
          {error}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2.5">
        {teclas.map((t) =>
          t === "borrar" ? (
            <button
              key={t}
              type="button"
              onClick={() => setPin((p) => p.slice(0, -1))}
              aria-label={d.pin.borrar}
              className="h-16 rounded-2xl text-gris hover:bg-percha/40"
            >
              <svg
                viewBox="0 0 24 24"
                className="mx-auto size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7 6-7Z" strokeLinejoin="round" />
                <path d="m12 9 6 6m0-6-6 6" strokeLinecap="round" />
              </svg>
            </button>
          ) : t === "ok" ? (
            <button
              key={t}
              type="button"
              onClick={() => void enviar()}
              disabled={pin.length < 4 || ocupado}
              className="h-16 rounded-2xl bg-tinta text-[15px] font-bold text-white disabled:opacity-40"
            >
              {etiquetaEnviar}
            </button>
          ) : (
            <button
              key={t}
              type="button"
              onClick={() => setPin((p) => (p.length < 6 ? p + t : p))}
              className="numero-ticket h-16 rounded-2xl bg-superficie text-3xl text-noche shadow-[0_1px_0_rgb(0_0_0/0.06)] ring-1 ring-percha active:scale-95 active:bg-tinta-suave"
            >
              {t}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
