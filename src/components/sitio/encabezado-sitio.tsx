import Link from "next/link";
import { Logo } from "@/components/marca/logo";
import { SelectorIdioma } from "@/components/selector-idioma";
import { clasesBoton } from "@/components/ui/boton";
import { diccionario, type Idioma } from "@/lib/i18n";

/** Encabezado de las páginas públicas (portada, Docs, legales). */
export function EncabezadoSitio({
  idioma,
  haySesion,
  enlaces = [],
}: {
  idioma: Idioma;
  haySesion: boolean;
  enlaces?: { href: string; texto: string }[];
}) {
  const d = diccionario(idioma).comun;
  return (
    <header className="sticky top-0 z-30 border-b border-percha/60 bg-papel/85 backdrop-blur-md no-imprimir">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-6">
        <Link href="/" className="shrink-0 rounded-lg" aria-label="Tintora POS">
          <Logo compacto />
        </Link>
        <nav className="hidden flex-1 items-center gap-6 text-[15px] font-semibold text-gris md:flex">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} className="transition hover:text-tinta">
              {e.texto}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-3 md:ml-0">
          <SelectorIdioma compacto />
          {haySesion ? (
            <Link href="/app" className={`${clasesBoton("primario", "chico")} whitespace-nowrap`}>
              {d.irAlPanel}
            </Link>
          ) : (
            <>
              <Link
                href="/entrar"
                className={`${clasesBoton("secundario", "chico")} whitespace-nowrap sm:hidden`}
              >
                {d.entrar}
              </Link>
              <Link
                href="/entrar"
                className="hidden rounded-lg px-2 py-1.5 text-[15px] font-semibold text-noche hover:text-tinta sm:inline"
              >
                {d.entrar}
              </Link>
              <span className="hidden sm:inline-flex">
                <Link href="/registro" className={`${clasesBoton("primario", "chico")} whitespace-nowrap`}>
                  {d.probarGratis}
                </Link>
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
