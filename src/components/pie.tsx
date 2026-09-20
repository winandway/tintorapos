import Link from "next/link";
import { diccionario, type Idioma } from "@/lib/i18n";
import { rutaPagina } from "@/lib/rutas-publicas";
import { ANIO_ACTUAL, DOMINIO_SITIO } from "@/lib/sitio";

/** Pie con el crédito obligatorio de Windoce LLC. */
export function Pie({ idioma, compacto = false }: { idioma: Idioma; compacto?: boolean }) {
  const d = diccionario(idioma).comun;
  return (
    <footer className={`border-t border-percha/70 ${compacto ? "py-4" : "py-8"} no-imprimir`}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-[13px] text-gris sm:flex-row">
        <p>
          © {ANIO_ACTUAL} {DOMINIO_SITIO} | All rights reserved. Developed by{" "}
          <a
            href="https://windoce.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-noche underline-offset-4 transition hover:text-tinta hover:underline"
          >
            Windoce LLC
          </a>
        </p>
        {!compacto && (
          <nav className="flex gap-5">
            <Link href={rutaPagina(idioma, "docs")} className="hover:text-tinta">
              {d.docs}
            </Link>
            <Link href={rutaPagina(idioma, "privacidad")} className="hover:text-tinta">
              {d.privacidad}
            </Link>
            <Link href={rutaPagina(idioma, "terminos")} className="hover:text-tinta">
              {d.terminos}
            </Link>
            <Link href={rutaPagina(idioma, "contacto")} className="hover:text-tinta">
              {diccionario(idioma).contacto.titulo}
            </Link>
          </nav>
        )}
      </div>
    </footer>
  );
}
