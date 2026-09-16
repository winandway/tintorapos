"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useIdioma } from "@/lib/i18n/cliente";

/** Ventana accesible sobre <dialog>: foco atrapado, Esc cierra, fondo inerte. */
export function Modal({
  abierto,
  alCerrar,
  titulo,
  children,
  ancho = "max-w-md",
  pie,
}: {
  abierto: boolean;
  alCerrar: () => void;
  titulo: ReactNode;
  children: ReactNode;
  ancho?: string;
  pie?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const { d } = useIdioma();

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (abierto && !dlg.open) dlg.showModal();
    if (!abierto && dlg.open) dlg.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        alCerrar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) alCerrar();
      }}
      className={`m-auto w-[calc(100%-32px)] ${ancho} rounded-3xl bg-superficie p-0 text-noche shadow-2xl backdrop:bg-noche/40 backdrop:backdrop-blur-[2px]`}
    >
      {abierto && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
            <h2 id={idTitulo} className="titulo-ancho text-lg leading-tight">
              {titulo}
            </h2>
            <button
              type="button"
              onClick={alCerrar}
              aria-label={d.comun.cerrar}
              className="-mr-2 -mt-1 flex size-9 items-center justify-center rounded-full text-gris hover:bg-papel"
            >
              <svg viewBox="0 0 20 20" className="size-5" fill="currentColor" aria-hidden="true">
                <path d="M5.3 5.3a1 1 0 0 1 1.4 0L10 8.6l3.3-3.3a1 1 0 1 1 1.4 1.4L11.4 10l3.3 3.3a1 1 0 0 1-1.4 1.4L10 11.4l-3.3 3.3a1 1 0 0 1-1.4-1.4L8.6 10 5.3 6.7a1 1 0 0 1 0-1.4Z" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto px-6 pb-5">{children}</div>
          {pie && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-percha/70 px-6 py-4">{pie}</div>
          )}
        </div>
      )}
    </dialog>
  );
}
