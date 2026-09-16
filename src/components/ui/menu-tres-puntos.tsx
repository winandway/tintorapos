"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useIdioma } from "@/lib/i18n/cliente";
import { Boton } from "./boton";
import { Modal } from "./modal";

export interface OpcionMenu {
  texto: string;
  alElegir: () => void | Promise<void>;
  icono?: ReactNode;
  /** Acción destructiva: va en rojo y pide confirmación antes de ejecutarse. */
  destructiva?: { titulo: string; mensaje: ReactNode; confirmar: string };
  oculta?: boolean;
}

/**
 * Menú «⋮». REGLA DE LA CASA: borrar, desactivar o anular SOLO vive aquí dentro,
 * nunca como botón suelto, y siempre con confirmación.
 */
export function MenuTresPuntos({ opciones, etiqueta }: { opciones: OpcionMenu[]; etiqueta?: string }) {
  const [abierto, setAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState<OpcionMenu | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const idMenu = useId();
  const { d } = useIdioma();
  const visibles = opciones.filter((o) => !o.oculta);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  if (!visibles.length) return null;

  async function ejecutar(o: OpcionMenu) {
    setAbierto(false);
    if (o.destructiva) {
      setConfirmando(o);
      return;
    }
    await o.alElegir();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={etiqueta ?? d.comun.masOpciones}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={idMenu}
        onClick={() => setAbierto((v) => !v)}
        className="flex size-10 items-center justify-center rounded-full text-gris hover:bg-tinta-suave hover:text-tinta"
      >
        <svg viewBox="0 0 20 20" className="size-5" fill="currentColor" aria-hidden="true">
          <circle cx="10" cy="4" r="1.7" />
          <circle cx="10" cy="10" r="1.7" />
          <circle cx="10" cy="16" r="1.7" />
        </svg>
      </button>
      {abierto && (
        <div
          id={idMenu}
          role="menu"
          className="absolute right-0 z-30 mt-1 min-w-52 overflow-hidden rounded-2xl bg-superficie py-1.5 shadow-xl ring-1 ring-percha"
        >
          {visibles.map((o) => (
            <button
              key={o.texto}
              type="button"
              role="menuitem"
              onClick={() => void ejecutar(o)}
              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[15px] hover:bg-papel ${
                o.destructiva ? "text-peligro" : "text-noche"
              }`}
            >
              {o.icono}
              {o.texto}
            </button>
          ))}
        </div>
      )}
      <Modal
        abierto={Boolean(confirmando)}
        alCerrar={() => !trabajando && setConfirmando(null)}
        titulo={confirmando?.destructiva?.titulo}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setConfirmando(null)} disabled={trabajando}>
              {d.comun.cancelar}
            </Boton>
            <Boton
              variante="peligro"
              cargando={trabajando}
              onClick={async () => {
                if (!confirmando) return;
                setTrabajando(true);
                try {
                  await confirmando.alElegir();
                  setConfirmando(null);
                } finally {
                  setTrabajando(false);
                }
              }}
            >
              {confirmando?.destructiva?.confirmar}
            </Boton>
          </>
        }
      >
        <div className="text-[15px] text-gris">{confirmando?.destructiva?.mensaje}</div>
      </Modal>
    </div>
  );
}
