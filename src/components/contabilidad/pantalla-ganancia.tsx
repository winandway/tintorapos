"use client";

import Link from "next/link";
import { Aviso } from "@/components/ui/aviso";
import { clasesBoton } from "@/components/ui/boton";
import { Tarjeta, TituloSeccion } from "@/components/ui/encabezado";
import { textoError } from "@/lib/errores-cliente";
import { formatoDinero } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";
import { MarcoContabilidad, useRango } from "./marco";
import { nombreCategoria } from "./categorias-cliente";

interface Ganancia {
  desde: string;
  hasta: string;
  ventasCents: number;
  gastosCents: number;
  utilidadCents: number;
  margenBps: number;
  porGrupo: { grupo: string; cents: number; sobreVentaBps: number }[];
  porCategoria: { categoria: string; grupo: string; cents: number }[];
  porDia: { fecha: string; ventasCents: number; gastosCents: number }[];
  genteBps: number;
  serviciosBps: number;
}

export function PantallaGanancia({ moneda }: { moneda: string }) {
  const { d, idioma } = useIdioma();
  const dc = d.contabilidad;
  const { consulta, control } = useRango();
  const { datos, error } = useDatos<Ganancia>(`/datos/contabilidad/resumen?${consulta}`);
  const dinero = (n: number) => formatoDinero(n, moneda, idioma);
  const pct = (b: number) => `${(b / 100).toFixed(1)} %`;
  const maximo = Math.max(1, ...(datos?.porDia ?? []).map((x) => Math.max(x.ventasCents, x.gastosCents)));

  return (
    <MarcoContabilidad
      titulo={dc.ganancia.titulo}
      subtitulo={dc.ganancia.entrada}
      acciones={
        <a href={`/datos/contabilidad/exportar?${consulta}`} download className={clasesBoton("secundario")}>
          ⤓ {dc.paraElContador}
        </a>
      }
    >
      {control}
      {error ? (
        <Aviso tono="error">{textoError(d, error)}</Aviso>
      ) : !datos ? (
        <p className="text-gris">{d.comun.cargando}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-superficie p-5 ring-1 ring-percha/80">
              <p className="text-[14px] text-gris">{dc.ganancia.ventas}</p>
              <p className="numero-ticket text-3xl leading-tight text-ok">{dinero(datos.ventasCents)}</p>
            </div>
            <div className="rounded-3xl bg-superficie p-5 ring-1 ring-percha/80">
              <p className="text-[14px] text-gris">{dc.ganancia.gastos}</p>
              <p className="numero-ticket text-3xl leading-tight text-peligro">{dinero(datos.gastosCents)}</p>
            </div>
            <div className="rounded-3xl bg-tinta p-5 text-white sm:col-span-2 lg:col-span-1">
              <p className="text-[14px] opacity-80">{dc.ganancia.utilidad}</p>
              <p className="numero-ticket text-4xl leading-tight" data-testid="kpi-utilidad">
                {dinero(datos.utilidadCents)}
              </p>
              <p className="text-[13px] opacity-80">
                {dc.ganancia.margen}: {pct(datos.margenBps)}
              </p>
            </div>
            <div className="rounded-3xl bg-superficie p-5 ring-1 ring-percha/80">
              <p className="text-[14px] text-gris">{dc.ganancia.gente}</p>
              <p className="numero-ticket text-2xl leading-tight">{pct(datos.genteBps)}</p>
              <p className="mt-1 text-[12px] text-gris">{dc.ganancia.sanoGente}</p>
              <p className="mt-3 text-[14px] text-gris">{dc.ganancia.servicios}</p>
              <p className="numero-ticket text-2xl leading-tight">{pct(datos.serviciosBps)}</p>
              <p className="mt-1 text-[12px] text-gris">{dc.ganancia.sanoServicios}</p>
            </div>
          </div>

          {datos.gastosCents === 0 ? (
            <Aviso tono="info">
              {dc.ganancia.sinGastos}{" "}
              <Link href="/app/contabilidad/gastos" className="font-bold underline">
                {dc.ganancia.registrarPrimero}
              </Link>
            </Aviso>
          ) : (
            <Tarjeta>
              <TituloSeccion>{dc.ganancia.porGrupo}</TituloSeccion>
              <ul className="space-y-2.5">
                {datos.porGrupo.map((g) => (
                  <li key={g.grupo}>
                    <div className="flex items-baseline justify-between gap-3 text-[15px]">
                      <span className="font-semibold">
                        {dc.grupos[g.grupo as keyof typeof dc.grupos] ?? g.grupo}
                      </span>
                      <span className="numero-ticket">
                        {dinero(g.cents)}{" "}
                        <span className="text-[13px] text-gris">({pct(g.sobreVentaBps)})</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-papel">
                      <div
                        className="h-2 rounded-full bg-tinta"
                        style={{
                          width: `${Math.min(100, (g.cents / Math.max(1, datos.gastosCents)) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          )}

          {datos.porCategoria.length > 0 && (
            <Tarjeta>
              <TituloSeccion>{dc.ganancia.porCategoria}</TituloSeccion>
              <table className="w-full text-[15px]">
                <tbody>
                  {datos.porCategoria.map((c) => (
                    <tr key={c.categoria} className="border-b border-percha/60 last:border-0">
                      <td className="py-2">{nombreCategoria(c.categoria, idioma)}</td>
                      <td className="numero-ticket py-2 text-right">{dinero(c.cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tarjeta>
          )}

          <Tarjeta>
            <TituloSeccion>{dc.ganancia.porDia}</TituloSeccion>
            <ul className="space-y-1.5">
              {datos.porDia.map((x) => (
                <li key={x.fecha} className="flex items-center gap-2 text-[13px]">
                  <span className="w-16 shrink-0 text-gris">{x.fecha.slice(5)}</span>
                  <span className="flex-1">
                    <span
                      className="block h-2.5 rounded-full bg-ok"
                      style={{ width: `${(x.ventasCents / maximo) * 100}%` }}
                    />
                    <span
                      className="mt-0.5 block h-2.5 rounded-full bg-peligro/70"
                      style={{ width: `${(x.gastosCents / maximo) * 100}%` }}
                    />
                  </span>
                  <span className="numero-ticket w-24 shrink-0 text-right">{dinero(x.ventasCents)}</span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </div>
      )}
    </MarcoContabilidad>
  );
}
