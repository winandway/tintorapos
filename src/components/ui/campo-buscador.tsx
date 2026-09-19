"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useIdioma } from "@/lib/i18n/cliente";

export interface OpcionBuscador {
  valor: string;
  texto: string;
  /** Lo que se ve a la izquierda (una banderita, por ejemplo). */
  icono?: string;
  /** Detalle a la derecha (la moneda del país, la hora de la zona). */
  detalle?: string;
  /** Palabras extra por las que también se encuentra. */
  busca?: string;
}

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Selector con buscador: se escribe y filtra. Para listas largas de verdad
 * (todos los países, todas las monedas, todas las zonas horarias), donde un
 * desplegable normal obliga a rodar la rueda del ratón media hora.
 */
export function CampoBuscador({
  etiqueta,
  valor,
  opciones,
  alElegir,
  placeholder,
  error,
  ayuda,
  className = "",
}: {
  etiqueta: string;
  valor: string;
  opciones: OpcionBuscador[];
  alElegir: (valor: string) => void;
  placeholder?: string;
  error?: string | null;
  ayuda?: string;
  className?: string;
}) {
  const { d } = useIdioma();
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [activo, setActivo] = useState(0);
  const caja = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  const elegida = opciones.find((o) => o.valor === valor);

  const filtradas = useMemo(() => {
    const q = normalizar(consulta.trim());
    if (!q) return opciones;
    const palabras = q.split(/\s+/);
    return opciones.filter((o) => {
      const texto = normalizar(`${o.texto} ${o.valor} ${o.detalle ?? ""} ${o.busca ?? ""}`);
      return palabras.every((p) => texto.includes(p));
    });
  }, [opciones, consulta]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, [abierto]);

  useEffect(() => {
    if (abierto) campo.current?.focus();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    lista.current?.querySelector('[data-activo="1"]')?.scrollIntoView({ block: "nearest" });
  }, [activo, abierto]);

  function elegir(o: OpcionBuscador) {
    alElegir(o.valor);
    setAbierto(false);
    setConsulta("");
  }

  function teclas(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!abierto) return setAbierto(true);
      setActivo((i) => {
        const n = filtradas.length;
        if (!n) return 0;
        return e.key === "ArrowDown" ? (i + 1) % n : (i - 1 + n) % n;
      });
    } else if (e.key === "Enter" && abierto) {
      e.preventDefault();
      const o = filtradas[activo];
      if (o) elegir(o);
    } else if (e.key === "Escape") {
      setAbierto(false);
      setConsulta("");
    }
  }

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-2 text-sm font-semibold text-noche"
      >
        <span>{etiqueta}</span>
      </label>
      <div ref={caja} className="relative mt-1.5">
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={abierto}
          aria-controls={`${id}-lista`}
          aria-haspopup="listbox"
          aria-invalid={error ? true : undefined}
          onClick={() => {
            setAbierto(!abierto);
            setActivo(
              Math.max(
                0,
                filtradas.findIndex((o) => o.valor === valor),
              ),
            );
          }}
          onKeyDown={teclas}
          className={`flex w-full items-center gap-2 rounded-xl bg-superficie px-3.5 py-2.5 text-left text-[16px] ring-1 ring-inset ${error ? "ring-peligro" : "ring-percha"} focus:ring-2 focus:ring-tinta focus:outline-none`}
        >
          {elegida?.icono && <span aria-hidden="true">{elegida.icono}</span>}
          <span className={`min-w-0 flex-1 truncate ${elegida ? "text-noche" : "text-gris-claro"}`}>
            {elegida?.texto ?? placeholder ?? ""}
          </span>
          {elegida?.detalle && <span className="text-[13px] text-gris">{elegida.detalle}</span>}
          <span aria-hidden="true" className="text-gris">
            ▾
          </span>
        </button>

        {abierto && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-2xl bg-superficie shadow-xl ring-1 ring-percha">
            <div className="border-b border-percha/70 p-2">
              <input
                ref={campo}
                type="search"
                value={consulta}
                onChange={(e) => {
                  setConsulta(e.target.value);
                  setActivo(0);
                }}
                onKeyDown={teclas}
                placeholder={d.comun.buscar}
                aria-label={d.comun.buscar}
                className="w-full rounded-xl bg-papel px-3 py-2 text-[16px] ring-1 ring-percha focus:ring-2 focus:ring-tinta focus:outline-none"
              />
            </div>
            <ul
              ref={lista}
              id={`${id}-lista`}
              role="listbox"
              aria-label={etiqueta}
              className="max-h-64 overflow-y-auto py-1"
            >
              {filtradas.length === 0 && (
                <li className="px-3 py-3 text-[15px] text-gris">{d.comun.sinResultados}</li>
              )}
              {filtradas.map((o, i) => (
                <li key={o.valor}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.valor === valor}
                    data-activo={i === activo ? "1" : "0"}
                    onMouseEnter={() => setActivo(i)}
                    onClick={() => elegir(o)}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[15px] ${i === activo ? "bg-papel" : ""} ${o.valor === valor ? "font-semibold text-tinta" : "text-noche"}`}
                  >
                    {o.icono && <span aria-hidden="true">{o.icono}</span>}
                    <span className="min-w-0 flex-1 truncate">{o.texto}</span>
                    {o.detalle && <span className="text-[13px] text-gris">{o.detalle}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-[13px] text-peligro">{error}</p>
      ) : ayuda ? (
        <p className="mt-1 text-[13px] text-gris">{ayuda}</p>
      ) : null}
    </div>
  );
}
