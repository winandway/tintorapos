"use client";

import { Aviso } from "@/components/ui/aviso";
import { clasesBoton } from "@/components/ui/boton";
import { Tarjeta, TituloSeccion } from "@/components/ui/encabezado";
import { textoError } from "@/lib/errores-cliente";
import { formatoDinero } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";
import { MarcoContabilidad, useRango } from "./marco";

interface Impuestos {
  desde: string;
  hasta: string;
  gravadaCents: number;
  exentaCents: number;
  impuestoCents: number;
  compradoImpuestoCents: number;
  porMes: { mes: string; gravadaCents: number; exentaCents: number; impuestoCents: number }[];
}

export function PantallaImpuestos({ moneda }: { moneda: string }) {
  const { d, idioma } = useIdioma();
  const di = d.contabilidad.impuestos;
  const { consulta, control } = useRango();
  const { datos, error } = useDatos<Impuestos>(`/datos/contabilidad/impuestos?${consulta}`);
  const dinero = (n: number) => formatoDinero(n, moneda, idioma);

  return (
    <MarcoContabilidad
      titulo={di.titulo}
      subtitulo={di.entrada}
      acciones={
        <a href={`/datos/contabilidad/exportar?${consulta}`} download className={clasesBoton("secundario")}>
          ⤓ {d.contabilidad.paraElContador}
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
              <p className="text-[14px] text-gris">{di.gravada}</p>
              <p className="numero-ticket text-2xl">{dinero(datos.gravadaCents)}</p>
            </div>
            <div className="rounded-3xl bg-superficie p-5 ring-1 ring-percha/80">
              <p className="text-[14px] text-gris">{di.exenta}</p>
              <p className="numero-ticket text-2xl">{dinero(datos.exentaCents)}</p>
            </div>
            <div className="rounded-3xl bg-tinta p-5 text-white">
              <p className="text-[14px] opacity-80">{di.cobrado}</p>
              <p className="numero-ticket text-3xl" data-testid="kpi-impuesto">
                {dinero(datos.impuestoCents)}
              </p>
            </div>
            <div className="rounded-3xl bg-superficie p-5 ring-1 ring-percha/80">
              <p className="text-[14px] text-gris">{di.compras}</p>
              <p className="numero-ticket text-2xl">{dinero(datos.compradoImpuestoCents)}</p>
            </div>
          </div>
          <Tarjeta>
            <TituloSeccion>{di.porMes}</TituloSeccion>
            <table className="w-full text-[15px]">
              <thead>
                <tr className="text-left text-[13px] text-gris">
                  <th className="pb-2 font-semibold">{di.mes}</th>
                  <th className="pb-2 text-right font-semibold">{di.gravada}</th>
                  <th className="pb-2 text-right font-semibold">{di.exenta}</th>
                  <th className="pb-2 text-right font-semibold">{di.cobrado}</th>
                </tr>
              </thead>
              <tbody>
                {datos.porMes.map((m) => (
                  <tr key={m.mes} className="border-t border-percha/60">
                    <td className="py-2">{m.mes}</td>
                    <td className="numero-ticket py-2 text-right">{dinero(m.gravadaCents)}</td>
                    <td className="numero-ticket py-2 text-right">{dinero(m.exentaCents)}</td>
                    <td className="numero-ticket py-2 text-right">{dinero(m.impuestoCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tarjeta>
          <p className="text-[14px] text-gris">{di.nota}</p>
        </div>
      )}
    </MarcoContabilidad>
  );
}
