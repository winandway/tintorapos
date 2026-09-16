"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton, clasesBoton } from "@/components/ui/boton";
import { EncabezadoPagina, Tarjeta } from "@/components/ui/encabezado";
import { textoError } from "@/lib/errores-cliente";
import { fmt, formatoDinero, formatoFecha, plural, textoBilingue } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";
import { BarrasHorizontales, GraficaBarras } from "./grafica-barras";

interface Ventas {
  desde: string;
  hasta: string;
  cobradoCents: number;
  pagos: number;
  ordenes: number;
  vendidoCents: number;
  ticketPromedioCents: number;
  descuentosCents: number;
  anuladas: number;
  porDia: { fecha: string; cobradoCents: number; ordenes: number }[];
  porMetodo: { metodo: string; cents: number; pagos: number }[];
  porServicio: { servicioEs: string; servicioEn: string | null; cents: number; piezas: number }[];
  porEmpleado: {
    usuarioId: string;
    nombre: string;
    cobradoCents: number;
    pagos: number;
    ordenes: number;
    descuentosCents: number;
    anuladas: number;
  }[];
}
interface Operacion {
  atrasadas: { id: string; numero: number; cliente: string; fechaPromesa: number }[];
  sinRecoger: {
    id: string;
    numero: number;
    cliente: string;
    listaEn: number;
    recordatorios: number;
    saldoCents: number;
  }[];
  paraAbandono: { id: string; numero: number; cliente: string; listaEn: number }[];
}

const PRESETS = ["hoy", "ayer", "7", "30", "mes"] as const;

export function PantallaReportes({ moneda, zona }: { moneda: string; zona: string }) {
  const { d, idioma } = useIdioma();
  const dr = d.reportes;
  const [preset, setPreset] = useState<string>("7");
  const [rango, setRango] = useState<{ desde: string; hasta: string } | null>(null);
  const [borrador, setBorrador] = useState({ desde: "", hasta: "" });
  const [tabla, setTabla] = useState(false);
  const consulta = rango ? `desde=${rango.desde}&hasta=${rango.hasta}` : `preset=${preset}`;
  const { datos, error } = useDatos<Ventas>(`/datos/reportes?${consulta}`);
  const op = useDatos<Operacion>("/datos/reportes/operacion");
  const dinero = (n: number) => formatoDinero(n, moneda, idioma);
  const compacto = (n: number) =>
    new Intl.NumberFormat(`${idioma}-US`, {
      style: "currency",
      currency: moneda,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n / 100);
  const dia = (f: string, largo = false) =>
    formatoFecha(
      `${f}T12:00:00Z`,
      idioma,
      "UTC",
      largo ? { weekday: "short", month: "short", day: "numeric" } : { month: "numeric", day: "numeric" },
    );

  return (
    <div className="mx-auto max-w-6xl">
      <EncabezadoPagina titulo={dr.titulo} />
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="flex flex-wrap gap-1.5" role="radiogroup">
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
              {dr.presets[p]}
            </button>
          ))}
        </div>
        <label className="text-[13px]">
          <span className="block text-gris">{dr.desde}</span>
          <input
            type="date"
            value={borrador.desde}
            onChange={(e) => setBorrador({ ...borrador, desde: e.target.value })}
            className="h-10 rounded-xl bg-superficie px-2 ring-1 ring-percha"
          />
        </label>
        <label className="text-[13px]">
          <span className="block text-gris">{dr.hasta}</span>
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
          {dr.aplicar}
        </Boton>
        <a
          href={`/datos/reportes?${consulta}&formato=csv`}
          download
          className={`${clasesBoton("fantasma")} ml-auto`}
        >
          ⤓ {dr.descargarCsv}
        </a>
      </div>

      {error ? (
        <Aviso tono="error">{textoError(d, error)}</Aviso>
      ) : !datos ? (
        <p className="text-gris">{d.comun.cargando}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="col-span-2 rounded-3xl bg-tinta p-5 text-white lg:col-span-1">
              <p className="text-[14px] opacity-80">{dr.cobrado}</p>
              <p className="numero-ticket text-5xl leading-tight" data-testid="kpi-cobrado">
                {dinero(datos.cobradoCents)}
              </p>
              <p className="text-[13px] opacity-80">{plural(datos.pagos, dr.unPago, dr.nPagos)}</p>
            </div>
            <Kpi etiqueta={dr.vendido} valor={dinero(datos.vendidoCents)} />
            <Kpi
              etiqueta={dr.ordenes}
              valor={String(datos.ordenes - datos.anuladas)}
              detalle={datos.anuladas ? `${datos.anuladas} ${dr.anuladas.toLowerCase()}` : undefined}
            />
            <Kpi
              etiqueta={dr.ticketPromedio}
              valor={dinero(datos.ticketPromedioCents)}
              detalle={
                datos.descuentosCents ? `${dr.descuentos}: ${dinero(datos.descuentosCents)}` : undefined
              }
            />
          </div>

          <Tarjeta>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-bold">{dr.cobradoPorDia}</h2>
              <Boton variante="fantasma" tamano="chico" onClick={() => setTabla((t) => !t)}>
                {tabla ? dr.verGrafica : dr.verTabla}
              </Boton>
            </div>
            {tabla ? (
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="text-left text-gris">
                    <th className="py-1 font-semibold">{dr.fecha}</th>
                    <th className="py-1 text-right font-semibold">{dr.ordenes}</th>
                    <th className="py-1 text-right font-semibold">{dr.cobrado}</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.porDia.map((f) => (
                    <tr key={f.fecha} className="border-t border-percha/60">
                      <td className="py-1.5">{dia(f.fecha, true)}</td>
                      <td className="cifra py-1.5 text-right">{f.ordenes}</td>
                      <td className="cifra py-1.5 text-right">{dinero(f.cobradoCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <GraficaBarras
                titulo={dr.cobradoPorDia}
                datos={datos.porDia.map((f) => ({
                  etiqueta: dia(f.fecha),
                  etiquetaLarga: dia(f.fecha, true),
                  valor: f.cobradoCents,
                }))}
                formato={dinero}
                etiquetaEje={compacto}
              />
            )}
          </Tarjeta>

          <div className="grid gap-4 lg:grid-cols-3">
            <Tarjeta>
              <h2 className="mb-4 text-[17px] font-bold">{dr.porMetodo}</h2>
              {datos.porMetodo.length ? (
                <BarrasHorizontales
                  formato={dinero}
                  filas={datos.porMetodo.map((m) => ({
                    etiqueta: d.caja.metodos[m.metodo as keyof typeof d.caja.metodos] ?? m.metodo,
                    detalle: `${m.pagos}`,
                    valor: m.cents,
                  }))}
                />
              ) : (
                <p className="text-gris">{dr.sinDatos}</p>
              )}
            </Tarjeta>
            <Tarjeta>
              <h2 className="mb-4 text-[17px] font-bold">{dr.porServicio}</h2>
              {datos.porServicio.length ? (
                <BarrasHorizontales
                  formato={dinero}
                  filas={datos.porServicio.map((s) => ({
                    etiqueta: textoBilingue(idioma, s.servicioEs, s.servicioEn),
                    detalle: fmt(dr.piezas, { n: s.piezas }),
                    valor: s.cents,
                  }))}
                />
              ) : (
                <p className="text-gris">{dr.sinDatos}</p>
              )}
            </Tarjeta>
            <Tarjeta>
              <h2 className="mb-4 text-[17px] font-bold">{dr.porEmpleado}</h2>
              {datos.porEmpleado.length ? (
                <table className="w-full text-[14px]">
                  <tbody>
                    {datos.porEmpleado.map((e) => (
                      <tr key={e.usuarioId} className="border-t border-percha/60 first:border-0">
                        <td className="py-2">
                          <span className="font-semibold">{e.nombre}</span>
                          <span className="block text-[12px] text-gris">
                            {plural(e.ordenes, dr.unaOrden, dr.nOrdenes)}
                            {e.descuentosCents ? ` · ${dr.descuentos}: ${dinero(e.descuentosCents)}` : ""}
                            {e.anuladas ? ` · ${e.anuladas} ${dr.anuladas.toLowerCase()}` : ""}
                          </span>
                        </td>
                        <td className="cifra py-2 text-right font-semibold">{dinero(e.cobradoCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gris">{dr.sinDatos}</p>
              )}
            </Tarjeta>
          </div>
        </div>
      )}

      {op.datos && (
        <section className="mt-6">
          <h2 className="titulo-ancho mb-3 text-xl">{dr.operacion}</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <ListaOperacion
              titulo={dr.atrasadas}
              tono="peligro"
              filas={op.datos.atrasadas.map((o) => ({
                id: o.id,
                numero: o.numero,
                cliente: o.cliente,
                detalle: fmt(dr.prometida, {
                  fecha: formatoFecha(o.fechaPromesa, idioma, zona, { dateStyle: "medium" }),
                }),
              }))}
            />
            <ListaOperacion
              titulo={dr.sinRecoger}
              tono="alerta"
              filas={op.datos.sinRecoger.map((o) => ({
                id: o.id,
                numero: o.numero,
                cliente: o.cliente,
                detalle: `${fmt(dr.desdeHace, { fecha: formatoFecha(o.listaEn, idioma, zona, { dateStyle: "medium" }) })} · ${fmt(dr.recordatorios, { n: o.recordatorios })}${o.saldoCents > 0 ? ` · ${dinero(o.saldoCents)}` : ""}`,
              }))}
            />
            <ListaOperacion
              titulo={dr.paraAbandono}
              tono="gris"
              filas={op.datos.paraAbandono.map((o) => ({
                id: o.id,
                numero: o.numero,
                cliente: o.cliente,
                detalle: fmt(dr.desdeHace, {
                  fecha: formatoFecha(o.listaEn, idioma, zona, { dateStyle: "medium" }),
                }),
              }))}
            />
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle?: string }) {
  return (
    <div className="rounded-3xl bg-superficie p-5 ring-1 ring-percha/80">
      <p className="text-[14px] text-gris">{etiqueta}</p>
      <p className="cifra text-2xl font-bold">{valor}</p>
      {detalle && <p className="text-[12px] text-gris">{detalle}</p>}
    </div>
  );
}

function ListaOperacion({
  titulo,
  tono,
  filas,
}: {
  titulo: string;
  tono: "peligro" | "alerta" | "gris";
  filas: { id: string; numero: number; cliente: string; detalle: string }[];
}) {
  const { d } = useIdioma();
  const color = { peligro: "bg-peligro", alerta: "bg-alerta", gris: "bg-gris" }[tono];
  return (
    <Tarjeta className="p-0 md:p-0">
      <h3 className="flex items-center justify-between px-5 pt-5 pb-2 font-bold">
        <span className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${color}`} aria-hidden="true" />
          {titulo}
        </span>
        <span className="rounded-full bg-papel px-2 text-[13px]">{filas.length}</span>
      </h3>
      {filas.length === 0 ? (
        <p className="px-5 pb-5 text-[14px] text-gris">{d.reportes.nada}</p>
      ) : (
        <ul className="max-h-72 divide-y divide-percha/60 overflow-y-auto">
          {filas.map((f) => (
            <li key={f.id}>
              <Link href={`/app/ordenes/${f.id}`} className="block px-5 py-2.5 text-[14px] hover:bg-papel">
                <span className="font-semibold">#{f.numero}</span> · {f.cliente}
                <span className="block text-[12px] text-gris">{f.detalle}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}
