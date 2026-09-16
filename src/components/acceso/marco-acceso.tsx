import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/marca/logo";
import { Pie } from "@/components/pie";
import { SelectorIdioma } from "@/components/selector-idioma";
import { Ticket } from "@/components/ui/ticket";
import { obtenerTextos } from "@/lib/i18n/servidor";

/** Marco de las pantallas de acceso: panel de marca a la izquierda (escritorio) y el formulario. */
export async function MarcoAcceso({ children }: { children: ReactNode }) {
  const { idioma, d } = await obtenerTextos();
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <aside className="relative hidden overflow-hidden bg-tinta text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
          <Link href="/" className="relative z-10 inline-flex w-fit rounded-2xl bg-papel px-3 py-2">
            <Logo />
          </Link>
          <div className="relative z-10 max-w-md">
            <h1 className="titulo-ancho text-4xl leading-[1.05]">{d.acceso.ladoTitulo}</h1>
            <p className="mt-4 text-lg text-white/80">{d.acceso.ladoTexto}</p>
          </div>
          <div
            className="pointer-events-none absolute -right-6 bottom-24 flex rotate-[-8deg] gap-4 opacity-95"
            aria-hidden="true"
          >
            <Ticket numero="1042" dia={1} tamano="grande" arriba="LUN" abajo="LISTA" />
            <Ticket numero="1043" dia={3} tamano="grande" arriba="MIÉ" className="translate-y-10" />
            <Ticket numero="1044" dia={5} tamano="grande" arriba="VIE" className="-translate-y-6" />
          </div>
          <p className="relative z-10 text-sm text-white/60">tintora pos</p>
        </aside>
        <main id="contenido" className="flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 sm:px-8">
            <Link href="/" className="lg:invisible">
              <Logo />
            </Link>
            <SelectorIdioma />
          </div>
          <div className="flex flex-1 items-start justify-center px-4 pb-10 sm:items-center sm:px-8">
            <div className="w-full max-w-[440px]">{children}</div>
          </div>
        </main>
      </div>
      <Pie idioma={idioma} compacto />
    </div>
  );
}
