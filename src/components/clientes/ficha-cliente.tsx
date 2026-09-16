"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EtiquetaEstado } from "@/components/ordenes/etiqueta-estado";
import { Aviso } from "@/components/ui/aviso";
import { BotonEnlace, Boton } from "@/components/ui/boton";
import { EncabezadoPagina, Tarjeta } from "@/components/ui/encabezado";
import { MenuTresPuntos } from "@/components/ui/menu-tres-puntos";
import { pedir } from "@/lib/api";
import { textoError } from "@/lib/errores-cliente";
import { fmt, formatoDinero, formatoFecha } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";
import { formatoTelefono } from "./lista-clientes";
import { ModalCliente, type DatosFormCliente } from "./modal-cliente";

interface Ficha {
  id: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  correo: string | null;
  idioma: "es" | "en";
  preferencias: DatosFormCliente["preferencias"];
  notas: string | null;
  aceptaSms: boolean;
  aceptaSmsEn: number | null;
  aceptaCorreo: boolean;
  aceptaCorreoEn: number | null;
  smsBajaEn: number | null;
  creadoEn: number;
  saldoCents: number;
  totalGastadoCents: number;
  ordenes: {
    id: string;
    numero: number;
    estado: string;
    totalCents: number;
    pagadoCents: number;
    piezas: number;
    creadaEn: number;
    fechaPromesa: number;
  }[];
}

export function FichaCliente(p: {
  id: string;
  moneda: string;
  zona: string;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeCrearOrden: boolean;
}) {
  const { d, idioma } = useIdioma();
  const dc = d.clientes;
  const router = useRouter();
  const { datos, error, recargar } = useDatos<{ cliente: Ficha }>(`/datos/clientes/${p.id}`);
  const [editando, setEditando] = useState<DatosFormCliente | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  if (!datos)
    return error ? (
      <Aviso tono="error">{textoError(d, error)}</Aviso>
    ) : (
      <p className="text-gris">{d.comun.cargando}</p>
    );
  const c = datos.cliente;
  const dinero = (n: number) => formatoDinero(n, p.moneda, idioma);
  const fecha = (n: number) => formatoFecha(n, idioma, p.zona, { dateStyle: "medium" });
  const prefs = [
    c.preferencias.almidon ? `${dc.almidon}: ${dc.almidones[c.preferencias.almidon]}` : null,
    c.preferencias.entrega ? `${dc.entrega}: ${dc.entregas[c.preferencias.entrega]}` : null,
    c.preferencias.sinBolsa ? dc.sinBolsa : null,
  ].filter(Boolean);

  async function eliminar() {
    try {
      await pedir(`/datos/clientes/${c.id}`, { metodo: "DELETE" });
      router.push("/app/clientes");
    } catch (e) {
      setErrorAccion(textoError(d, e));
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <EncabezadoPagina
        volver={{ href: "/app/clientes", texto: dc.volver }}
        titulo={`${c.nombre} ${c.apellido ?? ""}`}
        subtitulo={fmt(dc.clienteDesde, { fecha: fecha(c.creadoEn) })}
        acciones={
          <>
            {p.puedeCrearOrden && (
              <BotonEnlace href={`/app/mostrador?cliente=${c.id}`}>+ {d.app.nav.mostrador}</BotonEnlace>
            )}
            {p.puedeEditar && (
              <Boton
                variante="secundario"
                onClick={() =>
                  setEditando({
                    id: c.id,
                    nombre: c.nombre,
                    apellido: c.apellido ?? "",
                    telefono: c.telefono ?? "",
                    correo: c.correo ?? "",
                    idioma: c.idioma,
                    preferencias: c.preferencias,
                    notas: c.notas ?? "",
                    aceptaSms: c.aceptaSms,
                    aceptaCorreo: c.aceptaCorreo,
                  })
                }
              >
                {d.comun.editar}
              </Boton>
            )}
            {p.puedeEliminar && (
              <MenuTresPuntos
                opciones={[
                  {
                    texto: dc.eliminar,
                    alElegir: eliminar,
                    destructiva: {
                      titulo: fmt(dc.confirmarEliminar, { nombre: c.nombre }),
                      mensaje: dc.confirmarEliminarTexto,
                      confirmar: dc.eliminar,
                    },
                  },
                ]}
              />
            )}
          </>
        }
      />
      {errorAccion && (
        <Aviso tono="error" className="mb-4">
          {errorAccion}
        </Aviso>
      )}
      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
        <Tarjeta className="space-y-4">
          <Dato etiqueta={dc.telefono} valor={formatoTelefono(c.telefono) || "—"} />
          <Dato etiqueta={dc.correo} valor={c.correo ?? "—"} />
          <Dato etiqueta={dc.idioma} valor={c.idioma === "en" ? "English" : "Español"} />
          <div className="rounded-2xl bg-papel p-3 text-[13px]">
            <p className={c.aceptaSms ? "font-semibold text-ok" : "text-gris"}>
              SMS:{" "}
              {c.aceptaSms && c.aceptaSmsEn
                ? fmt(dc.consentidoEl, { fecha: fecha(c.aceptaSmsEn) })
                : d.comun.no}
            </p>
            {c.smsBajaEn && <p className="text-alerta">{fmt(dc.bajaSms, { fecha: fecha(c.smsBajaEn) })}</p>}
            <p className={c.aceptaCorreo ? "font-semibold text-ok" : "text-gris"}>
              {dc.correo}:{" "}
              {c.aceptaCorreo && c.aceptaCorreoEn
                ? fmt(dc.consentidoEl, { fecha: fecha(c.aceptaCorreoEn) })
                : d.comun.no}
            </p>
          </div>
          {prefs.length > 0 && <Dato etiqueta={dc.preferencias} valor={prefs.join(" · ")} />}
          {c.notas && <Dato etiqueta={dc.notas} valor={c.notas} />}
          <div className="grid grid-cols-2 gap-3 border-t border-percha/70 pt-4">
            <Dato etiqueta={dc.totalGastado} valor={dinero(c.totalGastadoCents)} />
            <Dato
              etiqueta={dc.saldoTitulo}
              valor={c.saldoCents > 0 ? dinero(c.saldoCents) : dc.alDia}
              peligro={c.saldoCents > 0}
            />
          </div>
        </Tarjeta>
        <Tarjeta className="p-0 md:p-0">
          <h2 className="px-5 pt-5 pb-2 text-[17px] font-bold">{dc.historial}</h2>
          {c.ordenes.length === 0 ? (
            <p className="px-5 pb-5 text-gris">{dc.sinOrdenes}</p>
          ) : (
            <ul className="divide-y divide-percha/60">
              {c.ordenes.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/app/ordenes/${o.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-papel"
                  >
                    <span className="numero-ticket w-16 text-2xl">#{o.numero}</span>
                    <span className="min-w-0 flex-1">
                      <EtiquetaEstado estado={o.estado} />
                      <span className="mt-0.5 block text-[13px] text-gris">
                        {fecha(o.creadaEn)} · {fmt(dc.piezas, { n: o.piezas })}
                      </span>
                    </span>
                    <span className="cifra text-right text-[15px] font-semibold">{dinero(o.totalCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
      <ModalCliente
        abierto={Boolean(editando)}
        inicial={editando}
        alCerrar={() => setEditando(null)}
        alGuardar={() => {
          setEditando(null);
          recargar();
        }}
      />
    </div>
  );
}

function Dato({ etiqueta, valor, peligro = false }: { etiqueta: string; valor: string; peligro?: boolean }) {
  return (
    <div>
      <p className="text-[12px] font-semibold tracking-wide text-gris uppercase">{etiqueta}</p>
      <p className={`mt-0.5 text-[15px] break-words ${peligro ? "font-bold text-peligro" : ""}`}>{valor}</p>
    </div>
  );
}
