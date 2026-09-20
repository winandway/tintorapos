"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { Boton } from "@/components/ui/boton";
import { useIdioma } from "@/lib/i18n/cliente";

const PAGINAS = [
  { ruta: "/app/contabilidad", clave: "ganancia" },
  { ruta: "/app/contabilidad/gastos", clave: "gastos" },
  { ruta: "/app/contabilidad/compras", clave: "compras" },
  { ruta: "/app/contabilidad/insumos", clave: "insumos" },
  { ruta: "/app/contabilidad/proveedores", clave: "proveedores" },
  { ruta: "/app/contabilidad/cobrar", clave: "cobrar" },
  { ruta: "/app/contabilidad/impuestos", clave: "impuestos" },
] as const;

/** Encabezado y pestañas de toda la sección de contabilidad. */
export function MarcoContabilidad({
  titulo,
  subtitulo,
  acciones,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  acciones?: ReactNode;
  children: ReactNode;
}) {
  const { d } = useIdioma();
  const ruta = usePathname();
  return (
    <div className="mx-auto max-w-6xl">
      <EncabezadoPagina titulo={titulo} subtitulo={subtitulo} acciones={acciones} />
      <nav aria-label={d.contabilidad.titulo} className="-mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {PAGINAS.map((p) => {
          const activa = ruta === p.ruta;
          return (
            <Link
              key={p.ruta}
              href={p.ruta}
              aria-current={activa ? "page" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[14px] font-semibold ring-1 ${activa ? "bg-tinta text-white ring-tinta" : "bg-superficie ring-percha hover:bg-tinta-suave"}`}
            >
              {d.contabilidad.nav[p.clave]}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}

const PRESETS = ["hoy", "ayer", "7", "30", "mes"] as const;

/** Los atajos de fecha y el rango a mano. Devuelve la consulta lista para pedir. */
export function useRango(inicial: (typeof PRESETS)[number] = "mes") {
  const { d } = useIdioma();
  const dc = d.contabilidad;
  const [preset, setPreset] = useState<string>(inicial);
  const [rango, setRango] = useState<{ desde: string; hasta: string } | null>(null);
  const [borrador, setBorrador] = useState({ desde: "", hasta: "" });
  const consulta = rango ? `desde=${rango.desde}&hasta=${rango.hasta}` : `preset=${preset}`;
  const control = (
    <div className="mb-4 flex flex-wrap items-end gap-2">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={dc.desde}>
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={!rango && preset === p}
            onClick={() => {
              setPreset(p);
              setRango(null);
            }}
            className={`rounded-full px-3.5 py-2 text-[14px] font-semibold ring-1 ${!rango && preset === p ? "bg-tinta text-white ring-tinta" : "bg-superficie ring-percha"}`}
          >
            {dc.presets[p]}
          </button>
        ))}
      </div>
      <label className="text-[13px]">
        <span className="block text-gris">{dc.desde}</span>
        <input
          type="date"
          value={borrador.desde}
          onChange={(e) => setBorrador({ ...borrador, desde: e.target.value })}
          className="h-10 rounded-xl bg-superficie px-2 ring-1 ring-percha"
        />
      </label>
      <label className="text-[13px]">
        <span className="block text-gris">{dc.hasta}</span>
        <input
          type="date"
          value={borrador.hasta}
          onChange={(e) => setBorrador({ ...borrador, hasta: e.target.value })}
          className="h-10 rounded-xl bg-superficie px-2 ring-1 ring-percha"
        />
      </label>
      <Boton
        variante="secundario"
        disabled={!borrador.desde || !borrador.hasta || borrador.desde > borrador.hasta}
        onClick={() => setRango(borrador)}
      >
        {dc.aplicar}
      </Boton>
    </div>
  );
  return { consulta, control };
}
