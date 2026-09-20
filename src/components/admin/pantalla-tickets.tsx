"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoArea } from "@/components/ui/campo";
import { EncabezadoPagina, Tarjeta } from "@/components/ui/encabezado";
import { pedir } from "@/lib/api";
import { textoError } from "@/lib/errores-cliente";
import { fmt, formatoFecha } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";

interface Ticket {
  id: string;
  numero: number;
  nombre: string;
  correo: string;
  asunto: string | null;
  idioma: "es" | "en";
  estado: "abierto" | "respondido" | "cerrado";
  tintoreria?: string | null;
  creadoEn: number;
  mensajes?: {
    id: string;
    de: "cliente" | "soporte";
    cuerpo: string;
    autor: string | null;
    enviadoEn: number | null;
    error: string | null;
    creadoEn: number;
  }[];
}

const FILTROS = ["abierto", "respondido", "cerrado", "todos"] as const;

export function PantallaTickets() {
  const { d, idioma } = useIdioma();
  const dt = d.admin.tickets;
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("abierto");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const lista = useDatos<{ tickets: Ticket[] }>(
    `/datos/admin/tickets${filtro === "todos" ? "" : `?estado=${filtro}`}`,
  );
  const detalle = useDatos<{ ticket: Ticket }>(abierto ? `/datos/admin/tickets/${abierto}` : null);
  const cuando = (ms: number) =>
    formatoFecha(ms, idioma, "UTC", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const responder = async () => {
    if (!abierto || respuesta.trim().length < 2) return;
    setEnviando(true);
    setError(null);
    setAviso(null);
    try {
      const r = await pedir<{ enviado: boolean; error: string | null }>(`/datos/admin/tickets/${abierto}`, {
        cuerpo: { mensaje: respuesta.trim() },
      });
      setAviso(r.enviado ? dt.enviada : fmt(dt.noSalio, { error: r.error ?? "?" }));
      setRespuesta("");
      detalle.recargar();
      lista.recargar();
    } catch (e) {
      setError(e);
    } finally {
      setEnviando(false);
    }
  };

  const cambiarEstado = async (id: string, estado: Ticket["estado"]) => {
    await pedir(`/datos/admin/tickets/${id}`, { metodo: "PUT", cuerpo: { estado } });
    detalle.recargar();
    lista.recargar();
  };

  const t = detalle.datos?.ticket;

  return (
    <div className="mx-auto max-w-5xl">
      <EncabezadoPagina
        titulo={dt.titulo}
        subtitulo={dt.entrada}
        volver={{ href: "/app/admin", texto: `← ${d.admin.titulo}` }}
      />
      <div className="mb-4 flex flex-wrap gap-1.5" role="radiogroup">
        {FILTROS.map((f) => (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={filtro === f}
            onClick={() => setFiltro(f)}
            className={`rounded-full px-3.5 py-2 text-[14px] font-semibold ring-1 ${filtro === f ? "bg-tinta text-white ring-tinta" : "bg-superficie ring-percha"}`}
          >
            {dt.filtros[f]}
          </button>
        ))}
      </div>

      {error ? <Aviso tono="error">{textoError(d, error)}</Aviso> : null}
      {aviso && <Aviso tono={aviso === dt.enviada ? "ok" : "alerta"}>{aviso}</Aviso>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
        <Tarjeta>
          {!lista.datos ? (
            <p className="text-gris">{d.comun.cargando}</p>
          ) : lista.datos.tickets.length === 0 ? (
            <p className="py-6 text-center text-gris">{dt.vacio}</p>
          ) : (
            <ul className="divide-y divide-percha/60">
              {lista.datos.tickets.map((x) => (
                <li key={x.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setAbierto(x.id);
                      setAviso(null);
                      setRespuesta("");
                    }}
                    className={`w-full py-3 text-left ${abierto === x.id ? "font-bold" : ""}`}
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="numero-ticket text-[13px] text-gris">#{x.numero}</span>
                      <span className="truncate font-semibold">{x.asunto || x.nombre}</span>
                    </span>
                    <span className="block truncate text-[13px] text-gris">
                      {x.nombre} · {cuando(x.creadoEn)} · {dt.estados[x.estado]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta>
          {!t ? (
            <p className="py-6 text-center text-gris">{abierto ? d.comun.cargando : dt.vacio}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-[18px] font-bold">
                  #{t.numero} · {t.asunto || t.nombre}
                </h2>
                <p className="text-[14px] text-gris">
                  {dt.de}: {t.nombre} &lt;
                  <a href={`mailto:${t.correo}`} className="text-tinta underline">
                    {t.correo}
                  </a>
                  &gt; · {cuando(t.creadoEn)} · {t.idioma.toUpperCase()}
                  {t.tintoreria ? ` · ${t.tintoreria}` : ""}
                </p>
              </div>
              <ul className="space-y-3">
                {(t.mensajes ?? []).map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-2xl p-3 text-[15px] whitespace-pre-wrap ${m.de === "soporte" ? "bg-tinta-suave" : "bg-papel"}`}
                  >
                    <p className="mb-1 text-[12px] font-bold tracking-wide text-gris uppercase">
                      {m.de === "soporte" ? `${dt.soporte} · ${m.autor ?? ""}` : m.autor}
                      {" · "}
                      {cuando(m.creadoEn)}
                      {m.de === "soporte" && !m.enviadoEn ? ` · ⚠ ${m.error ?? ""}` : ""}
                    </p>
                    {m.cuerpo}
                  </li>
                ))}
              </ul>
              <CampoArea
                etiqueta={dt.respuesta}
                rows={4}
                placeholder={dt.respuestaPlaceholder}
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Boton onClick={responder} cargando={enviando} disabled={respuesta.trim().length < 2}>
                  {dt.enviar}
                </Boton>
                {t.estado !== "cerrado" ? (
                  <Boton variante="secundario" onClick={() => cambiarEstado(t.id, "cerrado")}>
                    {dt.cerrar}
                  </Boton>
                ) : (
                  <Boton variante="secundario" onClick={() => cambiarEstado(t.id, "abierto")}>
                    {dt.reabrir}
                  </Boton>
                )}
                <Link
                  href={`mailto:${t.correo}`}
                  className="self-center text-[14px] font-semibold text-tinta underline"
                >
                  {t.correo}
                </Link>
              </div>
            </div>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
