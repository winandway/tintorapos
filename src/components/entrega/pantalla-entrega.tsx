"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { EtiquetaEstado } from "@/components/ordenes/etiqueta-estado";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoTexto } from "@/components/ui/campo";
import { CampoEscaneo } from "@/components/ui/campo-escaneo";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { Ticket } from "@/components/ui/ticket";
import { ErrorApi, pedir } from "@/lib/api";
import { extraerCodigo, nuevoId } from "@/lib/codigos";
import { textoError } from "@/lib/errores-cliente";
import { fmt, formatoDinero, formatoFecha, textoBilingue } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { entregarOrden } from "@/lib/operaciones";
import { useDatos } from "@/lib/use-datos";

interface OrdenLista {
  id: string;
  numero: number;
  estado: string;
  dia: number;
  atrasada: boolean;
  totalCents: number;
  saldoCents: number;
  piezas: number;
  listas: number;
  cliente: string;
  telefono: string | null;
}

interface Orden {
  id: string;
  numero: number;
  estado: string;
  dia: number;
  totalCents: number;
  saldoCents: number;
  fechaPromesa: number;
  cliente: { nombre: string; apellido: string | null };
  prendas: {
    id: string;
    prendaEs: string;
    prendaEn: string | null;
    estado: string;
    ubicacion: string | null;
  }[];
}

type Metodo = "efectivo" | "tarjeta_externa" | "otro";

export function PantallaEntrega({ moneda, zona }: { moneda: string; zona: string }) {
  const { d, idioma } = useIdioma();
  const de = d.entrega;
  const [candidatas, setCandidatas] = useState<OrdenLista[] | null>(null);
  const [orden, setOrden] = useState<Orden | null>(null);
  const [metodo, setMetodo] = useState<Metodo>("efectivo");
  const [referencia, setReferencia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [hecha, setHecha] = useState<number | null>(null);
  const caja = useDatos<{ turno: unknown }>("/datos/caja");
  const dinero = (n: number) => formatoDinero(n, moneda, idioma);

  const abrirOrden = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const r = await pedir<{ orden: Orden }>(`/datos/ordenes/${id}`);
        setOrden(r.orden);
        setCandidatas(null);
      } catch (e) {
        setError(textoError(d, e));
      }
    },
    [d],
  );

  const buscar = useCallback(
    async (texto: string) => {
      setError(null);
      setHecha(null);
      setOrden(null);
      if (extraerCodigo(texto)) {
        try {
          const r = await pedir<{ ordenId: string }>(`/datos/escaneo?codigo=${encodeURIComponent(texto)}`);
          return abrirOrden(r.ordenId);
        } catch (e) {
          return setError(textoError(d, e));
        }
      }
      try {
        const r = await pedir<{ ordenes: OrdenLista[] }>(
          `/datos/ordenes?estado=abiertas&q=${encodeURIComponent(texto)}`,
        );
        if (r.ordenes.length === 1) return abrirOrden(r.ordenes[0]!.id);
        setCandidatas(r.ordenes);
      } catch (e) {
        setError(textoError(d, e));
      }
    },
    [abrirOrden, d],
  );

  async function entregar(forzar: boolean) {
    if (!orden) return;
    setOcupado(true);
    setError(null);
    try {
      await entregarOrden(orden.id, {
        ...(forzar ? { forzar: true } : {}),
        ...(orden.saldoCents > 0
          ? {
              pago: {
                id: nuevoId(),
                metodo,
                montoCents: orden.saldoCents,
                ...(referencia && metodo !== "efectivo" ? { referencia } : {}),
              },
            }
          : {}),
      });
      setHecha(orden.numero);
      setOrden(null);
      setReferencia("");
    } catch (e) {
      setError(textoError(d, e));
      if (e instanceof ErrorApi && e.codigo === "estado_invalido") setError(de.noLista);
    } finally {
      setOcupado(false);
    }
  }

  const noLista = orden ? orden.prendas.some((p) => p.estado !== "lista" && p.estado !== "anulada") : false;
  const ubicaciones = orden ? [...new Set(orden.prendas.map((p) => p.ubicacion).filter(Boolean))] : [];
  const cajaCerrada = metodo === "efectivo" && !caja.datos?.turno && (orden?.saldoCents ?? 0) > 0;

  return (
    <div className="mx-auto max-w-3xl">
      <EncabezadoPagina titulo={de.titulo} subtitulo={de.subtitulo} />
      <CampoEscaneo alLeer={buscar} placeholder={de.buscar} ocupado={ocupado} />
      {error && (
        <Aviso tono="error" className="mt-3">
          {error}
        </Aviso>
      )}
      {hecha !== null && <Aviso tono="ok" className="mt-3" titulo={fmt(de.entregada, { numero: hecha })} />}
      {candidatas && (
        <section className="mt-4">
          {candidatas.length === 0 ? (
            <p className="rounded-3xl bg-superficie p-5 text-center text-gris ring-1 ring-percha/80">
              {de.sinOrdenes}
            </p>
          ) : (
            <>
              <h2 className="mb-2 font-bold">{de.elegir}</h2>
              <ul className="space-y-2">
                {candidatas.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => abrirOrden(o.id)}
                      className="flex w-full items-center gap-3 rounded-3xl bg-superficie p-3 text-left ring-1 ring-percha hover:ring-2 hover:ring-tinta"
                    >
                      <Ticket numero={o.numero} dia={o.dia} tamano="chico" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{o.cliente}</span>
                        <EtiquetaEstado estado={o.estado} atrasada={o.atrasada} />
                      </span>
                      <span className={`cifra font-bold ${o.saldoCents > 0 ? "text-peligro" : "text-ok"}`}>
                        {o.saldoCents > 0 ? dinero(o.saldoCents) : "✓"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
      {orden && (
        <section className="mt-4 space-y-4 rounded-3xl bg-superficie p-5 ring-2 ring-tinta">
          <div className="flex items-start gap-4">
            <Ticket numero={orden.numero} dia={orden.dia} arriba={d.ordenes.dias[orden.dia]} />
            <div className="min-w-0 flex-1">
              <p className="text-[19px] font-bold">
                {orden.cliente.nombre} {orden.cliente.apellido ?? ""}
              </p>
              <EtiquetaEstado estado={orden.estado} />
              <p className="mt-1 text-[13px] text-gris">{formatoFecha(orden.fechaPromesa, idioma, zona)}</p>
              {ubicaciones.length > 0 && (
                <p className="mt-1 font-bold text-tinta">
                  📍 {fmt(de.ubicaciones, { ubicaciones: ubicaciones.join(", ") })}
                </p>
              )}
            </div>
            <Link href={`/app/ordenes/${orden.id}`} className="text-sm font-semibold text-tinta">
              →
            </Link>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {orden.prendas.map((p) => (
              <li
                key={p.id}
                className={`rounded-full px-2.5 py-1 text-[13px] ${p.estado === "lista" ? "bg-ok-suave text-ok" : "bg-alerta-suave text-alerta"}`}
              >
                {textoBilingue(idioma, p.prendaEs, p.prendaEn)}
              </li>
            ))}
          </ul>
          <div className={`rounded-2xl p-4 ${orden.saldoCents > 0 ? "bg-peligro-suave" : "bg-ok-suave"}`}>
            <p className="text-[13px]">{orden.saldoCents > 0 ? de.saldo : de.pagada}</p>
            <p className="numero-ticket text-5xl">{dinero(orden.saldoCents)}</p>
          </div>
          {orden.saldoCents > 0 && (
            <div className="space-y-3">
              <div
                className="grid grid-cols-3 gap-1 rounded-2xl bg-papel p-1"
                role="radiogroup"
                aria-label={de.metodo}
              >
                {(["efectivo", "tarjeta_externa", "otro"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={metodo === m}
                    onClick={() => setMetodo(m)}
                    className={`rounded-xl py-2.5 text-[14px] font-semibold ${metodo === m ? "bg-superficie text-tinta shadow ring-1 ring-percha" : "text-gris"}`}
                  >
                    {d.caja.metodos[m]}
                  </button>
                ))}
              </div>
              {metodo !== "efectivo" && (
                <CampoTexto
                  etiqueta={d.mostrador.referencia}
                  placeholder={d.mostrador.referenciaPlaceholder}
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                />
              )}
              {cajaCerrada && (
                <Aviso tono="alerta">
                  {d.mostrador.cajaCerrada}{" "}
                  <Link href="/app/caja" className="font-bold underline">
                    {d.mostrador.irCaja}
                  </Link>
                </Aviso>
              )}
            </div>
          )}
          {noLista && <Aviso tono="alerta">{de.noLista}</Aviso>}
          <Boton
            ancho
            tamano="grande"
            variante="exito"
            cargando={ocupado}
            disabled={cajaCerrada}
            onClick={() => entregar(noLista)}
          >
            {noLista
              ? de.entregarIgual
              : orden.saldoCents > 0
                ? fmt(de.cobrarYEntregar, { monto: dinero(orden.saldoCents) })
                : de.entregar}
          </Boton>
        </section>
      )}
    </div>
  );
}
