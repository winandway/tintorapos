"use client";

import Link from "next/link";
import { Aviso } from "@/components/ui/aviso";
import { Tarjeta, TituloSeccion } from "@/components/ui/encabezado";
import { textoError } from "@/lib/errores-cliente";
import { fmt, formatoDinero } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";
import { MarcoContabilidad } from "./marco";

interface PorCobrar {
  totalCents: number;
  tramos: { hasta10: number; hasta30: number; hasta60: number; masDe60: number };
  clientes: {
    clienteId: string;
    nombre: string;
    telefono: string | null;
    saldoCents: number;
    ordenes: number;
    diasMasViejo: number;
  }[];
}

export function PantallaCobrar({ moneda }: { moneda: string }) {
  const { d, idioma } = useIdioma();
  const dc = d.contabilidad.cobrar;
  const { datos, error } = useDatos<PorCobrar>("/datos/contabilidad/cobrar");
  const dinero = (n: number) => formatoDinero(n, moneda, idioma);
  const tramos = [
    { clave: "hasta10", texto: dc.hasta10 },
    { clave: "hasta30", texto: dc.hasta30 },
    { clave: "hasta60", texto: dc.hasta60 },
    { clave: "masDe60", texto: dc.masDe60 },
  ] as const;

  return (
    <MarcoContabilidad titulo={dc.titulo} subtitulo={dc.entrada}>
      {error ? (
        <Aviso tono="error">{textoError(d, error)}</Aviso>
      ) : !datos ? (
        <p className="text-gris">{d.comun.cargando}</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-3xl bg-tinta p-5 text-white">
            <p className="text-[14px] opacity-80">{dc.total}</p>
            <p className="numero-ticket text-4xl leading-tight" data-testid="kpi-por-cobrar">
              {dinero(datos.totalCents)}
            </p>
          </div>
          <Tarjeta>
            <TituloSeccion>{dc.tramos}</TituloSeccion>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tramos.map((t) => (
                <div key={t.clave} className="rounded-2xl bg-papel p-3">
                  <p className="text-[13px] text-gris">{t.texto}</p>
                  <p
                    className={`numero-ticket text-xl ${t.clave === "masDe60" && datos.tramos[t.clave] > 0 ? "text-peligro" : ""}`}
                  >
                    {dinero(datos.tramos[t.clave])}
                  </p>
                </div>
              ))}
            </div>
          </Tarjeta>
          <Tarjeta>
            {datos.clientes.length === 0 ? (
              <p className="py-6 text-center text-gris">{dc.vacio}</p>
            ) : (
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="text-left text-[13px] text-gris">
                    <th className="pb-2 font-semibold">{dc.cliente}</th>
                    <th className="pb-2 text-right font-semibold">{dc.ordenes}</th>
                    <th className="pb-2 text-right font-semibold">{dc.dias}</th>
                    <th className="pb-2 text-right font-semibold">{dc.saldo}</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.clientes.map((c) => (
                    <tr key={c.clienteId} className="border-t border-percha/60">
                      <td className="py-2">
                        <Link href={`/app/clientes/${c.clienteId}`} className="font-semibold text-tinta">
                          {c.nombre}
                        </Link>
                        {c.telefono && <span className="block text-[13px] text-gris">{c.telefono}</span>}
                      </td>
                      <td className="py-2 text-right">{c.ordenes}</td>
                      <td className="py-2 text-right">{fmt(dc.nDias, { n: c.diasMasViejo })}</td>
                      <td className="numero-ticket py-2 text-right">{dinero(c.saldoCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Tarjeta>
        </div>
      )}
    </MarcoContabilidad>
  );
}
