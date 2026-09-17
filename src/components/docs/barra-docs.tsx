"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icono, type IconoSitio } from "@/components/marca/iconos-sitio";
import type { EntradaBuscador } from "@/lib/docs";
import { useIdioma } from "@/lib/i18n/cliente";
import { abrirBusqueda, BotonBusqueda, VentanaBusqueda } from "./buscador-docs";

export interface SeccionBarra {
  clave: string;
  titulo: string;
  icono: IconoSitio;
  guias: { slug: string; titulo: string; href: string }[];
}

/**
 * Barra lateral de Docs. NUNCA se pierde: vive en el layout del grupo (docs),
 * marca la guía activa, y en el celular se pliega bajo un botón.
 */
export function BarraDocs({
  secciones,
  indice,
  inicioDocs,
}: {
  secciones: SeccionBarra[];
  indice: EntradaBuscador[];
  /** Dirección de la portada de Docs en el idioma actual. */
  inicioDocs: string;
}) {
  const { d } = useIdioma();
  const ruta = usePathname();
  const [abierta, setAbierta] = useState(false);

  const nav = (
    <nav aria-label={d.docs.navegacion} className="space-y-6">
      <Link
        href={inicioDocs}
        onClick={() => setAbierta(false)}
        aria-current={ruta === "/docs" || ruta === inicioDocs ? "page" : undefined}
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 font-bold ${ruta === "/docs" || ruta === inicioDocs ? "bg-tinta-suave text-tinta" : "text-noche hover:bg-percha/40"}`}
      >
        <Icono nombre="libro" className="size-5" />
        {d.docs.titulo}
      </Link>
      {secciones.map((s) => (
        <div key={s.clave}>
          <p className="flex items-center gap-2 px-2 text-xs font-bold tracking-wider text-gris uppercase">
            <Icono nombre={s.icono} className="size-4 text-tinta" />
            {s.titulo}
          </p>
          <ul className="mt-1.5 space-y-0.5 border-l border-percha pl-2 ml-4">
            {s.guias.map((g) => {
              const activa = ruta === g.href || ruta === `/docs/${g.slug}`;
              return (
                <li key={g.slug}>
                  <Link
                    href={g.href}
                    onClick={() => setAbierta(false)}
                    aria-current={activa ? "page" : undefined}
                    className={`block rounded-lg px-2.5 py-1.5 text-[15px] transition ${
                      activa
                        ? "bg-tinta text-white font-semibold"
                        : "text-noche/80 hover:bg-percha/40 hover:text-noche"
                    }`}
                  >
                    {g.titulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <VentanaBusqueda indice={indice} />
      <aside className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100dvh-6rem)] space-y-5 overflow-y-auto pr-2 pb-8">
          <BotonBusqueda alAbrir={abrirBusqueda} />
          {nav}
        </div>
      </aside>
      <div className="lg:hidden">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAbierta((a) => !a)}
            aria-expanded={abierta}
            className="flex flex-1 items-center gap-2 rounded-xl bg-superficie px-3 py-2.5 font-semibold ring-1 ring-percha"
          >
            <Icono nombre="libro" className="size-5 text-tinta" />
            <span className="flex-1 text-left">{abierta ? d.docs.cerrarGuias : d.docs.verGuias}</span>
            <svg
              viewBox="0 0 16 16"
              className={`size-4 transition ${abierta ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              <path
                d="m4 6 4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="w-28">
            <BotonBusqueda alAbrir={abrirBusqueda} />
          </div>
        </div>
        {abierta && <div className="mt-3 rounded-2xl bg-superficie p-4 ring-1 ring-percha/70">{nav}</div>}
      </div>
    </>
  );
}
