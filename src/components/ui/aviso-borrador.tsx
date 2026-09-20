"use client";

import { useIdioma } from "@/lib/i18n/cliente";

/**
 * La línea discreta que avisa que se recuperó lo escrito. Nunca una ventana:
 * la persona sigue trabajando y, si no lo quiere, toca «empezar de nuevo».
 */
export function AvisoBorrador({ alDescartar }: { alDescartar: () => void }) {
  const { d } = useIdioma();
  return (
    <p className="flex flex-wrap items-center gap-2 rounded-xl bg-tinta-suave px-3 py-2 text-[13px] text-tinta-oscura">
      <span>{d.comun.borradorRecuperado}</span>
      <button type="button" onClick={alDescartar} className="font-bold underline underline-offset-2">
        {d.comun.borradorEmpezarDeNuevo}
      </button>
    </p>
  );
}
