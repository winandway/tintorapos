"use client";

import { useState } from "react";
import { clasesBoton } from "@/components/ui/boton";
import { fmt } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import type { Pieza } from "@/lib/mostrador/carrito";

type ClaveColor =
  | "negro"
  | "blanco"
  | "crema"
  | "gris"
  | "vinotinto"
  | "azul"
  | "azulOscuro"
  | "verde"
  | "rojo"
  | "amarillo"
  | "rosado"
  | "naranja"
  | "morado"
  | "cafeColor";

/** Los colores del mundo real de una tintorería, con su muestra para tocarla. */
const COLORES: { clave: ClaveColor; muestra: string }[] = [
  { clave: "negro", muestra: "#111827" },
  { clave: "blanco", muestra: "#ffffff" },
  { clave: "crema", muestra: "#f3e8cf" },
  { clave: "gris", muestra: "#9ca3af" },
  { clave: "vinotinto", muestra: "#7f1d1d" },
  { clave: "azul", muestra: "#2563eb" },
  { clave: "azulOscuro", muestra: "#1e3a8a" },
  { clave: "verde", muestra: "#15803d" },
  { clave: "rojo", muestra: "#dc2626" },
  { clave: "amarillo", muestra: "#facc15" },
  { clave: "rosado", muestra: "#f9a8d4" },
  { clave: "naranja", muestra: "#ea580c" },
  { clave: "morado", muestra: "#7c3aed" },
  { clave: "cafeColor", muestra: "#78350f" },
];

function Chip({ activo, texto, alTocar }: { activo: boolean; texto: string; alTocar: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={alTocar}
      className={`rounded-full px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap transition active:scale-[0.97] ${
        activo
          ? "bg-tinta text-white ring-1 ring-tinta"
          : "bg-papel text-noche ring-1 ring-percha hover:ring-tinta"
      }`}
    >
      {texto}
    </button>
  );
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-16 flex-none pt-1.5 text-[11px] font-bold tracking-wide text-gris uppercase">
      {children}
    </span>
  );
}

/**
 * La barra de marcas del mostrador: con un toque se le pone a la prenda lo que
 * trae (daños, manchas y color). Queda en la etiqueta y en el recibo, que es lo
 * que protege a la tienda cuando el cliente reclama.
 */
export function BarraMarcas({
  pieza,
  nombrePrenda,
  numero,
  tieneFoto,
  alMarcar,
  alColor,
  alFoto,
}: {
  pieza: Pieza;
  nombrePrenda: string;
  numero: number;
  tieneFoto: boolean;
  alMarcar: (marca: string) => void;
  alColor: (color: string) => void;
  alFoto: (archivo: File | undefined) => void;
}) {
  const { d } = useIdioma();
  const dm = d.mostrador;
  const [abierta, setAbierta] = useState(true);
  const puestas = [pieza.color, ...pieza.marcas].filter(Boolean);
  return (
    <section
      aria-label={dm.marcas}
      className="rounded-3xl bg-superficie p-3 shadow-lg ring-1 ring-percha/80"
      data-testid="marcas-prenda"
    >
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-[15px] font-bold">
          {nombrePrenda} <span className="text-gris">· {fmt(dm.piezaNumero, { n: numero })}</span>
          <span className="ml-2 text-[13px] font-normal text-gris">
            {puestas.length ? puestas.join(" · ") : dm.sinMarcas}
          </span>
        </p>
        <label className={`${clasesBoton(tieneFoto ? "exito" : "secundario", "chico")} cursor-pointer`}>
          {tieneFoto ? `✓ ${dm.fotoLista}` : `📷 ${dm.tomarFoto}`}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => alFoto(e.target.files?.[0])}
          />
        </label>
        <button
          type="button"
          onClick={() => setAbierta(!abierta)}
          aria-expanded={abierta}
          aria-label={dm.marcas}
          className="size-9 flex-none rounded-full text-lg text-gris ring-1 ring-percha hover:text-tinta"
        >
          {abierta ? "▾" : "▴"}
        </button>
      </div>

      {abierta && (
        <div className="mt-2 space-y-1.5">
          <div className="flex gap-2">
            <Etiqueta>{dm.danos}</Etiqueta>
            <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
              {Object.entries(dm.listaDanos).map(([clave, texto]) => (
                <Chip
                  key={clave}
                  texto={texto}
                  activo={pieza.marcas.includes(texto)}
                  alTocar={() => alMarcar(texto)}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Etiqueta>{dm.manchas}</Etiqueta>
            <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
              {Object.entries(dm.listaManchas).map(([clave, texto]) => (
                <Chip
                  key={clave}
                  texto={texto}
                  activo={pieza.marcas.includes(texto)}
                  alTocar={() => alMarcar(texto)}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Etiqueta>{dm.colores}</Etiqueta>
            <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
              {COLORES.map((c) => {
                const texto = dm.listaColores[c.clave];
                const activo = pieza.color === texto;
                return (
                  <button
                    key={c.clave}
                    type="button"
                    title={texto}
                    aria-label={texto}
                    aria-pressed={activo}
                    onClick={() => alColor(activo ? "" : texto)}
                    className={`size-7 rounded-full ring-1 ring-percha transition active:scale-95 ${
                      activo ? "ring-4 ring-tinta" : "hover:ring-tinta"
                    }`}
                    style={{ backgroundColor: c.muestra }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
