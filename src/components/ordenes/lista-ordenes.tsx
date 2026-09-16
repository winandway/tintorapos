"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Boton } from "@/components/ui/boton";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { Ticket } from "@/components/ui/ticket";
import { textoError } from "@/lib/errores-cliente";
import { fmt, formatoDinero, formatoFecha } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";
import { EtiquetaEstado } from "./etiqueta-estado";

interface OrdenLista {
  id: string;
  numero: number;
  estado: string;
  urgente: boolean;
  fechaPromesa: number;
  atrasada: boolean;
  dia: number;
  totalCents: number;
  saldoCents: number;
  piezas: number;
  listas: number;
  cliente: string;
  creadaEn: number;
}

const FILTROS = ["abiertas", "atrasadas", "lista", "entregada", "anulada", "todas"] as const;

export function ListaOrdenes({ moneda, zona, montos }: { moneda: string; zona: string; montos: boolean }) {
  const { d, idioma } = useIdioma();
  const dor = d.ordenes;
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("abiertas");
  const [q, setQ] = useState("");
  const [antes, setAntes] = useState<number | null>(null);
  const consulta = useDeferredValue(q);
  const url = `/datos/ordenes?estado=${filtro}&q=${encodeURIComponent(consulta)}${antes ? `&antes=${antes}` : ""}`;
  const { datos, error } = useDatos<{ ordenes: OrdenLista[] }>(url);
  const dinero = (n: number) => formatoDinero(n, moneda, idioma);

  return (
    <div className="mx-auto max-w-5xl">
      <EncabezadoPagina titulo={dor.titulo} />
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAntes(null);
          }}
          placeholder={dor.buscar}
          aria-label={dor.buscar}
          className="h-12 min-w-0 flex-1 rounded-2xl bg-superficie px-4 text-[16px] ring-1 ring-percha focus:ring-2 focus:ring-tinta focus:outline-none"
        />
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex w-max gap-1.5" role="tablist">
            {FILTROS.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filtro === f}
                onClick={() => {
                  setFiltro(f);
                  setAntes(null);
                }}
                className={`rounded-full px-3.5 py-2 text-[14px] font-semibold ring-1 ${filtro === f ? "bg-tinta text-white ring-tinta" : "bg-superficie text-noche ring-percha"}`}
              >
                {dor.filtros[f]}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error ? (
        <p className="text-peligro">{textoError(d, error)}</p>
      ) : !datos ? (
        <p className="text-gris">{d.comun.cargando}</p>
      ) : datos.ordenes.length === 0 ? (
        <p className="rounded-3xl bg-superficie p-6 text-center text-gris ring-1 ring-percha/80">
          {dor.vacio}
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {datos.ordenes.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/app/ordenes/${o.id}`}
                  className="flex items-center gap-3 rounded-3xl bg-superficie p-3 ring-1 ring-percha/80 hover:ring-2 hover:ring-tinta"
                >
                  <Ticket numero={o.numero} dia={o.dia} tamano="chico" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-semibold">{o.cliente}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <EtiquetaEstado estado={o.estado} atrasada={o.atrasada} />
                      {o.urgente && (
                        <span className="rounded-full bg-peligro px-2 py-0.5 text-[11px] font-bold text-white">
                          {d.produccion.urgente}
                        </span>
                      )}
                      <span className="text-[13px] text-gris">
                        {fmt(dor.listas, { listas: o.listas, total: o.piezas })}
                      </span>
                    </span>
                    <span className="block text-[12px] text-gris">
                      {fmt(dor.lista, {
                        fecha: formatoFecha(o.fechaPromesa, idioma, zona, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }),
                      })}
                    </span>
                  </span>
                  {montos && (
                    <span className="text-right">
                      <span className="cifra block font-bold">{dinero(o.totalCents)}</span>
                      {o.saldoCents > 0 && (
                        <span className="cifra block text-[13px] font-semibold text-peligro">
                          {dinero(o.saldoCents)}
                        </span>
                      )}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {datos.ordenes.length >= 50 && (
            <div className="mt-4 flex justify-center">
              <Boton
                variante="secundario"
                onClick={() => setAntes(datos.ordenes[datos.ordenes.length - 1]!.creadaEn)}
              >
                {dor.cargarMas}
              </Boton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
