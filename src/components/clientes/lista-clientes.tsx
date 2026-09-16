"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { useAvisar } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { pedir } from "@/lib/api";
import { textoError } from "@/lib/errores-cliente";
import { fmt, formatoDinero } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";
import { clienteVacio, ModalCliente, type DatosFormCliente } from "./modal-cliente";

interface Resumen {
  id: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  correo: string | null;
  ordenesAbiertas: number;
  saldoCents: number;
  eliminadoEn: number | null;
}

export function formatoTelefono(e164: string | null): string {
  if (!e164) return "";
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

export function ListaClientes({
  moneda,
  puedeEditar,
  puedeEliminar,
}: {
  moneda: string;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}) {
  const { d, idioma } = useIdioma();
  const dc = d.clientes;
  const router = useRouter();
  const avisar = useAvisar();
  const [q, setQ] = useState("");
  const [papelera, setPapelera] = useState(false);
  const [nuevo, setNuevo] = useState<DatosFormCliente | null>(null);
  const consulta = useDeferredValue(q);
  const url = `/datos/clientes?q=${encodeURIComponent(consulta)}${papelera ? "&papelera=1" : ""}`;
  const { datos, error, recargar } = useDatos<{ clientes: Resumen[] }>(url);

  async function restaurar(id: string) {
    try {
      await pedir(`/datos/clientes/${id}/restaurar`, { metodo: "POST" });
      recargar();
      avisar(d.comun.guardado);
    } catch (e) {
      avisar(textoError(d, e), "error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <EncabezadoPagina
        titulo={papelera ? dc.papelera : dc.titulo}
        subtitulo={papelera ? dc.papeleraAyuda : dc.subtitulo}
        acciones={
          <>
            {puedeEliminar && (
              <Boton variante="fantasma" onClick={() => setPapelera((p) => !p)}>
                {papelera ? dc.verActivos : dc.papelera}
              </Boton>
            )}
            {puedeEditar && !papelera && (
              <Boton onClick={() => setNuevo(clienteVacio(idioma))}>+ {dc.nuevo}</Boton>
            )}
          </>
        }
      />
      <label className="relative mb-4 block">
        <span className="sr-only">{dc.buscar}</span>
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gris"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="m14 14 4 4" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={dc.buscarPlaceholder}
          autoFocus
          className="h-13 w-full rounded-2xl bg-superficie pr-4 pl-12 text-[17px] ring-1 ring-percha focus:ring-2 focus:ring-tinta focus:outline-none"
        />
      </label>
      {error ? (
        <p className="text-peligro">{textoError(d, error)}</p>
      ) : !datos ? (
        <p className="text-gris">{d.comun.cargando}</p>
      ) : datos.clientes.length === 0 ? (
        <p className="rounded-3xl bg-superficie p-6 text-center text-gris ring-1 ring-percha/80">
          {q ? dc.vacio : dc.vacioInicial}
        </p>
      ) : (
        <ul className="divide-y divide-percha/60 overflow-hidden rounded-3xl bg-superficie ring-1 ring-percha/80">
          {datos.clientes.map((c) => {
            const contenido = (
              <>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tinta-suave font-bold text-tinta">
                  {c.nombre.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">
                    {c.nombre} {c.apellido ?? ""}
                  </span>
                  <span className="block truncate text-[13px] text-gris">
                    {formatoTelefono(c.telefono) || c.correo || "—"}
                  </span>
                </span>
                <span className="text-right text-[13px]">
                  {c.ordenesAbiertas > 0 && (
                    <span className="block font-semibold text-tinta">
                      {fmt(dc.ordenesAbiertas, { n: c.ordenesAbiertas })}
                    </span>
                  )}
                  {c.saldoCents > 0 && (
                    <span className="block font-semibold text-peligro">
                      {fmt(dc.saldo, { monto: formatoDinero(c.saldoCents, moneda, idioma) })}
                    </span>
                  )}
                </span>
              </>
            );
            return (
              <li key={c.id}>
                {papelera ? (
                  <div className="flex items-center gap-3 px-5 py-3">
                    {contenido}
                    <Boton variante="secundario" tamano="chico" onClick={() => restaurar(c.id)}>
                      {dc.restaurar}
                    </Boton>
                  </div>
                ) : (
                  <Link
                    href={`/app/clientes/${c.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-papel"
                  >
                    {contenido}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <ModalCliente
        abierto={Boolean(nuevo)}
        inicial={nuevo}
        alCerrar={() => setNuevo(null)}
        alGuardar={(id) => router.push(`/app/clientes/${id}`)}
      />
    </div>
  );
}
