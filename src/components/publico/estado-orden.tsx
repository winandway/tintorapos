"use client";

import { useEffect, useState } from "react";
import { Ticket } from "@/components/ui/ticket";
import { diccionario, fmt, formatoFecha, type Idioma } from "@/lib/i18n";
import type { OrdenPublica } from "@/server/publico/orden";

const PASOS = ["recibida", "en_proceso", "lista", "entregada"] as const;
/** Cada cuánto se vuelve a preguntar mientras la página está a la vista. */
export const INTERVALO_PUBLICO_MS = 30_000;

/**
 * Lo que ve el cliente, y se mantiene al día solo: vuelve a preguntar por la
 * orden cada medio minuto mientras la página está a la vista, y al volver a la
 * pestaña o a la app. Antes era una foto fija: la tienda marcaba la ropa como
 * lista y el cliente seguía viendo «recibida» hasta recargar (22 sep 2026).
 */
export function EstadoOrdenEnVivo({
  inicial,
  codigo,
  idioma,
}: {
  inicial: OrdenPublica;
  codigo: string;
  idioma: Idioma;
}) {
  const [orden, setOrden] = useState(inicial);
  const [actualizada, setActualizada] = useState<number | null>(null);

  useEffect(() => {
    let vivo = true;
    let ocupado = false;
    const pedir = async () => {
      if (ocupado || document.visibilityState !== "visible") return;
      ocupado = true;
      try {
        const r = await fetch(`/datos/publico/orden/${encodeURIComponent(codigo)}`, {
          headers: { accept: "application/json" },
          cache: "no-store",
        });
        if (!r.ok) return;
        const { orden: nueva } = (await r.json()) as { orden: OrdenPublica };
        if (vivo && nueva) {
          setOrden(nueva);
          setActualizada(Date.now());
        }
      } catch {
        // Sin internet un rato: se vuelve a intentar en la próxima vuelta.
      } finally {
        ocupado = false;
      }
    };
    const alVolver = () => {
      if (document.visibilityState === "visible") void pedir();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    window.addEventListener("pageshow", alVolver);
    const reloj = setInterval(pedir, INTERVALO_PUBLICO_MS);
    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
      window.removeEventListener("pageshow", alVolver);
      clearInterval(reloj);
    };
  }, [codigo]);

  return <EstadoOrden orden={orden} idioma={idioma} actualizada={actualizada} />;
}

export function EstadoOrden({
  orden,
  idioma,
  actualizada,
}: {
  orden: OrdenPublica;
  idioma: Idioma;
  actualizada: number | null;
}) {
  const d = diccionario(idioma);
  const dp = d.publico;
  const indice = PASOS.indexOf(orden.estado as (typeof PASOS)[number]);
  const texto =
    orden.estado === "lista"
      ? dp.listaTexto
      : orden.estado === "en_proceso"
        ? dp.procesoTexto
        : orden.estado === "entregada"
          ? dp.entregadaTexto
          : orden.estado === "anulada"
            ? dp.anuladaTexto
            : orden.estado === "abandonada"
              ? dp.abandonadaTexto
              : dp.recibidaTexto;
  const tel = orden.tienda.telefono?.replace(/[^\d+]/g, "");
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-superficie p-6 ring-1 ring-percha">
        <p className="text-[15px] font-semibold text-tinta">{orden.tienda.nombre}</p>
        <div className="mt-4 flex items-center gap-4">
          <Ticket numero={orden.numero} dia={orden.dia} arriba={d.ordenes.dias[orden.dia]} />
          <div>
            <p className="text-gris">{fmt(dp.hola, { nombre: orden.primerNombre })}</p>
            <h1 className="titulo-ancho text-2xl leading-tight" data-testid="estado-publico">
              {texto}
            </h1>
          </div>
        </div>
        {indice >= 0 && (
          <ol className="mt-6 space-y-3">
            {PASOS.map((p, i) => (
              <li key={p} className="flex items-center gap-3">
                <span
                  className={`flex size-8 items-center justify-center rounded-full text-[14px] font-bold ${i <= indice ? "bg-tinta text-white" : "bg-papel text-gris ring-1 ring-percha"}`}
                >
                  {i <= indice ? "✓" : i + 1}
                </span>
                <span className={i <= indice ? "font-semibold" : "text-gris"}>{dp.pasos[p]}</span>
              </li>
            ))}
          </ol>
        )}
        <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-papel p-4 text-[14px]">
          <div>
            <dt className="text-gris">{dp.listaPara}</dt>
            <dd className="font-semibold">
              {formatoFecha(
                orden.fechaPromesa,
                idioma,
                orden.tienda.zona,
                { dateStyle: "medium", timeStyle: "short" },
                orden.tienda.pais,
              )}
            </dd>
          </div>
          <div>
            <dt className="text-gris">{fmt(dp.orden, { numero: orden.numero })}</dt>
            <dd className="font-semibold" data-testid="piezas-publico">
              {fmt(dp.piezasListas, { listas: orden.listas, total: orden.piezas })}
            </dd>
          </div>
        </dl>
        {orden.tieneSaldo && orden.estado !== "entregada" && (
          <p className="mt-3 text-[14px] text-alerta">{dp.saldoPendiente}</p>
        )}
        <p className="mt-3 text-[12px] text-gris" data-testid="publico-en-vivo">
          {dp.enVivo}
          {actualizada
            ? ` ${fmt(dp.actualizada, { hora: formatoFecha(actualizada, idioma, orden.tienda.zona, { timeStyle: "short" }, orden.tienda.pais) })}`
            : ""}
        </p>
      </div>
      {(orden.tienda.direccion || tel) && (
        <div className="rounded-3xl bg-superficie p-5 text-[15px] ring-1 ring-percha">
          {orden.tienda.direccion && (
            <p>{[orden.tienda.direccion, orden.tienda.ciudad].filter(Boolean).join(", ")}</p>
          )}
          {tel && (
            <a
              href={`tel:${tel}`}
              className="mt-3 inline-flex h-11 items-center rounded-xl bg-tinta px-4 font-semibold text-white"
            >
              📞 {dp.llamar}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
