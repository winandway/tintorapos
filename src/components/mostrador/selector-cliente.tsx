"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { clienteVacio, ModalCliente, type DatosFormCliente } from "@/components/clientes/modal-cliente";
import { formatoTelefono } from "@/components/clientes/lista-clientes";
import { Boton } from "@/components/ui/boton";
import { pedir } from "@/lib/api";
import { fmt, formatoDinero } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";

export interface ClienteElegido {
  id: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  idioma: "es" | "en";
  ordenesAbiertas: number;
  saldoCents: number;
  preferencias?: DatosFormCliente["preferencias"];
}

export function SelectorCliente({
  cliente,
  alElegir,
  moneda,
  clienteInicial,
}: {
  cliente: ClienteElegido | null;
  alElegir: (c: ClienteElegido | null) => void;
  moneda: string;
  clienteInicial: string | null;
}) {
  const { d, idioma } = useIdioma();
  const dm = d.mostrador;
  const [q, setQ] = useState("");
  const consulta = useDeferredValue(q);
  const [resultados, setResultados] = useState<ClienteElegido[]>([]);
  const [nuevo, setNuevo] = useState<DatosFormCliente | null>(null);

  useEffect(() => {
    if (!clienteInicial) return;
    pedir<{ cliente: ClienteElegido }>(`/datos/clientes/${clienteInicial}`)
      .then((r) => alElegir(r.cliente))
      .catch(() => {});
    // Solo al entrar con ?cliente=
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteInicial]);

  useEffect(() => {
    if (cliente || consulta.trim().length < 2) return;
    let vivo = true;
    pedir<{ clientes: ClienteElegido[] }>(`/datos/clientes?q=${encodeURIComponent(consulta)}`)
      .then((r) => vivo && setResultados(r.clientes.slice(0, 6)))
      .catch(() => vivo && setResultados([]));
    return () => {
      vivo = false;
    };
  }, [consulta, cliente]);

  if (cliente) {
    return (
      <div className="flex items-start gap-3 rounded-3xl bg-superficie p-4 ring-2 ring-tinta">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-tinta text-lg font-bold text-white">
          {cliente.nombre.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-bold">
            {cliente.nombre} {cliente.apellido ?? ""}
          </p>
          <p className="text-[14px] text-gris">{formatoTelefono(cliente.telefono) || "—"}</p>
          {cliente.ordenesAbiertas > 0 && (
            <p className="text-[13px] font-semibold text-tinta">
              {fmt(dm.ordenesAbiertas, { n: cliente.ordenesAbiertas })}
            </p>
          )}
          {cliente.saldoCents > 0 && (
            <p className="text-[13px] font-semibold text-peligro">
              {fmt(dm.debe, { monto: formatoDinero(cliente.saldoCents, moneda, idioma) })}
            </p>
          )}
          {cliente.preferencias && (
            <p className="text-[13px] text-gris">
              {[
                cliente.preferencias.almidon ? d.clientes.almidones[cliente.preferencias.almidon] : null,
                cliente.preferencias.entrega ? d.clientes.entregas[cliente.preferencias.entrega] : null,
                cliente.preferencias.sinBolsa ? d.clientes.sinBolsa : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
        <Boton variante="fantasma" tamano="chico" onClick={() => alElegir(null)}>
          {dm.cambiarCliente}
        </Boton>
      </div>
    );
  }

  const pareceTelefono = /^[\d\s()+.-]{3,}$/.test(q.trim());
  return (
    <div className="rounded-3xl bg-superficie p-4 ring-1 ring-percha/80">
      <div className="flex gap-2">
        <input
          type="search"
          inputMode={pareceTelefono ? "tel" : "search"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={dm.buscarCliente}
          aria-label={dm.buscarCliente}
          autoFocus
          className="h-12 min-w-0 flex-1 rounded-2xl bg-papel px-4 text-[17px] ring-1 ring-percha focus:ring-2 focus:ring-tinta focus:outline-none"
        />
        <Boton
          tamano="grande"
          className="h-12"
          onClick={() =>
            setNuevo(clienteVacio(idioma, pareceTelefono ? { telefono: q.trim() } : { nombre: q.trim() }))
          }
        >
          + <span className="hidden sm:inline">{dm.crearCliente}</span>
        </Boton>
      </div>
      {q.trim().length >= 2 && (
        <ul className="mt-2 divide-y divide-percha/60">
          {resultados.length === 0 ? (
            <li className="px-2 py-3 text-[14px] text-gris">{dm.sinResultados}</li>
          ) : (
            resultados.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => alElegir(c)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-papel"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {c.nombre} {c.apellido ?? ""}
                    </span>
                    <span className="block text-[13px] text-gris">{formatoTelefono(c.telefono)}</span>
                  </span>
                  {c.saldoCents > 0 && (
                    <span className="text-[13px] font-semibold text-peligro">
                      {formatoDinero(c.saldoCents, moneda, idioma)}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      <ModalCliente
        abierto={Boolean(nuevo)}
        inicial={nuevo}
        alCerrar={() => setNuevo(null)}
        alGuardar={async (id) => {
          setNuevo(null);
          try {
            const r = await pedir<{ cliente: ClienteElegido }>(`/datos/clientes/${id}`);
            alElegir(r.cliente);
          } catch {
            alElegir(null);
          }
        }}
      />
    </div>
  );
}
