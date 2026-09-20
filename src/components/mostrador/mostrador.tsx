"use client";

import Link from "next/link";
import { useMemo, useReducer, useState } from "react";
import { useConAutorizacion } from "@/components/autorizacion";
import { Aviso } from "@/components/ui/aviso";
import { Boton, clasesBoton } from "@/components/ui/boton";
import { CampoTexto } from "@/components/ui/campo";
import { CampoDinero } from "@/components/ui/campo-dinero";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { MenuTresPuntos } from "@/components/ui/menu-tres-puntos";
import { Modal } from "@/components/ui/modal";
import { Ticket } from "@/components/ui/ticket";
import { ErrorApi, subir } from "@/lib/api";
import { codigoPublico, nuevoId } from "@/lib/codigos";
import { aCentavos, vuelto, type ReglasPrecio } from "@/lib/dinero";
import { textoError } from "@/lib/errores-cliente";
import { ahoraMs, diaSemana, fechaLocal, fechaPromesa, instanteLocal } from "@/lib/fechas";
import { fmt, formatoDinero, formatoFecha, textoBilingue } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { redimensionarFoto } from "@/lib/imagen";
import {
  agrupar,
  carritoVacio,
  conteoPorBoton,
  diasEntregaCarrito,
  notasDePieza,
  reducirCarrito,
  totalesCarrito,
  type Grupo,
  type PrendaCarrito,
  type ServicioCarrito,
} from "@/lib/mostrador/carrito";
import { crearOrden, type RespuestaOrden } from "@/lib/operaciones";
import { useDatos } from "@/lib/use-datos";
import { useEnLinea } from "@/lib/sin-conexion/use-en-linea";
import { iconoDePrenda } from "@/lib/mostrador/iconos";
import { EtiquetasLocales, type DatosEtiquetasLocales } from "./etiquetas-locales";
import { IconoPrenda } from "./icono-prenda";
import { BarraMarcas } from "./marcas-prenda";
import { SelectorCliente, type ClienteElegido } from "./selector-cliente";

interface Catalogo {
  prendas: (PrendaCarrito & { activo: boolean; orden: number })[];
  servicios: (ServicioCarrito & { activo: boolean; orden: number })[];
  precios: { servicioId: string; prendaId: string; precioCents: number }[];
}

export interface DatosTienda {
  moneda: string;
  zona: string;
  pais: string;
  diasEntrega: number;
  reglas: ReglasPrecio;
  /** Cómo arranca el cobro: al entregar (lo tradicional) o al recibir la ropa. */
  politicaCobro: "entrega" | "recepcion";
}

type ModoPago = "recoger" | "completo" | "abono";
type Metodo = "efectivo" | "tarjeta_externa" | "otro";

export function Mostrador({
  tienda,
  clienteInicial,
}: {
  tienda: DatosTienda;
  clienteInicial: string | null;
}) {
  const { d, idioma } = useIdioma();
  const dm = d.mostrador;
  const { datos: cat, error: errorCat } = useDatos<Catalogo>("/datos/catalogo", { cache: true });
  const caja = useDatos<{ turno: unknown }>("/datos/caja", { cache: true });
  const [cliente, setCliente] = useState<ClienteElegido | null>(null);
  const [carrito, despachar] = useReducer(reducirCarrito, undefined, carritoVacio);
  const [servicioId, setServicioId] = useState<string>("");
  const [libras, setLibras] = useState("");
  const [pidiendoPrecio, setPidiendoPrecio] = useState<{
    prendaId: string | null;
    servicioId: string;
    grupo?: string;
  } | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [buscaPrenda, setBuscaPrenda] = useState("");
  const [piezaElegida, setPiezaElegida] = useState<string | null>(null);
  const [fotos, setFotos] = useState<Map<string, Blob>>(new Map());
  // La tienda decide en Ajustes si cobra al recibir o al entregar; en cada
  // orden se puede cambiar igual.
  const modoInicial: ModoPago = tienda.politicaCobro === "recepcion" ? "completo" : "recoger";
  const [modoPago, setModoPago] = useState<ModoPago>(modoInicial);
  const [metodo, setMetodo] = useState<Metodo>("efectivo");
  const [abono, setAbono] = useState("");
  const [recibido, setRecibido] = useState("");
  const [referencia, setReferencia] = useState("");
  const [descuentoTexto, setDescuentoTexto] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creada, setCreada] = useState<
    (RespuestaOrden & { dia: number; fotosFallidas: number; local: DatosEtiquetasLocales }) | null
  >(null);
  const [subiendo, setSubiendo] = useState(0);
  const { ejecutar, modal } = useConAutorizacion();

  const servicios = useMemo(() => new Map((cat?.servicios ?? []).map((s) => [s.id, s])), [cat]);
  const prendas = useMemo(() => new Map((cat?.prendas ?? []).map((p) => [p.id, p])), [cat]);
  const precios = useMemo(
    () => new Map((cat?.precios ?? []).map((p) => [`${p.servicioId}|${p.prendaId}`, p.precioCents])),
    [cat],
  );
  const serviciosActivos = (cat?.servicios ?? []).filter((s) => s.activo);
  const servicio = servicios.get(servicioId) ?? serviciosActivos[0];
  const grupos = agrupar(carrito.piezas);
  const totales = totalesCarrito(carrito, servicios, tienda.reglas);
  const conteo = conteoPorBoton(carrito.piezas);
  const prendasVisibles = useMemo(() => {
    const activas = (cat?.prendas ?? []).filter((p) => p.activo);
    const q = buscaPrenda.trim().toLowerCase();
    if (!q) return activas;
    return activas.filter((p) => `${p.nombreEs} ${p.nombreEn ?? ""}`.toLowerCase().includes(q));
  }, [cat, buscaPrenda]);
  /** La prenda que se está marcando: la elegida a mano, o la última que se tocó. */
  const piezaActiva = carrito.piezas.find((p) => p.id === piezaElegida) ?? carrito.piezas.at(-1) ?? null;
  const numeroDePieza = piezaActiva
    ? carrito.piezas.filter(
        (p) =>
          p.servicioId === piezaActiva.servicioId &&
          p.prendaId === piezaActiva.prendaId &&
          carrito.piezas.indexOf(p) <= carrito.piezas.indexOf(piezaActiva),
      ).length
    : 0;
  const dinero = (n: number) => formatoDinero(n, tienda.moneda, idioma);
  const nombre = (x: { nombreEs: string; nombreEn: string | null } | undefined) =>
    x ? textoBilingue(idioma, x.nombreEs, x.nombreEn) : "—";
  const [ahora] = useState(ahoraMs);
  const promesa =
    carrito.fechaPromesa ??
    fechaPromesa(
      ahora,
      tienda.zona,
      diasEntregaCarrito(carrito, servicios, tienda.diasEntrega),
      carrito.urgente,
    );
  const enLinea = useEnLinea();
  // Sin conexión el efectivo se acepta igual: se registra al sincronizar.
  const cajaAbierta = Boolean(caja.datos?.turno) || !enLinea;

  const montoCobro =
    modoPago === "completo" ? totales.totalCents : modoPago === "abono" ? (aCentavos(abono) ?? 0) : 0;
  const recibidoCents = aCentavos(recibido) ?? 0;

  function tocarPrenda(prendaId: string | null, s: ServicioCarrito) {
    const precio = precios.get(`${s.id}|${s.unidad === "libra" ? "" : (prendaId ?? "")}`);
    if (precio === undefined) {
      setPidiendoPrecio({ prendaId, servicioId: s.id });
      return;
    }
    despachar({
      tipo: "agregar",
      prendaId,
      servicioId: s.id,
      precioUnitCents: precio,
      precioManual: false,
      unidad: s.unidad,
    });
    // Las marcas pasan a la prenda recién agregada.
    setPiezaElegida(null);
  }

  function agregarLibras(s: ServicioCarrito) {
    const n = Number(libras.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;
    const precio = precios.get(`${s.id}|`);
    if (precio === undefined) {
      setPidiendoPrecio({ prendaId: null, servicioId: s.id });
      return;
    }
    despachar({
      tipo: "agregar",
      prendaId: null,
      servicioId: s.id,
      precioUnitCents: precio,
      precioManual: false,
      cantidad: n,
      unidad: "libra",
    });
    setLibras("");
  }

  async function tomarFoto(piezaId: string, archivo: File | undefined) {
    if (!archivo) return;
    try {
      const chica = await redimensionarFoto(archivo);
      setFotos((m) => new Map(m).set(piezaId, chica));
    } catch {
      setFotos((m) => new Map(m).set(piezaId, archivo));
    }
  }

  async function confirmar() {
    if (!cliente || !carrito.piezas.length) return;
    setCreando(true);
    setError(null);
    const pago =
      montoCobro > 0
        ? {
            id: nuevoId(),
            metodo,
            montoCents: montoCobro,
            ...(metodo !== "efectivo" && referencia ? { referencia } : {}),
          }
        : null;
    // Sin conexión no se puede pedir el PIN de un gerente: se avisa antes de cobrar.
    const rebaja = carrito.piezas.some((p) => {
      const lista = precios.get(
        `${p.servicioId}|${servicios.get(p.servicioId)?.unidad === "libra" ? "" : (p.prendaId ?? "")}`,
      );
      return p.precioManual && lista !== undefined && p.precioUnitCents < lista;
    });
    if (!navigator.onLine && (totales.requiereAutorizacion || rebaja)) {
      setCreando(false);
      setError(dm.necesitaConexion);
      return;
    }
    const cuerpo = {
      id: nuevoId(),
      codigoPublico: codigoPublico(),
      cliente: cliente.nuevo
        ? { nuevo: { ...cliente.nuevo, id: cliente.id, correo: cliente.nuevo.correo || undefined } }
        : { id: cliente.id },
      prendas: carrito.piezas.map((p) => ({
        id: p.id,
        codigoEtiqueta: p.codigoEtiqueta,
        prendaId: p.prendaId,
        servicioId: p.servicioId,
        cantidad: p.cantidad,
        ...(p.precioManual ? { precioUnitCents: p.precioUnitCents } : {}),
        ...(p.color ? { color: p.color } : {}),
        ...(p.marca ? { marca: p.marca } : {}),
        ...(notasDePieza(p) ? { notas: notasDePieza(p) } : {}),
      })),
      urgente: carrito.urgente,
      ...(carrito.fechaPromesa ? { fechaPromesa: carrito.fechaPromesa } : {}),
      descuento: carrito.descuento,
      ...(carrito.descuento && carrito.descuentoMotivo ? { descuentoMotivo: carrito.descuentoMotivo } : {}),
      ...(carrito.notas ? { notas: carrito.notas } : {}),
      pago,
    };
    try {
      const r = await ejecutar((autorizacion) =>
        crearOrden({ ...cuerpo, ...(autorizacion ? { autorizacion } : {}) }, totales, {
          cliente: `${cliente.nombre} ${cliente.apellido ?? ""}`.trim(),
        }),
      );
      let fallidas = 0;
      const pendientes = r.enCola ? [] : carrito.piezas.filter((p) => fotos.has(p.id));
      if (r.enCola) fallidas = carrito.piezas.filter((p) => fotos.has(p.id)).length;
      setSubiendo(pendientes.length);
      for (const p of pendientes) {
        const f = new FormData();
        f.set("foto", fotos.get(p.id)!);
        f.set("ordenId", r.id);
        f.set("prendaId", p.id);
        f.set("id", nuevoId());
        try {
          await subir("/datos/fotos", f);
        } catch {
          fallidas++;
        }
      }
      setSubiendo(0);
      setCreada({
        ...r,
        dia: diaSemana(ahoraMs(), tienda.zona),
        fotosFallidas: fallidas,
        local: {
          cliente: cliente.nombre,
          promesa,
          urgente: carrito.urgente,
          piezas: carrito.piezas.map((p) => ({
            codigo: p.codigoEtiqueta,
            nombre: nombre(p.prendaId ? prendas.get(p.prendaId) : servicios.get(p.servicioId)),
          })),
        },
      });
    } catch (e) {
      if (!(e instanceof ErrorApi && e.codigo === "cancelado")) setError(textoError(d, e));
    } finally {
      setCreando(false);
    }
  }

  function reiniciar() {
    despachar({ tipo: "vaciar" });
    setCliente(null);
    setFotos(new Map());
    setModoPago(modoInicial);
    setAbono("");
    setRecibido("");
    setReferencia("");
    setDescuentoTexto("");
    setCreada(null);
    caja.recargar();
  }

  if (creada) {
    if (creada.enCola) {
      return (
        <div className="mx-auto flex max-w-lg flex-col items-center py-6 text-center">
          <Ticket
            numero="—"
            dia={creada.dia}
            tamano="grande"
            arriba={d.ordenes.dias[creada.dia]}
            abajo={dinero(creada.totales.totalCents)}
          />
          <h1 className="titulo-ancho mt-6 text-3xl" data-testid="orden-en-cola">
            {dm.guardadaSinConexion}
          </h1>
          <p className="mt-2 text-gris">{dm.guardadaSinConexionTexto}</p>
          {creada.fotosFallidas > 0 && (
            <Aviso tono="alerta" className="mt-4">
              {dm.fotosError}
            </Aviso>
          )}
          <Boton tamano="grande" ancho className="mt-6" onClick={() => window.print()}>
            {dm.imprimirEtiquetas}
          </Boton>
          <Boton tamano="grande" variante="exito" className="mt-3" onClick={reiniciar}>
            + {dm.nuevaOrden}
          </Boton>
          <EtiquetasLocales
            datos={creada.local}
            codigoPublico={creada.codigoPublico}
            dia={creada.dia}
            zona={tienda.zona}
          />
        </div>
      );
    }
    const url = (tipo: string) => `/app/ordenes/${creada.id}/imprimir?tipo=${tipo}`;
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-6 text-center">
        <Ticket
          numero={creada.numero}
          dia={creada.dia}
          tamano="grande"
          arriba={d.ordenes.dias[creada.dia]}
          abajo={dinero(creada.totales.totalCents)}
        />
        <h1 className="titulo-ancho mt-6 text-3xl" data-testid="orden-creada">
          {dm.exito}
        </h1>
        <p className="mt-2 text-gris">{dm.exitoTexto}</p>
        {creada.fotosFallidas > 0 && (
          <Aviso tono="alerta" className="mt-4">
            {dm.fotosError}
          </Aviso>
        )}
        <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
          <a
            href={url("etiquetas")}
            target="_blank"
            rel="noopener"
            className={clasesBoton("primario", "grande", true)}
          >
            {dm.imprimirEtiquetas}
          </a>
          <a
            href={url("recibo")}
            target="_blank"
            rel="noopener"
            className={clasesBoton("secundario", "grande", true)}
          >
            {dm.imprimirRecibo}
          </a>
          <a
            href={url("interna")}
            target="_blank"
            rel="noopener"
            className={clasesBoton("fantasma", "normal", true)}
          >
            {dm.imprimirInterna}
          </a>
          <Link href={`/app/ordenes/${creada.id}`} className={clasesBoton("fantasma", "normal", true)}>
            {dm.verOrden}
          </Link>
        </div>
        <Boton tamano="grande" variante="exito" className="mt-6" onClick={reiniciar}>
          + {dm.nuevaOrden}
        </Boton>
      </div>
    );
  }

  return (
    <div className="w-full">
      <EncabezadoPagina titulo={dm.titulo} />
      {errorCat ? <Aviso tono="error">{textoError(d, errorCat)}</Aviso> : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-4">
          <section aria-label={dm.pasoCliente}>
            <SelectorCliente
              cliente={cliente}
              alElegir={setCliente}
              moneda={tienda.moneda}
              clienteInicial={clienteInicial}
            />
          </section>

          <section
            aria-label={dm.pasoPrendas}
            className={`rounded-3xl bg-superficie p-4 ring-1 ring-percha/80 ${cliente ? "" : "pointer-events-none opacity-50"}`}
          >
            {!cat ? (
              <p className="text-gris">{d.comun.cargando}</p>
            ) : (
              <>
                <div className="-mx-4 flex flex-wrap items-center gap-2 px-4 pb-3">
                  <div className="-mx-4 w-[calc(100%+2rem)] min-w-0 overflow-x-auto px-4 md:mx-0 md:w-auto md:flex-1 md:px-0 md:pr-3">
                    <div className="flex w-max gap-2" role="tablist">
                      {serviciosActivos.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          role="tab"
                          aria-selected={s.id === servicio?.id}
                          onClick={() => setServicioId(s.id)}
                          className={`rounded-full px-4 py-2 text-[15px] font-semibold ring-1 ${s.id === servicio?.id ? "bg-tinta text-white ring-tinta" : "bg-papel text-noche ring-percha"}`}
                        >
                          {nombre(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="w-full md:w-44 md:flex-none">
                    <span className="sr-only">{dm.buscarPrenda}</span>
                    <input
                      type="search"
                      value={buscaPrenda}
                      onChange={(e) => setBuscaPrenda(e.target.value)}
                      placeholder={dm.buscarPrenda}
                      className="w-full rounded-full bg-papel px-4 py-2 text-[15px] ring-1 ring-percha focus:ring-2 focus:ring-tinta focus:outline-none"
                    />
                  </label>
                </div>
                {servicio?.unidad === "libra" ? (
                  <div className="flex flex-wrap items-end gap-3">
                    <CampoTexto
                      className="w-40"
                      etiqueta={dm.libras}
                      inputMode="decimal"
                      value={libras}
                      onChange={(e) => setLibras(e.target.value.replace(/[^\d.,]/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && agregarLibras(servicio)}
                    />
                    <Boton
                      tamano="grande"
                      className="h-11"
                      onClick={() => agregarLibras(servicio)}
                      disabled={!libras}
                    >
                      + {dm.agregarLibras}
                    </Boton>
                    <p className="pb-3 text-[14px] text-gris">
                      {precios.has(`${servicio.id}|`)
                        ? fmt(dm.precioPorLibra, { precio: dinero(precios.get(`${servicio.id}|`)!) })
                        : dm.sinPrecio}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
                    {prendasVisibles.length === 0 && (
                      <p className="col-span-full py-6 text-center text-gris">{dm.sinPrendas}</p>
                    )}
                    {prendasVisibles.map((p) => {
                      const precio = servicio ? precios.get(`${servicio.id}|${p.id}`) : undefined;
                      const n = servicio ? (conteo.get(`${servicio.id}|${p.id}`) ?? 0) : 0;
                      return (
                        <div key={p.id} className="relative">
                          <button
                            type="button"
                            onClick={() => servicio && tocarPrenda(p.id, servicio)}
                            className={`flex w-full flex-col items-center gap-1.5 rounded-2xl px-2 pt-3 pb-2.5 ring-1 transition active:scale-[0.97] ${n ? "bg-tinta-suave ring-2 ring-tinta" : "bg-papel ring-percha hover:ring-tinta"}`}
                          >
                            <IconoPrenda
                              clave={iconoDePrenda(p.nombreEs, p.nombreEn)}
                              className={`size-10 ${n ? "text-tinta" : "text-noche/65"}`}
                            />
                            <span className="line-clamp-2 min-h-8 text-center text-[13.5px] leading-tight font-semibold">
                              {nombre(p)}
                            </span>
                            <span
                              className={`cifra text-[12.5px] ${precio === undefined ? "text-gris-claro" : "text-gris"}`}
                            >
                              {precio === undefined ? dm.sinPrecio : dinero(precio)}
                            </span>
                          </button>
                          {n > 0 && (
                            <>
                              <span className="pointer-events-none absolute -top-2 -left-2 flex size-7 items-center justify-center rounded-full bg-tinta text-[13px] font-bold text-white">
                                {n}
                              </span>
                              <button
                                type="button"
                                aria-label={dm.quitarUna}
                                onClick={() =>
                                  servicio &&
                                  despachar({
                                    tipo: "quitarUltimaDe",
                                    servicioId: servicio.id,
                                    prendaId: p.id,
                                  })
                                }
                                className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-superficie text-lg leading-none font-bold text-tinta ring-1 ring-percha"
                              >
                                −
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>

          {piezaActiva && (
            <div className="sticky bottom-28 z-10 md:bottom-4">
              <BarraMarcas
                pieza={piezaActiva}
                nombrePrenda={nombre(
                  piezaActiva.prendaId
                    ? prendas.get(piezaActiva.prendaId)
                    : servicios.get(piezaActiva.servicioId),
                )}
                numero={numeroDePieza}
                tieneFoto={fotos.has(piezaActiva.id)}
                alMarcar={(marca) => despachar({ tipo: "marcarPieza", id: piezaActiva.id, marca })}
                alColor={(color) =>
                  despachar({ tipo: "editarPieza", id: piezaActiva.id, cambios: { color } })
                }
                alFoto={(archivo) => tomarFoto(piezaActiva.id, archivo)}
              />
            </div>
          )}
        </div>

        <aside
          aria-label={dm.pasoCobro}
          className="min-w-0 space-y-3 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pb-2"
        >
          <div className="rounded-3xl bg-superficie ring-1 ring-percha/80">
            {grupos.length === 0 ? (
              <p className="p-5 text-center text-gris">{cliente ? dm.agregarPrendas : dm.elegirCliente}</p>
            ) : (
              <ul className="divide-y divide-percha/60">
                {grupos.map((g) => (
                  <LineaGrupo
                    key={g.clave}
                    grupo={g}
                    servicio={servicios.get(g.servicioId)}
                    prenda={g.prendaId ? prendas.get(g.prendaId) : undefined}
                    abierto={abierto === g.clave}
                    alAbrir={() => setAbierto(abierto === g.clave ? null : g.clave)}
                    dinero={dinero}
                    fotos={fotos}
                    alMas={() =>
                      despachar({
                        tipo: "agregar",
                        prendaId: g.prendaId,
                        servicioId: g.servicioId,
                        precioUnitCents: g.precioUnitCents,
                        precioManual: g.precioManual,
                        unidad: "pieza",
                      })
                    }
                    alMenos={() => despachar({ tipo: "quitarUna", clave: g.clave })}
                    alQuitar={() => despachar({ tipo: "quitarGrupo", clave: g.clave })}
                    alPrecio={() =>
                      setPidiendoPrecio({ prendaId: g.prendaId, servicioId: g.servicioId, grupo: g.clave })
                    }
                    alEditar={(id, cambios) => despachar({ tipo: "editarPieza", id, cambios })}
                    alFoto={tomarFoto}
                    piezaActivaId={piezaActiva?.id ?? null}
                    alElegirPieza={setPiezaElegida}
                  />
                ))}
              </ul>
            )}
          </div>

          {grupos.length > 0 && (
            <div className="space-y-3 rounded-3xl bg-superficie p-4 ring-1 ring-percha/80">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-3 text-[15px] font-semibold">
                  <input
                    type="checkbox"
                    className="size-6 accent-tinta"
                    checked={carrito.urgente}
                    onChange={(e) => despachar({ tipo: "urgente", valor: e.target.checked })}
                  />
                  {dm.urgente}
                  <span className="text-[13px] font-normal text-gris">
                    {fmt(dm.urgenteTexto, { pct: tienda.reglas.recargoUrgenteBps / 100 })}
                  </span>
                </label>
              </div>
              <label className="block text-[14px]">
                <span className="font-semibold">{dm.entrega}: </span>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl bg-papel px-3 py-2 ring-1 ring-percha"
                  value={`${fechaLocal(promesa, tienda.zona)}T${formatoFecha(promesa, "en", tienda.zona, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}`}
                  onChange={(e) => {
                    const [f, h] = e.target.value.split("T");
                    if (!f || !h) return;
                    const [hh, mm] = h.split(":").map(Number);
                    despachar({
                      tipo: "fechaPromesa",
                      valor: instanteLocal(f, hh ?? 17, mm ?? 0, tienda.zona),
                    });
                  }}
                />
              </label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <CampoDinero
                  etiqueta={dm.descuento}
                  moneda={tienda.moneda}
                  valor={descuentoTexto}
                  alCambiar={(v) => {
                    setDescuentoTexto(v);
                    const c = aCentavos(v);
                    despachar({ tipo: "descuento", valor: c ? { tipo: "monto", cents: c } : null });
                  }}
                  placeholder="0.00"
                />
                {carrito.descuento && (
                  <CampoTexto
                    etiqueta={dm.motivoDescuento}
                    value={carrito.descuentoMotivo}
                    onChange={(e) =>
                      despachar({ tipo: "descuento", valor: carrito.descuento, motivo: e.target.value })
                    }
                  />
                )}
              </div>
              <CampoTexto
                etiqueta={dm.notasOrden}
                value={carrito.notas}
                onChange={(e) => despachar({ tipo: "notas", valor: e.target.value })}
                opcional={d.comun.opcional}
              />
              <dl className="space-y-1 border-t border-percha/70 pt-3 text-[15px]">
                <Fila etiqueta={dm.subtotal} valor={dinero(totales.subtotalCents)} />
                {totales.recargoCents > 0 && (
                  <Fila etiqueta={dm.recargo} valor={dinero(totales.recargoCents)} />
                )}
                {totales.descuentoCents > 0 && (
                  <Fila etiqueta={dm.descuento} valor={`−${dinero(totales.descuentoCents)}`} />
                )}
                {totales.impuestoCents > 0 && (
                  <Fila etiqueta={dm.impuesto} valor={dinero(totales.impuestoCents)} />
                )}
                <div className="flex items-baseline justify-between pt-1">
                  <dt className="text-[17px] font-bold">{dm.total}</dt>
                  <dd className="numero-ticket text-4xl" data-testid="total-orden">
                    {dinero(totales.totalCents)}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {grupos.length > 0 && (
            <div className="space-y-3 rounded-3xl bg-superficie p-4 ring-1 ring-percha/80">
              <p className="text-[15px] font-bold">{dm.cobrarAhora}</p>
              <Opciones
                valor={modoPago}
                alCambiar={(v) => setModoPago(v as ModoPago)}
                opciones={[
                  { valor: "recoger", texto: dm.pagarAlRecoger },
                  { valor: "completo", texto: dm.pagoCompleto },
                  { valor: "abono", texto: dm.abono },
                ]}
              />
              {modoPago !== "recoger" && (
                <>
                  <Opciones
                    valor={metodo}
                    alCambiar={(v) => setMetodo(v as Metodo)}
                    opciones={[
                      { valor: "efectivo", texto: dm.efectivo },
                      { valor: "tarjeta_externa", texto: dm.tarjeta },
                      { valor: "otro", texto: dm.otro },
                    ]}
                  />
                  {modoPago === "abono" && (
                    <CampoDinero
                      etiqueta={dm.montoAbono}
                      moneda={tienda.moneda}
                      valor={abono}
                      alCambiar={setAbono}
                      placeholder="0.00"
                    />
                  )}
                  {metodo === "efectivo" ? (
                    cajaAbierta ? (
                      <div className="grid grid-cols-2 gap-2">
                        <CampoDinero
                          etiqueta={dm.recibido}
                          moneda={tienda.moneda}
                          valor={recibido}
                          alCambiar={setRecibido}
                          placeholder="0.00"
                        />
                        <div className="rounded-xl bg-ok-suave p-3">
                          <p className="text-[12px] text-ok">{dm.vuelto}</p>
                          <p className="numero-ticket text-2xl text-ok">
                            {dinero(vuelto(recibidoCents, montoCobro))}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Aviso tono="alerta">
                        {dm.cajaCerrada}{" "}
                        <Link href="/app/caja" className="font-bold underline">
                          {dm.irCaja}
                        </Link>
                      </Aviso>
                    )
                  ) : (
                    <CampoTexto
                      etiqueta={dm.referencia}
                      placeholder={dm.referenciaPlaceholder}
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                      opcional={d.comun.opcional}
                    />
                  )}
                </>
              )}
              {error && <Aviso tono="error">{error}</Aviso>}
              {subiendo > 0 && (
                <p className="text-[14px] text-gris">{fmt(dm.subiendoFotos, { n: subiendo })}</p>
              )}
              <Boton
                ancho
                tamano="grande"
                variante="exito"
                cargando={creando}
                disabled={
                  !cliente ||
                  (modoPago !== "recoger" && (montoCobro <= 0 || (metodo === "efectivo" && !cajaAbierta)))
                }
                onClick={confirmar}
              >
                {creando ? dm.creando : `${dm.confirmar} · ${dinero(totales.totalCents)}`}
              </Boton>
            </div>
          )}
        </aside>
      </div>

      <ModalPrecio
        pedido={pidiendoPrecio}
        titulo={
          pidiendoPrecio
            ? fmt(dm.escribirPrecio, {
                prenda: pidiendoPrecio.prendaId
                  ? nombre(prendas.get(pidiendoPrecio.prendaId))
                  : nombre(servicios.get(pidiendoPrecio.servicioId)),
              })
            : ""
        }
        moneda={tienda.moneda}
        alCerrar={() => setPidiendoPrecio(null)}
        alAplicar={(cents) => {
          if (!pidiendoPrecio) return;
          const s = servicios.get(pidiendoPrecio.servicioId);
          if (pidiendoPrecio.grupo) {
            despachar({
              tipo: "precioGrupo",
              clave: pidiendoPrecio.grupo,
              precioUnitCents: cents,
              precioManual: true,
            });
          } else if (s) {
            const n = Number(libras.replace(",", "."));
            despachar({
              tipo: "agregar",
              prendaId: pidiendoPrecio.prendaId,
              servicioId: s.id,
              precioUnitCents: cents,
              precioManual: true,
              unidad: s.unidad,
              ...(s.unidad === "libra" ? { cantidad: n > 0 ? n : 1 } : {}),
            });
            if (s.unidad === "libra") setLibras("");
          }
          setPidiendoPrecio(null);
        }}
      />
      {modal}
      {grupos.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-20 border-t border-percha/70 bg-superficie/95 px-4 py-2 backdrop-blur md:hidden">
          <a href="#resumen-mostrador" className="flex items-center justify-between font-bold">
            <span>
              {carrito.piezas.length === 1 ? dm.pieza : fmt(dm.piezas, { n: carrito.piezas.length })}
            </span>
            <span className="numero-ticket text-2xl">{dinero(totales.totalCents)}</span>
          </a>
        </div>
      )}
      <span id="resumen-mostrador" />
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between text-gris">
      <dt>{etiqueta}</dt>
      <dd className="cifra">{valor}</dd>
    </div>
  );
}

function Opciones({
  valor,
  opciones,
  alCambiar,
}: {
  valor: string;
  opciones: { valor: string; texto: string }[];
  alCambiar: (v: string) => void;
}) {
  return (
    <div
      className="grid gap-1 rounded-2xl bg-papel p-1"
      style={{ gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` }}
      role="radiogroup"
    >
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => alCambiar(o.valor)}
          className={`rounded-xl px-2 py-2.5 text-[14px] font-semibold ${valor === o.valor ? "bg-superficie text-tinta shadow ring-1 ring-percha" : "text-gris"}`}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

function LineaGrupo(p: {
  grupo: Grupo;
  servicio: ServicioCarrito | undefined;
  prenda: PrendaCarrito | undefined;
  abierto: boolean;
  alAbrir: () => void;
  dinero: (n: number) => string;
  fotos: Map<string, Blob>;
  alMas: () => void;
  alMenos: () => void;
  alQuitar: () => void;
  alPrecio: () => void;
  alEditar: (id: string, cambios: { color?: string; marca?: string; notas?: string }) => void;
  alFoto: (id: string, archivo: File | undefined) => void;
  piezaActivaId: string | null;
  alElegirPieza: (id: string) => void;
}) {
  const { d, idioma } = useIdioma();
  const dm = d.mostrador;
  const g = p.grupo;
  const libra = p.servicio?.unidad === "libra";
  const marcasDelGrupo = g.piezas
    .map((pieza) => [pieza.color, ...pieza.marcas].filter(Boolean).join(", "))
    .filter(Boolean)
    .join(" · ");
  const nombrePrenda = p.prenda
    ? textoBilingue(idioma, p.prenda.nombreEs, p.prenda.nombreEn)
    : p.servicio
      ? textoBilingue(idioma, p.servicio.nombreEs, p.servicio.nombreEn)
      : "—";
  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={p.alAbrir}
          className="min-w-0 flex-1 text-left"
          aria-expanded={p.abierto}
        >
          <span className="block truncate text-[15px] font-semibold">{nombrePrenda}</span>
          <span className="block truncate text-[13px] text-gris">
            {p.servicio && !libra
              ? `${textoBilingue(idioma, p.servicio.nombreEs, p.servicio.nombreEn)} · `
              : ""}
            {libra ? `${g.cantidadTotal} lb × ` : ""}
            {p.dinero(g.precioUnitCents)}
            {g.precioManual ? " ✎" : ""}
          </span>
          {marcasDelGrupo && (
            <span className="mt-0.5 block truncate text-[12.5px] text-gris">{marcasDelGrupo}</span>
          )}
        </button>
        {!libra && (
          <div className="flex items-center rounded-full bg-papel ring-1 ring-percha">
            <button
              type="button"
              onClick={p.alMenos}
              aria-label={dm.quitarUna}
              className="size-9 rounded-full text-xl font-bold text-tinta"
            >
              −
            </button>
            <span className="cifra w-6 text-center font-bold">{g.piezas.length}</span>
            <button
              type="button"
              onClick={p.alMas}
              aria-label="+"
              className="size-9 rounded-full text-xl font-bold text-tinta"
            >
              +
            </button>
          </div>
        )}
        <span className="cifra w-20 text-right font-bold">{p.dinero(g.totalCents)}</span>
        <MenuTresPuntos
          opciones={[
            { texto: dm.cambiarPrecio, alElegir: p.alPrecio },
            { texto: dm.detalles, alElegir: p.alAbrir },
            { texto: dm.quitar, alElegir: p.alQuitar },
          ]}
        />
      </div>
      {p.abierto && (
        <ul className="mt-3 space-y-3">
          {g.piezas.map((pieza, i) => (
            <li
              key={pieza.id}
              className={`rounded-2xl p-3 ${pieza.id === p.piezaActivaId ? "bg-tinta-suave ring-1 ring-tinta" : "bg-papel"}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[12px] font-bold text-gris">
                  #{i + 1} · {pieza.codigoEtiqueta}
                </p>
                <button
                  type="button"
                  onClick={() => p.alElegirPieza(pieza.id)}
                  className="rounded-full bg-superficie px-3 py-1 text-[12.5px] font-semibold text-tinta ring-1 ring-percha"
                >
                  {dm.marcas}
                </button>
              </div>
              {(pieza.color || pieza.marcas.length > 0) && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {[pieza.color, ...pieza.marcas].filter(Boolean).map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-superficie px-2.5 py-1 text-[12px] font-semibold ring-1 ring-percha"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <CampoTexto
                  etiqueta={dm.color}
                  value={pieza.color}
                  onChange={(e) => p.alEditar(pieza.id, { color: e.target.value })}
                />
                <CampoTexto
                  etiqueta={dm.marca}
                  value={pieza.marca}
                  onChange={(e) => p.alEditar(pieza.id, { marca: e.target.value })}
                />
              </div>
              <CampoTexto
                className="mt-2"
                etiqueta={dm.notasPrenda}
                placeholder={dm.notasPrendaPlaceholder}
                value={pieza.notas}
                onChange={(e) => p.alEditar(pieza.id, { notas: e.target.value })}
              />
              <label
                className={`${clasesBoton(p.fotos.has(pieza.id) ? "exito" : "secundario", "chico")} mt-2 cursor-pointer`}
              >
                {p.fotos.has(pieza.id) ? `✓ ${dm.fotoLista}` : `📷 ${dm.tomarFoto}`}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => p.alFoto(pieza.id, e.target.files?.[0])}
                />
              </label>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function ModalPrecio({
  pedido,
  titulo,
  moneda,
  alCerrar,
  alAplicar,
}: {
  pedido: unknown;
  titulo: string;
  moneda: string;
  alCerrar: () => void;
  alAplicar: (cents: number) => void;
}) {
  const { d } = useIdioma();
  const [valor, setValor] = useState("");
  const cents = aCentavos(valor);
  return (
    <Modal
      abierto={Boolean(pedido)}
      alCerrar={alCerrar}
      titulo={titulo}
      pie={
        <>
          <Boton variante="secundario" onClick={alCerrar}>
            {d.comun.cancelar}
          </Boton>
          <Boton
            disabled={cents === null}
            onClick={() => {
              if (cents === null) return;
              alAplicar(cents);
              setValor("");
            }}
          >
            {d.mostrador.aplicarPrecio}
          </Boton>
        </>
      }
    >
      <CampoDinero
        etiqueta={d.mostrador.precioUnitario}
        moneda={moneda}
        valor={valor}
        alCambiar={setValor}
        grande
        autoFocus
        placeholder="0.00"
      />
    </Modal>
  );
}
