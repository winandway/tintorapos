"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { EtiquetaEstado } from "@/components/ordenes/etiqueta-estado";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoTexto } from "@/components/ui/campo";
import { CampoDinero } from "@/components/ui/campo-dinero";
import { CampoEscaneo } from "@/components/ui/campo-escaneo";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { Modal } from "@/components/ui/modal";
import { Ticket } from "@/components/ui/ticket";
import { ErrorApi, pedir } from "@/lib/api";
import { extraerCodigo, nuevoId } from "@/lib/codigos";
import { aCentavos } from "@/lib/dinero";
import { ahoraMs } from "@/lib/fechas";
import { buscarOrdenLocal, datosSinConexion } from "@/lib/sin-conexion/cache";
import { ordenVistaLocal } from "@/lib/sin-conexion/vistas";
import { useEnLinea } from "@/lib/sin-conexion/use-en-linea";
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
  entregadaEn?: number | null;
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
  const [hecha, setHecha] = useState<{ numero: number; enCola: boolean } | null>(null);
  const [abriendoCaja, setAbriendoCaja] = useState(false);
  const [fondo, setFondo] = useState("");
  const [errorCaja, setErrorCaja] = useState<string | null>(null);
  // Estado de la caja para quien cobra, tenga o no permiso de abrirla (B44).
  const caja = useDatos<{ abierta: boolean; puedeAbrir: boolean }>("/datos/caja/estado", {
    cache: true,
    enVivo: true,
  });
  const enLinea = useEnLinea();
  const dinero = (n: number) => formatoDinero(n, moneda, idioma);

  const abrirOrden = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const r = await pedir<{ orden: Orden }>(`/datos/ordenes/${id}`);
        setOrden(r.orden);
        setCandidatas(null);
      } catch (e) {
        const local =
          e instanceof ErrorApi && e.sinConexion
            ? ordenVistaLocal(await datosSinConexion(), id, zona, ahoraMs())
            : null;
        if (local) {
          setOrden(local);
          setCandidatas(null);
        } else setError(textoError(d, e));
      }
    },
    [d, zona],
  );

  const buscar = useCallback(
    async (texto: string) => {
      setError(null);
      setHecha(null);
      setOrden(null);
      const codigo = extraerCodigo(texto);
      try {
        if (codigo) {
          const r = await pedir<{ ordenId: string }>(`/datos/escaneo?codigo=${encodeURIComponent(texto)}`);
          return abrirOrden(r.ordenId);
        }
        const r = await pedir<{ ordenes: OrdenLista[] }>(
          `/datos/ordenes?estado=abiertas&q=${encodeURIComponent(texto)}`,
        );
        if (r.ordenes.length === 1) return abrirOrden(r.ordenes[0]!.id);
        setCandidatas(r.ordenes);
      } catch (e) {
        if (!(e instanceof ErrorApi && e.sinConexion)) return setError(textoError(d, e));
        // Sin conexión: búsqueda en la copia local de órdenes abiertas.
        const datos = await datosSinConexion();
        const halladas = buscarOrdenLocal(datos, texto, codigo);
        if (halladas.length === 1) return abrirOrden(halladas[0]!.orden.id);
        setCandidatas(
          halladas.map(({ orden: o }) => ({
            id: o.id,
            numero: o.numero,
            estado: o.estado,
            dia: 0,
            atrasada: false,
            totalCents: o.total_cents,
            saldoCents: Math.max(0, o.total_cents - o.pagado_cents),
            piezas: 0,
            listas: 0,
            cliente: `${o.cliente_nombre} ${o.cliente_apellido ?? ""}`.trim(),
            telefono: null,
          })),
        );
      }
    },
    [abrirOrden, d],
  );

  const noLista = orden ? orden.prendas.some((p) => p.estado !== "lista" && p.estado !== "anulada") : false;
  // Una orden que ya se entregó (o se anuló) no tiene botón: se dice qué pasó y cuándo.
  const cerrada = orden && (["entregada", "anulada", "abandonada"] as const).find((x) => x === orden.estado);
  const ubicaciones = orden ? [...new Set(orden.prendas.map((p) => p.ubicacion).filter(Boolean))] : [];
  // Solo se da por cerrada cuando el servidor lo dijo: si el estado no cargó, decide el servidor al cobrar.
  const cajaCerrada =
    enLinea && metodo === "efectivo" && caja.datos?.abierta === false && (orden?.saldoCents ?? 0) > 0;

  /**
   * El botón de entregar NUNCA se apaga. Con efectivo y la caja cerrada, se
   * abre la caja aquí mismo (si puede) o se explica qué hacer: un botón gris
   * que no responde es «le doy y no pasa nada» (22 sep 2026).
   */
  async function entregar(forzar: boolean, cajaReciénAbierta = false) {
    if (!orden) return;
    if (cajaCerrada && !cajaReciénAbierta) {
      if (caja.datos?.puedeAbrir) {
        setErrorCaja(null);
        setAbriendoCaja(true);
      } else setError(de.pideCaja);
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      const r = await entregarOrden(orden.id, {
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
      setHecha({ numero: orden.numero, enCola: Boolean(r.enCola) });
      setOrden(null);
      setReferencia("");
    } catch (e) {
      if (e instanceof ErrorApi && e.codigo === "turno_cerrado") {
        // La pantalla creía que había caja; el servidor manda. Se ofrece abrirla.
        caja.recargar();
        if (caja.datos?.puedeAbrir !== false) {
          setErrorCaja(null);
          setAbriendoCaja(true);
        } else setError(de.pideCaja);
        return;
      }
      setError(textoError(d, e));
      if (e instanceof ErrorApi && e.codigo === "estado_invalido") setError(de.noLista);
    } finally {
      setOcupado(false);
    }
  }

  async function abrirCajaYSeguir() {
    const cents = aCentavos(fondo || "0");
    if (cents === null) return setErrorCaja(d.errores.monto_invalido);
    setOcupado(true);
    setErrorCaja(null);
    try {
      await pedir("/datos/caja", { cuerpo: { fondoCents: cents } });
    } catch (e) {
      // Si otro la abrió mientras tanto, perfecto: se sigue.
      if (!(e instanceof ErrorApi && e.codigo === "turno_abierto")) {
        setErrorCaja(textoError(d, e));
        setOcupado(false);
        return;
      }
    }
    setAbriendoCaja(false);
    setFondo("");
    caja.setDatos({ abierta: true, puedeAbrir: true });
    caja.recargar();
    setOcupado(false);
    // El cierre de arriba todavía cree que la caja está cerrada: se le dice que ya no.
    await entregar(noLista, true);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <EncabezadoPagina titulo={de.titulo} subtitulo={de.subtitulo} />
      <CampoEscaneo alLeer={buscar} placeholder={de.buscar} ocupado={ocupado} />
      {error && (
        <Aviso tono="error" className="mt-3">
          {error}
        </Aviso>
      )}
      {hecha !== null &&
        (hecha.enCola ? (
          <Aviso tono="alerta" className="mt-3">
            {fmt(de.guardadaEnEquipo, { numero: hecha.numero })}
          </Aviso>
        ) : (
          <Aviso tono="ok" className="mt-3" titulo={fmt(de.entregada, { numero: hecha.numero })} />
        ))}
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
          {cerrada && (
            <Aviso tono="info" className="text-[15px]">
              {fmt(de.cerrada[cerrada], {
                fecha: orden.entregadaEn ? formatoFecha(orden.entregadaEn, idioma, zona) : "",
              })}
            </Aviso>
          )}
          {!cerrada && orden.saldoCents > 0 && (
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
          {!cerrada && noLista && <Aviso tono="alerta">{de.noLista}</Aviso>}
          {!cerrada && (
            <Boton
              ancho
              tamano="grande"
              variante="exito"
              cargando={ocupado}
              onClick={() => entregar(noLista)}
            >
              {noLista
                ? de.entregarIgual
                : orden.saldoCents > 0
                  ? fmt(de.cobrarYEntregar, { monto: dinero(orden.saldoCents) })
                  : de.entregar}
            </Boton>
          )}
        </section>
      )}
      <Modal
        abierto={abriendoCaja}
        alCerrar={() => setAbriendoCaja(false)}
        titulo={de.cajaCerradaTitulo}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setAbriendoCaja(false)}>
              {d.comun.cancelar}
            </Boton>
            <Boton variante="exito" cargando={ocupado} onClick={abrirCajaYSeguir}>
              {de.abrirYSeguir}
            </Boton>
          </>
        }
      >
        <p className="mb-4 text-[15px] text-gris">{de.cajaCerradaTexto}</p>
        {errorCaja && (
          <Aviso tono="error" className="mb-3">
            {errorCaja}
          </Aviso>
        )}
        <CampoDinero
          etiqueta={d.caja.fondo}
          moneda={moneda}
          valor={fondo}
          alCambiar={setFondo}
          grande
          placeholder="0.00"
          autoFocus
        />
      </Modal>
    </div>
  );
}
