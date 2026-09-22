"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { EtiquetaEstado } from "@/components/ordenes/etiqueta-estado";
import { Aviso, useAvisar } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoEscaneo } from "@/components/ui/campo-escaneo";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { Ticket } from "@/components/ui/ticket";
import { ErrorApi, pedir } from "@/lib/api";
import { extraerCodigo } from "@/lib/codigos";
import { ahoraMs } from "@/lib/fechas";
import { buscarOrdenLocal, datosSinConexion } from "@/lib/sin-conexion/cache";
import { ordenVistaLocal } from "@/lib/sin-conexion/vistas";
import { textoError } from "@/lib/errores-cliente";
import { fmt, formatoFecha, textoBilingue } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { cambiarEstadoOrden } from "@/lib/operaciones";
import { useDatos } from "@/lib/use-datos";

interface OrdenVista {
  id: string;
  numero: number;
  estado: string;
  urgente: boolean;
  dia: number;
  fechaPromesa: number;
  atrasada: boolean;
  cliente: { nombre: string };
  prendas: {
    id: string;
    prendaEs: string;
    prendaEn: string | null;
    servicioEs: string;
    servicioEn: string | null;
    estado: string;
    ubicacion: string | null;
    codigoEtiqueta: string;
    notas: string | null;
  }[];
}

interface OrdenLista {
  id: string;
  numero: number;
  estado: string;
  urgente: boolean;
  dia: number;
  fechaPromesa: number;
  atrasada: boolean;
  cliente: string;
  piezas: number;
  listas: number;
}

export function PantallaProduccion({ zona }: { zona: string }) {
  const { d, idioma } = useIdioma();
  const dp = d.produccion;
  const avisar = useAvisar();
  const [orden, setOrden] = useState<OrdenVista | null>(null);
  const [prendaId, setPrendaId] = useState<string | null>(null);
  const [ubicacion, setUbicacion] = useState("");
  const [rapido, setRapido] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const lista = useDatos<{ ordenes: OrdenLista[] }>("/datos/ordenes?estado=abiertas", {
    cache: true,
    enVivo: true,
  });

  const mover = useCallback(
    async (o: OrdenVista, estado: "recibida" | "en_proceso" | "lista", soloPieza: string | null) => {
      setOcupado(true);
      try {
        const r = await cambiarEstadoOrden(o.id, {
          estado,
          ...(soloPieza ? { prendaIds: [soloPieza] } : {}),
          ...(ubicacion.trim() ? { ubicacion: ubicacion.trim() } : {}),
        });
        const textoEstado =
          d.ordenes.estados[r.estadoNuevo as keyof typeof d.ordenes.estados] ?? r.estadoNuevo;
        if (r.enCola) {
          // No llegó al servidor: se dice en ámbar, nunca en verde, y la tarjeta
          // cambia igual para que se vea que el toque sí se registró.
          avisar(fmt(dp.guardadoEnEquipo, { numero: o.numero, estado: textoEstado }), "alerta");
          const local = ordenVistaLocal(await datosSinConexion(), o.id, zona, ahoraMs());
          setOrden(
            local ?? {
              ...o,
              estado: r.estadoNuevo,
              prendas: o.prendas.map((p) =>
                !soloPieza || p.id === soloPieza
                  ? { ...p, estado, ubicacion: ubicacion.trim() || p.ubicacion }
                  : p,
              ),
            },
          );
        } else {
          avisar(fmt(dp.movida, { numero: o.numero, estado: textoEstado }));
          const fresca = await pedir<{ orden: OrdenVista }>(`/datos/ordenes/${o.id}`);
          setOrden(fresca.orden);
        }
        lista.recargar();
      } catch (e) {
        setError(textoError(d, e));
      } finally {
        setOcupado(false);
      }
    },
    [ubicacion, avisar, dp.movida, dp.guardadoEnEquipo, d, lista, zona],
  );

  const leer = useCallback(
    async (texto: string) => {
      setError(null);
      setOcupado(true);
      try {
        const r = await pedir<{ ordenId: string; prendaId: string | null }>(
          `/datos/escaneo?codigo=${encodeURIComponent(texto)}`,
        );
        const o = await pedir<{ orden: OrdenVista }>(`/datos/ordenes/${r.ordenId}`);
        setOrden(o.orden);
        setPrendaId(r.prendaId);
        setOcupado(false);
        if (rapido) await mover(o.orden, "lista", r.prendaId);
      } catch (e) {
        if (e instanceof ErrorApi && e.sinConexion) {
          // Sin conexión: se busca en la copia local de órdenes abiertas.
          const datos = await datosSinConexion();
          const [hallada] = buscarOrdenLocal(datos, texto, extraerCodigo(texto));
          const local = hallada ? ordenVistaLocal(datos, hallada.orden.id, zona, ahoraMs()) : null;
          setOcupado(false);
          if (!local) return setError(dp.noEncontrado);
          setOrden(local);
          setPrendaId(hallada!.prendaId);
          if (rapido) await mover(local, "lista", hallada!.prendaId);
          return;
        }
        setError(e instanceof ErrorApi && e.estado === 404 ? dp.noEncontrado : textoError(d, e));
        setOcupado(false);
      }
    },
    [d, dp.noEncontrado, rapido, mover, zona],
  );

  const nombre = (es: string, en: string | null) => textoBilingue(idioma, es, en);
  const columnas = ["recibida", "en_proceso", "lista"] as const;

  return (
    <div className="mx-auto max-w-6xl">
      <EncabezadoPagina titulo={dp.titulo} subtitulo={dp.subtitulo} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <CampoEscaneo alLeer={leer} placeholder={dp.escanearPlaceholder} ocupado={ocupado} />
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex items-center gap-2 text-[15px] font-semibold">
              <input
                type="checkbox"
                className="size-5 accent-tinta"
                checked={rapido}
                onChange={(e) => setRapido(e.target.checked)}
              />
              {dp.modoRapido}
            </label>
            <label className="text-[14px]">
              <span className="mb-1 block font-semibold">{dp.ubicacion}</span>
              <input
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value.toUpperCase())}
                placeholder={dp.ubicacionPlaceholder}
                className="h-10 w-32 rounded-xl bg-superficie px-3 ring-1 ring-percha"
              />
            </label>
          </div>
          {error && <Aviso tono="error">{error}</Aviso>}
          {orden && (
            <section className="rounded-3xl bg-superficie p-4 ring-2 ring-tinta" aria-live="polite">
              <div className="flex items-start gap-3">
                <Ticket numero={orden.numero} dia={orden.dia} arriba={d.ordenes.dias[orden.dia]} />
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-bold">{orden.cliente.nombre}</p>
                  <EtiquetaEstado estado={orden.estado} atrasada={orden.atrasada} />
                  {orden.urgente && (
                    <span className="ml-2 rounded-full bg-peligro px-2 py-0.5 text-[11px] font-bold text-white">
                      {dp.urgente}
                    </span>
                  )}
                  <p className="mt-1 text-[13px] text-gris">
                    {formatoFecha(orden.fechaPromesa, idioma, zona)}
                  </p>
                </div>
                <Link href={`/app/ordenes/${orden.id}`} className="text-sm font-semibold text-tinta">
                  →
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="self-center text-[13px] font-semibold text-gris">{dp.todaLaOrden}:</span>
                <Boton
                  tamano="chico"
                  variante="secundario"
                  disabled={ocupado}
                  onClick={() => mover(orden, "en_proceso", null)}
                >
                  {dp.enProceso}
                </Boton>
                <Boton
                  tamano="chico"
                  variante="exito"
                  disabled={ocupado}
                  onClick={() => mover(orden, "lista", null)}
                >
                  {dp.lista}
                </Boton>
              </div>
              <ul className="mt-3 divide-y divide-percha/60">
                {orden.prendas.map((p) => (
                  <li
                    key={p.id}
                    className={`flex items-center gap-2 py-2 ${p.id === prendaId ? "-mx-2 rounded-xl bg-tinta-suave px-2" : ""}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">
                        {nombre(p.prendaEs, p.prendaEn)}
                      </span>
                      <span className="block truncate text-[12px] text-gris">
                        {nombre(p.servicioEs, p.servicioEn)} · {p.codigoEtiqueta}
                        {p.ubicacion ? ` · 📍${p.ubicacion}` : ""}
                      </span>
                      {p.notas && <span className="block truncate text-[12px] text-alerta">⚠ {p.notas}</span>}
                    </span>
                    <EtiquetaEstado estado={p.estado} />
                    {p.estado !== "lista" && p.estado !== "entregada" && p.estado !== "anulada" && (
                      <Boton
                        tamano="chico"
                        variante="exito"
                        disabled={ocupado}
                        onClick={() => mover(orden, "lista", p.id)}
                        aria-label={`${dp.lista}: ${nombre(p.prendaEs, p.prendaEn)}`}
                      >
                        ✓
                      </Boton>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <div className="grid min-w-0 content-start gap-3 2xl:grid-cols-3">
          {columnas.map((c) => {
            const ordenes = (lista.datos?.ordenes ?? []).filter((o) => o.estado === c);
            return (
              <section key={c} className="min-w-0 rounded-3xl bg-superficie p-3 ring-1 ring-percha/80">
                <h2 className="mb-2 flex items-center justify-between px-1 text-[15px] font-bold">
                  {dp.columnas[c]}
                  <span className="rounded-full bg-papel px-2 text-[13px]">{ordenes.length}</span>
                </h2>
                {ordenes.length === 0 ? (
                  <p className="px-1 pb-2 text-[13px] text-gris">{dp.vacio}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {ordenes.map((o) => (
                      <li key={o.id}>
                        <button
                          type="button"
                          onClick={() => leer(String(o.numero))}
                          className="flex w-full items-center gap-2 rounded-2xl bg-papel px-2 py-1.5 text-left hover:ring-1 hover:ring-tinta"
                        >
                          <Ticket numero={o.numero} dia={o.dia} tamano="chico" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-semibold">{o.cliente}</span>
                            <span
                              className={`block text-[12px] ${o.atrasada ? "font-bold text-peligro" : "text-gris"}`}
                            >
                              {fmt(dp.piezasListas, { listas: o.listas, total: o.piezas })}
                              {o.urgente ? ` · ${dp.urgente}` : ""}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
