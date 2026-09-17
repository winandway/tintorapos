"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icono } from "@/components/marca/iconos-sitio";
import type { EntradaBuscador } from "@/lib/docs";
import { buscarGuias } from "@/lib/docs/buscar";
import { fmt } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";

function useResultados(indice: EntradaBuscador[]) {
  const [consulta, setConsulta] = useState("");
  const [activo, setActivo] = useState(0);
  const resultados = buscarGuias(indice, consulta);
  return {
    consulta,
    resultados,
    activo: Math.min(activo, Math.max(resultados.length - 1, 0)),
    cambiar(v: string) {
      setConsulta(v);
      setActivo(0);
    },
    mover(delta: number) {
      setActivo((a) =>
        resultados.length
          ? (Math.min(a, resultados.length - 1) + delta + resultados.length) % resultados.length
          : 0,
      );
    },
  };
}

function ListaResultados({
  id,
  r,
  alElegir,
}: {
  id: string;
  r: ReturnType<typeof useResultados>;
  alElegir: (href: string) => void;
}) {
  const { d } = useIdioma();
  if (!r.consulta.trim()) return null;
  if (r.resultados.length === 0)
    return (
      <p className="px-4 py-6 text-center text-gris">{fmt(d.docs.sinResultados, { q: r.consulta.trim() })}</p>
    );
  return (
    <ul id={id} role="listbox" aria-label={d.docs.resultados} className="max-h-[60dvh] overflow-y-auto p-2">
      {r.resultados.map((e, i) => (
        <li
          key={e.slug}
          id={`${id}-${i}`}
          role="option"
          aria-selected={i === r.activo}
          onMouseDown={(ev) => {
            ev.preventDefault();
            alElegir(e.href);
          }}
          className={`flex cursor-pointer gap-3 rounded-xl px-3 py-2.5 ${i === r.activo ? "bg-tinta-suave" : "hover:bg-papel"}`}
        >
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-superficie text-tinta ring-1 ring-percha/70">
            <Icono nombre={e.icono} className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-gris">{e.seccion}</span>
            <span className="block font-semibold text-noche">{e.titulo}</span>
            <span className="line-clamp-2 block text-sm text-gris">{e.resumen}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function teclas(
  r: ReturnType<typeof useResultados>,
  alElegir: (slug: string) => void,
  alEscapar: () => void,
) {
  return (ev: React.KeyboardEvent) => {
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      r.mover(1);
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      r.mover(-1);
    } else if (ev.key === "Enter") {
      const e = r.resultados[r.activo];
      if (e) {
        ev.preventDefault();
        alElegir(e.href);
      }
    } else if (ev.key === "Escape") {
      alEscapar();
    }
  };
}

/** Buscador grande de la portada de Docs: filtra mientras se escribe. */
export function BuscadorGrande({ indice }: { indice: EntradaBuscador[] }) {
  const { d } = useIdioma();
  const router = useRouter();
  const r = useResultados(indice);
  const id = useId();
  const elegir = (href: string) => router.push(href);
  const abierto = r.consulta.trim() !== "";
  return (
    <div className="relative">
      <label htmlFor={`${id}-q`} className="sr-only">
        {d.docs.buscar}
      </label>
      <div className="flex items-center gap-3 rounded-2xl bg-superficie px-4 ring-2 ring-percha transition focus-within:ring-tinta">
        <Icono nombre="pregunta" className="size-6 shrink-0 text-tinta" />
        <input
          id={`${id}-q`}
          type="search"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={`${id}-lista`}
          aria-activedescendant={abierto && r.resultados.length ? `${id}-lista-${r.activo}` : undefined}
          autoComplete="off"
          value={r.consulta}
          onChange={(ev) => r.cambiar(ev.target.value)}
          onKeyDown={teclas(r, elegir, () => r.cambiar(""))}
          placeholder={d.docs.buscar}
          className="h-16 w-full min-w-0 bg-transparent text-lg outline-none placeholder:text-gris-claro focus-visible:outline-none"
        />
        <kbd className="hidden rounded-md bg-papel px-2 py-1 text-xs font-semibold text-gris ring-1 ring-percha sm:block">
          ⌘K
        </kbd>
      </div>
      {abierto && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-2xl bg-superficie shadow-ticket ring-1 ring-percha/70">
          <ListaResultados id={`${id}-lista`} r={r} alElegir={elegir} />
        </div>
      )}
    </div>
  );
}

/** Botón que abre la ventana de búsqueda. */
export function BotonBusqueda({ alAbrir }: { alAbrir: () => void }) {
  const { d } = useIdioma();
  return (
    <button
      type="button"
      onClick={alAbrir}
      aria-haspopup="dialog"
      className="flex w-full items-center gap-2 rounded-xl bg-superficie px-3 py-2.5 text-left text-gris ring-1 ring-percha transition hover:ring-tinta/40"
    >
      <Icono nombre="pregunta" className="size-5 text-tinta" />
      <span className="flex-1">{d.docs.buscarCorto}</span>
      <kbd className="rounded-md bg-papel px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-percha">⌘K</kbd>
    </button>
  );
}

/**
 * Ventana de búsqueda. Hay UNA sola por página (la monta la barra de Docs), y el
 * atajo ⌘K / Ctrl+K lo escucha solo ella: dos copias abrirían dos ventanas.
 */
export function VentanaBusqueda({ indice }: { indice: EntradaBuscador[] }) {
  const { d } = useIdioma();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const r = useResultados(indice);
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function atajo(ev: KeyboardEvent) {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        setAbierto(true);
      }
    }
    function abrir() {
      setAbierto(true);
    }
    window.addEventListener("keydown", atajo);
    window.addEventListener(EVENTO_ABRIR_BUSQUEDA, abrir);
    return () => {
      window.removeEventListener("keydown", atajo);
      window.removeEventListener(EVENTO_ABRIR_BUSQUEDA, abrir);
    };
  }, []);

  useEffect(() => {
    if (abierto) entrada.current?.focus();
  }, [abierto]);

  const cerrar = () => {
    setAbierto(false);
    r.cambiar("");
  };
  const elegir = (href: string) => {
    cerrar();
    router.push(href);
  };

  if (!abierto) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-noche/40 px-4 pt-[12dvh] backdrop-blur-sm"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) cerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={d.docs.buscarCorto}
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-superficie shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-percha px-4">
          <Icono nombre="pregunta" className="size-5 shrink-0 text-tinta" />
          <input
            ref={entrada}
            type="search"
            role="combobox"
            aria-expanded={r.resultados.length > 0}
            aria-controls={`${id}-lista`}
            aria-activedescendant={r.resultados.length ? `${id}-lista-${r.activo}` : undefined}
            aria-label={d.docs.buscar}
            autoComplete="off"
            value={r.consulta}
            onChange={(ev) => r.cambiar(ev.target.value)}
            onKeyDown={teclas(r, elegir, cerrar)}
            placeholder={d.docs.buscar}
            className="h-14 w-full min-w-0 bg-transparent text-base outline-none placeholder:text-gris-claro focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={cerrar}
            className="rounded-md px-2 py-1 text-xs font-semibold text-gris ring-1 ring-percha"
          >
            Esc
          </button>
        </div>
        <ListaResultados id={`${id}-lista`} r={r} alElegir={elegir} />
      </div>
    </div>
  );
}

export const EVENTO_ABRIR_BUSQUEDA = "tintora:buscar-docs";

export function abrirBusqueda() {
  window.dispatchEvent(new Event(EVENTO_ABRIR_BUSQUEDA));
}
