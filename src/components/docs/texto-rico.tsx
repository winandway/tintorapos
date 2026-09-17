import Link from "next/link";
import { Fragment } from "react";
import type { Idioma } from "@/lib/i18n";
import { rutaPublica } from "@/lib/rutas-publicas";

/** Texto de las guías con **negrita** y [enlaces](/docs/guia). Solo enlaces internos. */
export function TextoRico({ texto, idioma }: { texto: string; idioma: Idioma }) {
  const partes = texto.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(\/[^)\s]*\))/g);
  return (
    <>
      {partes.map((p, i) => {
        const negrita = /^\*\*([^*]+)\*\*$/.exec(p);
        if (negrita)
          return (
            <strong key={i} className="font-semibold text-noche">
              {negrita[1]}
            </strong>
          );
        const enlace = /^\[([^\]]+)\]\((\/[^)\s]*)\)$/.exec(p);
        if (enlace)
          return (
            <Link
              key={i}
              href={rutaPublica(idioma, enlace[2] ?? "/docs")}
              className="font-semibold text-tinta underline underline-offset-2 hover:text-tinta-oscura"
            >
              {enlace[1]}
            </Link>
          );
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}
