"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { fmt, type Idioma } from "@/lib/i18n";
import { guardarIdiomaElegido } from "@/lib/i18n/navegador";
import { useIdioma } from "@/lib/i18n/cliente";
import { rutaEquivalente } from "@/lib/rutas-publicas";

function BanderaEEUU() {
  return (
    <svg
      viewBox="0 0 30 20"
      aria-hidden="true"
      className="h-4 w-6 rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.12)]"
    >
      <rect width="30" height="20" fill="#B22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#fff" />
      ))}
      <rect width="13" height={(20 * 7) / 13} fill="#3C3B6E" />
    </svg>
  );
}

/**
 * REGLA DE LA CASA: el español lleva la bandera de ESPAÑA, nunca la de México
 * ni la de ningún otro país. El idioma viene de España; poner la bandera de un
 * solo país de América deja fuera a todos los demás y confunde al cliente.
 */
function BanderaEspana() {
  return (
    <svg
      viewBox="0 0 30 20"
      aria-hidden="true"
      className="h-4 w-6 rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.12)]"
    >
      <rect width="30" height="20" fill="#AA151B" />
      <rect y="5" width="30" height="10" fill="#F1BF00" />
    </svg>
  );
}

const OPCIONES: { idioma: Idioma; etiqueta: string; Bandera: () => React.JSX.Element }[] = [
  { idioma: "en", etiqueta: "English", Bandera: BanderaEEUU },
  { idioma: "es", etiqueta: "Español", Bandera: BanderaEspana },
];

export function SelectorIdioma({ compacto = false }: { compacto?: boolean }) {
  const { idioma, d } = useIdioma();
  const router = useRouter();
  const ruta = usePathname();
  const [pendiente, iniciar] = useTransition();

  function elegir(nuevo: Idioma) {
    if (nuevo === idioma) return;
    guardarIdiomaElegido(nuevo);
    // En las páginas públicas con idioma en la dirección (/es, /en) se carga la misma página en el
    // otro idioma. Carga completa: las dos direcciones comparten la página interna y la navegación
    // del cliente reutilizaría el contenido ya cargado en el idioma anterior.
    const equivalente = ruta ? rutaEquivalente(ruta, nuevo) : null;
    if (equivalente) {
      window.location.assign(equivalente);
      return;
    }
    iniciar(() => router.refresh());
  }

  return (
    <div role="group" aria-label={d.comun.idioma} className="flex items-center gap-1" aria-busy={pendiente}>
      {OPCIONES.map(({ idioma: op, etiqueta, Bandera }) => {
        const activo = op === idioma;
        return (
          <button
            key={op}
            type="button"
            onClick={() => elegir(op)}
            aria-pressed={activo}
            aria-label={fmt(d.comun.cambiarIdiomaA, { idioma: etiqueta })}
            className={`flex items-center gap-1.5 rounded-full ${compacto ? "px-1.5" : "px-2"} py-1 text-xs font-semibold transition ${
              activo ? "bg-tinta-suave text-tinta" : "text-gris hover:bg-percha/50"
            }`}
          >
            <Bandera />
            {!compacto && <span>{op.toUpperCase()}</span>}
          </button>
        );
      })}
    </div>
  );
}
