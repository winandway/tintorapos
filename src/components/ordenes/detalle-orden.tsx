"use client";

import Link from "next/link";
import { useState } from "react";
import { useConAutorizacion } from "@/components/autorizacion";
import { Aviso, useAvisar } from "@/components/ui/aviso";
import { Boton, clasesBoton } from "@/components/ui/boton";
import { CampoTexto } from "@/components/ui/campo";
import { CampoDinero } from "@/components/ui/campo-dinero";
import { EncabezadoPagina, Tarjeta } from "@/components/ui/encabezado";
import { MenuTresPuntos } from "@/components/ui/menu-tres-puntos";
import { Modal } from "@/components/ui/modal";
import { Ticket } from "@/components/ui/ticket";
import { ErrorApi, pedir, subir } from "@/lib/api";
import { nuevoId } from "@/lib/codigos";
import { aCentavos } from "@/lib/dinero";
import { textoError } from "@/lib/errores-cliente";
import { fmt, formatoDinero, formatoFecha, textoBilingue } from "@/lib/i18n";
import { imprimirEtiquetasDirecto, imprimirReciboDirecto } from "@/lib/impresion/imprimir";
import { useIdioma } from "@/lib/i18n/cliente";
import { redimensionarFoto } from "@/lib/imagen";
import { registrarPago } from "@/lib/operaciones";
import { useDatos } from "@/lib/use-datos";
import { EtiquetaEstado } from "./etiqueta-estado";

interface Orden {
  id: string;
  numero: number;
  estado: string;
  urgente: boolean;
  fechaPromesa: number;
  atrasada: boolean;
  dia: number;
  notas: string | null;
  subtotalCents: number;
  recargoCents: number;
  descuentoCents: number;
  descuentoMotivo: string | null;
  impuestoCents: number;
  totalCents: number;
  pagadoCents: number;
  saldoCents: number;
  creadaEn: number;
  origen: string;
  creadaPor: string | null;
  anuladaMotivo: string | null;
  cliente: {
    id: string;
    nombre: string;
    apellido: string | null;
    telefono: string | null;
    correo: string | null;
    aceptaCorreo: boolean;
  };
  unidadPeso: "lb" | "kg";
  avisos: {
    tipo: string;
    canal: string;
    destino: string;
    estado: "pendiente" | "enviado" | "fallido" | "omitido";
    error: string | null;
    creadoEn: number;
  }[];
  prendas: {
    id: string;
    prendaEs: string;
    prendaEn: string | null;
    servicioEs: string;
    servicioEn: string | null;
    unidad: string;
    cantidad: number;
    totalCents: number;
    color: string | null;
    marca: string | null;
    notas: string | null;
    codigoEtiqueta: string;
    estado: string;
    ubicacion: string | null;
  }[];
  pagos: {
    id: string;
    metodo: string;
    montoCents: number;
    referencia: string | null;
    usuario: string | null;
    creadoEn: number;
    anuladoEn: number | null;
    anuladoMotivo: string | null;
  }[];
  historial: {
    estadoAnterior: string | null;
    estadoNuevo: string;
    ubicacion: string | null;
    usuario: string | null;
    prendaId: string | null;
    creadoEn: number;
  }[];
  fotos: { id: string; prendaId: string | null }[];
}

type Motivo = { tipo: "anular" } | { tipo: "pago"; pagoId: string; montoCents: number } | null;

export function DetalleOrden({
  id,
  moneda,
  zona,
  permisos,
}: {
  id: string;
  moneda: string;
  zona: string;
  permisos: string[];
}) {
  const { d, idioma } = useIdioma();
  const dor = d.ordenes;
  const avisar = useAvisar();
  const { datos, error, recargar } = useDatos<{ orden: Orden }>(`/datos/ordenes/${id}`, { enVivo: true });
  const { ejecutar, modal } = useConAutorizacion();
  const [cobrando, setCobrando] = useState(false);
  const [motivo, setMotivo] = useState<Motivo>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const puede = (p: string) => permisos.includes(p);

  if (!datos)
    return error ? (
      <Aviso tono="error">{textoError(d, error)}</Aviso>
    ) : (
      <p className="text-gris">{d.comun.cargando}</p>
    );
  const o = datos.orden;
  const dinero = (n: number) => formatoDinero(n, moneda, idioma);
  const fecha = (n: number) => formatoFecha(n, idioma, zona, { dateStyle: "medium", timeStyle: "short" });
  const abierta = ["recibida", "en_proceso", "lista"].includes(o.estado);
  const abrirVentana = (tipo: string): void => {
    window.open(`/app/ordenes/${o.id}/imprimir?tipo=${tipo}`, "_blank", "noopener");
  };
  /**
   * Recibo, copia interna y etiquetas salen directo por la impresora conectada
   * en este equipo, si la hay; si no, o si falla, por la ventana de siempre.
   */
  const imprimir = (tipo: string): void => {
    const directo =
      tipo === "etiquetas"
        ? imprimirEtiquetasDirecto(o.id)
        : tipo === "recibo" || tipo === "interna"
          ? imprimirReciboDirecto(o.id, tipo)
          : null;
    if (!directo) return abrirVentana(tipo);
    const listo =
      tipo === "etiquetas" ? d.impresion.impresoras.etiquetasOk : d.impresion.impresoras.directoOk;
    directo
      .then((salio) => (salio ? avisar(listo) : abrirVentana(tipo)))
      .catch(() => {
        avisar(d.impresion.impresoras.directoFallo);
        abrirVentana(tipo);
      });
  };

  /** El recibo digital, a pedido. Dice si salió o por qué no: nunca se queda callado. */
  async function enviarRecibo() {
    setErrorAccion(null);
    const correo = o.cliente.correo ?? "";
    try {
      const r = await pedir<{ estado: string; error: string | null }>(
        `/datos/ordenes/${o.id}/recibo-correo`,
        { cuerpo: {} },
      );
      if (r.estado === "enviado") avisar(fmt(dor.reciboEnviado, { correo }));
      else
        setErrorAccion(
          r.estado === "omitido"
            ? dor.reciboCorreo.omitido
            : `${fmt(dor.reciboCorreo.fallido, { correo })}${r.error ? ` · ${r.error}` : ""}`,
        );
      recargar();
    } catch (e) {
      setErrorAccion(textoError(d, e));
    }
  }

  async function accion<T>(fn: (autorizacion?: { usuarioId: string; pin: string }) => Promise<T>) {
    setErrorAccion(null);
    try {
      await ejecutar(fn);
      recargar();
      avisar(d.comun.guardado);
    } catch (e) {
      if (!(e instanceof ErrorApi && e.codigo === "cancelado")) setErrorAccion(textoError(d, e));
    }
  }

  async function agregarFoto(archivo: File | undefined) {
    if (!archivo) return;
    let blob: Blob = archivo;
    try {
      blob = await redimensionarFoto(archivo);
    } catch {
      blob = archivo;
    }
    const f = new FormData();
    f.set("foto", blob);
    f.set("ordenId", o.id);
    f.set("id", nuevoId());
    await accion(() => subir("/datos/fotos", f));
  }

  const nombrePieza = (p: Orden["prendas"][number]) => textoBilingue(idioma, p.prendaEs, p.prendaEn);

  return (
    <div className="mx-auto max-w-5xl">
      <EncabezadoPagina
        volver={{ href: "/app/ordenes", texto: dor.volver }}
        titulo={
          <span className="flex items-center gap-3">
            <Ticket numero={o.numero} dia={o.dia} tamano="chico" />
            <span>#{o.numero}</span>
          </span>
        }
        subtitulo={
          <span className="flex flex-wrap items-center gap-2">
            <EtiquetaEstado estado={o.estado} atrasada={o.atrasada} />
            {o.urgente && (
              <span className="rounded-full bg-peligro px-2 py-0.5 text-[11px] font-bold text-white">
                {d.produccion.urgente}
              </span>
            )}
            <span>{fmt(dor.lista, { fecha: fecha(o.fechaPromesa) })}</span>
          </span>
        }
        acciones={
          <>
            {abierta && puede("ordenes.entregar") && (
              <Link href="/app/entrega" className={clasesBoton("exito")}>
                {dor.entregar}
              </Link>
            )}
            <MenuTresPuntos
              etiqueta={dor.imprimir}
              opciones={[
                { texto: `${dor.imprimir}: ${dor.etiquetas}`, alElegir: () => imprimir("etiquetas") },
                {
                  texto: `${dor.imprimir}: ${dor.recibo}`,
                  alElegir: () =>
                    accion(async (autorizacion) => {
                      await pedir(`/datos/ordenes/${o.id}/reimpresion`, {
                        cuerpo: { tipo: "recibo", autorizacion },
                      });
                      imprimir("recibo");
                    }),
                },
                { texto: `${dor.imprimir}: ${dor.interna}`, alElegir: () => imprimir("interna") },
                { texto: dor.enviarRecibo, alElegir: enviarRecibo },
                {
                  texto: dor.abandonar,
                  oculta: o.estado !== "lista" || !puede("ordenes.entregar"),
                  alElegir: () =>
                    accion((autorizacion) =>
                      pedir(`/datos/ordenes/${o.id}/abandonar`, { cuerpo: { autorizacion } }),
                    ),
                  destructiva: {
                    titulo: fmt(dor.confirmarAbandonar, { numero: o.numero }),
                    mensaje: dor.confirmarAbandonarTexto,
                    confirmar: dor.abandonar,
                  },
                },
                {
                  texto: dor.anular,
                  oculta: !abierta || !puede("ordenes.entregar"),
                  alElegir: () => setMotivo({ tipo: "anular" }),
                  destructiva: {
                    titulo: fmt(dor.confirmarAnular, { numero: o.numero }),
                    mensaje: fmt(dor.confirmarAnularTexto, { monto: dinero(o.pagadoCents) }),
                    confirmar: dor.anular,
                  },
                },
              ]}
            />
          </>
        }
      />
      {errorAccion && (
        <Aviso tono="error" className="mb-4">
          {errorAccion}
        </Aviso>
      )}
      {o.anuladaMotivo && (
        <Aviso tono="error" className="mb-4">
          {o.anuladaMotivo}
        </Aviso>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <Tarjeta className="p-0 md:p-0">
            <h2 className="px-5 pt-5 pb-2 text-[17px] font-bold">
              {dor.prendas} <span className="text-gris">({o.prendas.length})</span>
            </h2>
            <ul className="divide-y divide-percha/60">
              {o.prendas.map((p) => (
                <li key={p.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">
                        {p.unidad === "libra" ? `${p.cantidad} ${o.unidadPeso} · ` : ""}
                        {nombrePieza(p)}
                      </span>
                      <span className="block text-[13px] text-gris">
                        {textoBilingue(idioma, p.servicioEs, p.servicioEn)}{" "}
                        <span className="whitespace-nowrap">· {p.codigoEtiqueta}</span>
                        {p.ubicacion ? ` · 📍${p.ubicacion}` : ""}
                      </span>
                      {(p.color || p.marca) && (
                        <span className="block text-[13px] text-gris">
                          {[p.color, p.marca].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      {p.notas && <span className="block text-[13px] text-alerta">⚠ {p.notas}</span>}
                    </span>
                    <EtiquetaEstado estado={p.estado} />
                    {puede("ordenes.ver_montos") && (
                      <span className="cifra w-20 text-right">{dinero(p.totalCents)}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Tarjeta>

          <Tarjeta>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[17px] font-bold">{dor.fotos}</h2>
              {puede("ordenes.crear") && (
                <label className={`${clasesBoton("secundario", "chico")} cursor-pointer`}>
                  📷 {dor.agregarFoto}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => agregarFoto(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {o.fotos.map((f) => (
                <div key={f.id} className="relative">
                  <a href={`/media/fotos/${f.id}`} target="_blank" rel="noopener">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/media/fotos/${f.id}`}
                      alt=""
                      className="aspect-square w-full rounded-xl object-cover ring-1 ring-percha"
                      loading="lazy"
                    />
                  </a>
                  {puede("ordenes.anular") && (
                    <div className="absolute top-1 right-1 rounded-full bg-superficie/90">
                      <MenuTresPuntos
                        opciones={[
                          {
                            texto: dor.borrarFoto,
                            alElegir: () => accion(() => pedir(`/datos/fotos/${f.id}`, { metodo: "DELETE" })),
                            destructiva: {
                              titulo: dor.confirmarBorrarFoto,
                              mensaje: dor.confirmarBorrarFotoTexto,
                              confirmar: dor.borrarFoto,
                            },
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Tarjeta>

          <Tarjeta>
            <h2 className="mb-3 text-[17px] font-bold">{dor.historial}</h2>
            <ol className="space-y-2 border-l-2 border-percha pl-4 text-[14px]">
              {o.historial.map((h, i) => (
                <li key={i}>
                  <span className="font-semibold">
                    {h.estadoAnterior
                      ? fmt(dor.movimiento, {
                          de:
                            d.ordenes.estados[h.estadoAnterior as keyof typeof d.ordenes.estados] ??
                            h.estadoAnterior,
                          a:
                            d.ordenes.estados[h.estadoNuevo as keyof typeof d.ordenes.estados] ??
                            h.estadoNuevo,
                        })
                      : d.ordenes.estados[h.estadoNuevo as keyof typeof d.ordenes.estados]}
                  </span>
                  {h.prendaId && (
                    <span className="text-gris">
                      {" "}
                      · {nombrePieza(o.prendas.find((p) => p.id === h.prendaId) ?? o.prendas[0]!)}
                    </span>
                  )}
                  {h.ubicacion && (
                    <span className="text-gris"> {fmt(dor.enUbicacion, { ubicacion: h.ubicacion })}</span>
                  )}
                  <span className="block text-[12px] text-gris">
                    {fecha(h.creadoEn)} · {h.usuario}
                  </span>
                </li>
              ))}
            </ol>
          </Tarjeta>
        </div>

        <div className="min-w-0 space-y-4">
          <Tarjeta>
            <p className="text-[12px] font-semibold tracking-wide text-gris uppercase">{dor.cliente}</p>
            <Link
              href={`/app/clientes/${o.cliente.id}`}
              className="mt-1 block text-[17px] font-bold text-tinta hover:underline"
            >
              {o.cliente.nombre} {o.cliente.apellido ?? ""}
            </Link>
            <p className="text-[14px] text-gris">{o.cliente.telefono}</p>
            <EstadoRecibo orden={o} textos={dor.reciboCorreo} />
            <p className="mt-3 text-[13px] text-gris">
              {fmt(dor.creadaPor, { nombre: o.creadaPor ?? "—" })} · {fecha(o.creadaEn)}
              {o.origen === "sin_conexion" ? ` · ${dor.sinConexion}` : ""}
            </p>
            {o.notas && (
              <p className="mt-2 rounded-xl bg-papel p-3 text-[14px]">
                <b>{dor.notas}:</b> {o.notas}
              </p>
            )}
          </Tarjeta>

          {puede("ordenes.ver_montos") && (
            <Tarjeta>
              <dl className="space-y-1 text-[15px]">
                <Fila e={d.mostrador.subtotal} v={dinero(o.subtotalCents)} />
                {o.recargoCents > 0 && <Fila e={d.mostrador.recargo} v={dinero(o.recargoCents)} />}
                {o.descuentoCents > 0 && (
                  <Fila e={d.mostrador.descuento} v={`−${dinero(o.descuentoCents)}`} />
                )}
                {o.descuentoMotivo && (
                  <p className="text-[12px] text-gris">
                    {fmt(dor.descuentoMotivo, { motivo: o.descuentoMotivo })}
                  </p>
                )}
                {o.impuestoCents > 0 && <Fila e={d.mostrador.impuesto} v={dinero(o.impuestoCents)} />}
                <div className="flex justify-between border-t border-percha/70 pt-2 text-[17px] font-bold">
                  <dt>{dor.total}</dt>
                  <dd className="cifra">{dinero(o.totalCents)}</dd>
                </div>
                <Fila e={dor.pagado} v={dinero(o.pagadoCents)} />
                <div
                  className={`flex justify-between font-bold ${o.saldoCents > 0 ? "text-peligro" : "text-ok"}`}
                >
                  <dt>{dor.saldo}</dt>
                  <dd className="cifra">{dinero(o.saldoCents)}</dd>
                </div>
              </dl>
              {o.saldoCents > 0 && o.estado !== "anulada" && puede("pagos.cobrar") && (
                <Boton ancho className="mt-4" onClick={() => setCobrando(true)}>
                  {dor.cobrarAbono}
                </Boton>
              )}
              <h3 className="mt-5 mb-2 text-[15px] font-bold">{dor.pagos}</h3>
              {o.pagos.length === 0 ? (
                <p className="text-[14px] text-gris">{dor.sinPagos}</p>
              ) : (
                <ul className="space-y-2">
                  {o.pagos.map((p) => (
                    <li
                      key={p.id}
                      className={`flex items-center gap-2 text-[14px] ${p.anuladoEn ? "opacity-60" : ""}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold">
                          {d.caja.metodos[p.metodo as keyof typeof d.caja.metodos] ?? p.metodo}
                        </span>
                        {p.referencia ? ` · ${p.referencia}` : ""}
                        {p.anuladoEn && <span className="ml-1 font-bold text-peligro">{dor.anulado}</span>}
                        <span className="block text-[12px] text-gris">
                          {fecha(p.creadoEn)} · {p.usuario}
                        </span>
                      </span>
                      <span className={`cifra font-semibold ${p.anuladoEn ? "line-through" : ""}`}>
                        {dinero(p.montoCents)}
                      </span>
                      {!p.anuladoEn && puede("pagos.cobrar") && (
                        <MenuTresPuntos
                          opciones={[
                            {
                              texto: dor.anularPago,
                              alElegir: () =>
                                setMotivo({ tipo: "pago", pagoId: p.id, montoCents: p.montoCents }),
                              destructiva: {
                                titulo: fmt(dor.confirmarAnularPago, { monto: dinero(p.montoCents) }),
                                mensaje: d.pin.autorizacionTexto,
                                confirmar: dor.anularPago,
                              },
                            },
                          ]}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Tarjeta>
          )}
        </div>
      </div>

      <ModalCobro
        abierto={cobrando}
        moneda={moneda}
        saldo={o.saldoCents}
        alCerrar={() => setCobrando(false)}
        alCobrar={async (metodo, monto, referencia) => {
          await registrarPago(o.id, {
            id: nuevoId(),
            metodo,
            montoCents: monto,
            ...(referencia ? { referencia } : {}),
          });
          setCobrando(false);
          recargar();
          avisar(d.comun.guardado);
        }}
      />
      <ModalMotivo
        abierto={Boolean(motivo)}
        alCerrar={() => setMotivo(null)}
        alConfirmar={async (texto) => {
          const m = motivo;
          setMotivo(null);
          if (m?.tipo === "anular")
            await accion((autorizacion) =>
              pedir(`/datos/ordenes/${o.id}/anular`, { cuerpo: { motivo: texto, autorizacion } }),
            );
          if (m?.tipo === "pago")
            await accion((autorizacion) =>
              pedir(`/datos/pagos/${m.pagoId}/anular`, { cuerpo: { motivo: texto, autorizacion } }),
            );
        }}
      />
      {modal}
    </div>
  );
}

function Fila({ e, v }: { e: string; v: string }) {
  return (
    <div className="flex justify-between text-gris">
      <dt>{e}</dt>
      <dd className="cifra">{v}</dd>
    </div>
  );
}

function ModalCobro({
  abierto,
  moneda,
  saldo,
  alCerrar,
  alCobrar,
}: {
  abierto: boolean;
  moneda: string;
  saldo: number;
  alCerrar: () => void;
  alCobrar: (m: "efectivo" | "tarjeta_externa" | "otro", monto: number, referencia: string) => Promise<void>;
}) {
  const { d } = useIdioma();
  const [metodo, setMetodo] = useState<"efectivo" | "tarjeta_externa" | "otro">("efectivo");
  const [monto, setMonto] = useState("");
  const [referencia, setReferencia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const cents = monto ? aCentavos(monto) : saldo;
  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={d.ordenes.cobrarAbono}
      pie={
        <>
          <Boton variante="secundario" onClick={alCerrar}>
            {d.comun.cancelar}
          </Boton>
          <Boton
            cargando={ocupado}
            disabled={!cents}
            onClick={async () => {
              if (!cents) return;
              setOcupado(true);
              setError(null);
              try {
                await alCobrar(metodo, cents, referencia);
                setMonto("");
                setReferencia("");
              } catch (e) {
                setError(textoError(d, e));
              } finally {
                setOcupado(false);
              }
            }}
          >
            {d.ordenes.cobrar}
          </Boton>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Aviso tono="error">{error}</Aviso>}
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-papel p-1" role="radiogroup">
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
        <CampoDinero
          etiqueta={d.caja.monto}
          moneda={moneda}
          valor={monto}
          alCambiar={setMonto}
          placeholder={(saldo / 100).toFixed(2)}
          grande
          autoFocus
        />
        {metodo !== "efectivo" && (
          <CampoTexto
            etiqueta={d.mostrador.referencia}
            placeholder={d.mostrador.referenciaPlaceholder}
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
          />
        )}
      </div>
    </Modal>
  );
}

function ModalMotivo({
  abierto,
  alCerrar,
  alConfirmar,
}: {
  abierto: boolean;
  alCerrar: () => void;
  alConfirmar: (motivo: string) => Promise<void>;
}) {
  const { d } = useIdioma();
  const [texto, setTexto] = useState("");
  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={d.ordenes.motivo}
      pie={
        <>
          <Boton variante="secundario" onClick={alCerrar}>
            {d.comun.cancelar}
          </Boton>
          <Boton
            variante="peligro"
            disabled={texto.trim().length < 3}
            onClick={async () => {
              await alConfirmar(texto.trim());
              setTexto("");
            }}
          >
            {d.comun.confirmar}
          </Boton>
        </>
      }
    >
      <CampoTexto
        etiqueta={d.ordenes.motivo}
        placeholder={d.ordenes.motivoPlaceholder}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoFocus
      />
    </Modal>
  );
}

/** Si al cliente le llegó su recibo digital, y si no, por qué. Siempre a la vista. */
function EstadoRecibo({
  orden,
  textos,
}: {
  orden: Pick<Orden, "avisos" | "cliente">;
  textos: Record<
    "titulo" | "enviado" | "pendiente" | "fallido" | "omitido" | "sinCorreo" | "noEnviado",
    string
  >;
}) {
  const ultimo = orden.avisos.find((a) => a.canal === "correo" && a.tipo === "recibida");
  const tono = !ultimo
    ? "text-gris"
    : ultimo.estado === "enviado"
      ? "text-ok"
      : ultimo.estado === "pendiente"
        ? "text-gris"
        : "text-peligro";
  const texto = !orden.cliente.correo
    ? textos.sinCorreo
    : !ultimo
      ? textos.noEnviado
      : `${fmt(textos[ultimo.estado], { correo: ultimo.destino })}${ultimo.estado === "fallido" && ultimo.error ? ` · ${ultimo.error}` : ""}`;
  return (
    <p className={`mt-2 text-[13px] ${tono}`} data-testid="estado-recibo-correo">
      <b>{textos.titulo}:</b> {texto}
    </p>
  );
}
