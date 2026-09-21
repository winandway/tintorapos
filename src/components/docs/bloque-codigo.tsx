"use client";

import { useState } from "react";
import { useIdioma } from "@/lib/i18n/cliente";

/** Un valor para copiar tal cual: completo, en su propio bloque y con su botón. */
export function BloqueCodigo({ texto, etiqueta }: { texto: string; etiqueta?: string }) {
  const { d } = useIdioma();
  const [copiado, setCopiado] = useState(false);
  return (
    <figure className="mt-4">
      {etiqueta && <figcaption className="mb-1 text-[13px] font-semibold text-gris">{etiqueta}</figcaption>}
      <div className="flex items-start gap-2 rounded-2xl bg-noche p-3 text-white">
        <pre className="min-w-0 flex-1 overflow-x-auto text-[13px] leading-relaxed whitespace-pre-wrap break-all">
          <code>{texto}</code>
        </pre>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(texto);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            } catch {
              /* sin permiso de portapapeles: el texto se puede seleccionar a mano */
            }
          }}
          className="shrink-0 rounded-lg bg-white/15 px-2.5 py-1 text-[13px] font-semibold hover:bg-white/25"
        >
          {copiado ? d.acceso.copiado : d.acceso.copiar}
        </button>
      </div>
    </figure>
  );
}
