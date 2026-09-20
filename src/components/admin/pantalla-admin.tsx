"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { EncabezadoPagina, Tarjeta, TituloSeccion } from "@/components/ui/encabezado";
import { MenuTresPuntos } from "@/components/ui/menu-tres-puntos";
import { pedir } from "@/lib/api";
import { textoError } from "@/lib/errores-cliente";
import { fmt, formatoDinero, formatoFecha } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";

interface Resumen {
  cuentas: {
    total: number;
    enPrueba: number;
    pagando: number;
    vencidas: number;
    suspendidas: number;
    nuevas7: number;
    nuevas30: number;
  };
  demos: { vivos: number; hoy: number };
  uso: { usuarios: number; ordenes30: number; ordenesTotal: number; tintoreriasActivas7: number };
  dinero: { registrado30Cents: number; registradoTotalCents: number; porCobrarCents: number };
  soporte: { ticketsAbiertos: number };
  porDia: { fecha: string; cuentas: number }[];
}

interface Tintoreria {
  id: string;
  nombre: string;
  correo: string | null;
  pais: string;
  moneda: string;
  plan: string;
  estado: string;
  pruebaHasta: number | null;
  pruebaVencida: boolean;
  creadaEn: number;
  usuarios: number;
  ordenes: number;
  cobradoCents: number;
  ultimaOrdenEn: number | null;
}

function Cifra({ etiqueta, valor, tono = "" }: { etiqueta: string; valor: string; tono?: string }) {
  return (
    <div className="rounded-2xl bg-superficie p-4 ring-1 ring-percha/80">
      <p className="text-[13px] text-gris">{etiqueta}</p>
      <p className={`numero-ticket text-2xl leading-tight ${tono}`}>{valor}</p>
    </div>
  );
}

export function PantallaAdmin() {
  const { d, idioma } = useIdioma();
  const da = d.admin;
  const [q, setQ] = useState("");
  const resumen = useDatos<Resumen>("/datos/admin/resumen");
  const lista = useDatos<{ tintorerias: Tintoreria[] }>(
    `/datos/admin/tintorerias${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`,
  );
  const [error, setError] = useState<unknown>(null);
  const dinero = (n: number) => formatoDinero(n, "USD", idioma);
  const fecha = (ms: number) =>
    formatoFecha(ms, idioma, "UTC", { year: "numeric", month: "short", day: "numeric" });
  const maximo = Math.max(1, ...(resumen.datos?.porDia ?? []).map((x) => x.cuentas));

  const cambiar = async (t: Tintoreria, cuerpo: Record<string, unknown>) => {
    setError(null);
    try {
      await pedir(`/datos/admin/tintorerias/${t.id}`, { metodo: "PUT", cuerpo });
      lista.recargar();
      resumen.recargar();
    } catch (e) {
      setError(e);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <EncabezadoPagina
        titulo={da.titulo}
        subtitulo={da.entrada}
        acciones={
          <Link href="/app/admin/tickets" className="text-[15px] font-semibold text-tinta underline">
            {da.nav.tickets}
            {resumen.datos?.soporte.ticketsAbiertos ? ` (${resumen.datos.soporte.ticketsAbiertos})` : ""}
          </Link>
        }
      />
      {error ? <Aviso tono="error">{textoError(d, error)}</Aviso> : null}
      {resumen.error ? (
        <Aviso tono="error">{textoError(d, resumen.error)}</Aviso>
      ) : !resumen.datos ? (
        <p className="text-gris">{d.comun.cargando}</p>
      ) : (
        <div className="space-y-5">
          <section>
            <TituloSeccion>{da.cuentas.titulo}</TituloSeccion>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="col-span-2 rounded-2xl bg-tinta p-4 text-white lg:col-span-1">
                <p className="text-[13px] opacity-80">{da.cuentas.total}</p>
                <p className="numero-ticket text-4xl leading-tight" data-testid="admin-cuentas">
                  {resumen.datos.cuentas.total}
                </p>
                <p className="text-[13px] opacity-80">
                  +{resumen.datos.cuentas.nuevas7} · {da.cuentas.nuevas7.toLowerCase()}
                </p>
              </div>
              <Cifra
                etiqueta={da.cuentas.pagando}
                valor={String(resumen.datos.cuentas.pagando)}
                tono="text-ok"
              />
              <Cifra etiqueta={da.cuentas.enPrueba} valor={String(resumen.datos.cuentas.enPrueba)} />
              <Cifra
                etiqueta={da.cuentas.vencidas}
                valor={String(resumen.datos.cuentas.vencidas)}
                tono={resumen.datos.cuentas.vencidas ? "text-alerta" : ""}
              />
              <Cifra
                etiqueta={da.cuentas.suspendidas}
                valor={String(resumen.datos.cuentas.suspendidas)}
                tono={resumen.datos.cuentas.suspendidas ? "text-peligro" : ""}
              />
              <Cifra etiqueta={da.cuentas.nuevas30} valor={String(resumen.datos.cuentas.nuevas30)} />
              <Cifra etiqueta={da.uso.demos} valor={String(resumen.datos.demos.vivos)} />
              <Cifra
                etiqueta={da.tickets.abiertos}
                valor={String(resumen.datos.soporte.ticketsAbiertos)}
                tono={resumen.datos.soporte.ticketsAbiertos ? "text-alerta" : ""}
              />
            </div>
          </section>

          <section>
            <TituloSeccion>{da.uso.titulo}</TituloSeccion>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Cifra etiqueta={da.uso.usuarios} valor={String(resumen.datos.uso.usuarios)} />
              <Cifra etiqueta={da.uso.activas7} valor={String(resumen.datos.uso.tintoreriasActivas7)} />
              <Cifra etiqueta={da.uso.ordenes30} valor={String(resumen.datos.uso.ordenes30)} />
              <Cifra etiqueta={da.uso.ordenesTotal} valor={String(resumen.datos.uso.ordenesTotal)} />
            </div>
          </section>

          <section>
            <TituloSeccion>{da.dinero.titulo}</TituloSeccion>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Cifra etiqueta={da.dinero.mes} valor={dinero(resumen.datos.dinero.registrado30Cents)} />
              <Cifra etiqueta={da.dinero.total} valor={dinero(resumen.datos.dinero.registradoTotalCents)} />
              <Cifra etiqueta={da.dinero.porCobrar} valor={dinero(resumen.datos.dinero.porCobrarCents)} />
            </div>
            <p className="mt-2 text-[13px] text-gris">{da.dinero.nota}</p>
          </section>

          {resumen.datos.porDia.length > 0 && (
            <Tarjeta>
              <TituloSeccion>{da.porDia}</TituloSeccion>
              <ul className="flex items-end gap-1" style={{ height: 90 }}>
                {resumen.datos.porDia.map((x) => (
                  <li
                    key={x.fecha}
                    title={`${x.fecha}: ${x.cuentas}`}
                    className="flex-1 rounded-t bg-tinta"
                    style={{ height: `${(x.cuentas / maximo) * 100}%`, minHeight: 3 }}
                  />
                ))}
              </ul>
            </Tarjeta>
          )}

          <Tarjeta>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <TituloSeccion>{da.tintorerias.titulo}</TituloSeccion>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={da.tintorerias.buscar}
                className="h-10 w-full max-w-xs rounded-xl bg-papel px-3 text-[15px] ring-1 ring-percha"
              />
            </div>
            {!lista.datos ? (
              <p className="text-gris">{d.comun.cargando}</p>
            ) : lista.datos.tintorerias.length === 0 ? (
              <p className="py-6 text-center text-gris">{da.tintorerias.vacio}</p>
            ) : (
              <ul className="divide-y divide-percha/60">
                {lista.datos.tintorerias.map((t) => {
                  const plan = da.tintorerias.planes[t.plan as keyof typeof da.tintorerias.planes] ?? t.plan;
                  const vencida = t.pruebaVencida;
                  return (
                    <li key={t.id} className="flex items-start gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {t.nombre}
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-[12px] font-bold ${t.estado === "suspendida" ? "bg-peligro/10 text-peligro" : t.plan === "prueba" ? "bg-papel text-gris" : "bg-ok-suave text-ok"}`}
                          >
                            {t.estado === "suspendida" ? da.tintorerias.estados.suspendida : plan}
                          </span>
                        </p>
                        <p className="truncate text-[13px] text-gris">
                          {[
                            t.correo ?? da.tickets.sinCorreo,
                            t.pais,
                            `${da.tintorerias.creada}: ${fecha(t.creadaEn)}`,
                            vencida
                              ? da.tintorerias.pruebaVencida
                              : t.pruebaHasta
                                ? fmt(da.tintorerias.pruebaHasta, { fecha: fecha(t.pruebaHasta) })
                                : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <p className="text-[13px] text-gris">
                          {da.tintorerias.usuarios}: {t.usuarios} · {da.tintorerias.ordenes}: {t.ordenes} ·{" "}
                          {da.tintorerias.cobrado}: {formatoDinero(t.cobradoCents, t.moneda, idioma)} ·{" "}
                          {da.tintorerias.ultima}:{" "}
                          {t.ultimaOrdenEn ? fecha(t.ultimaOrdenEn) : da.tintorerias.nunca}
                        </p>
                      </div>
                      <MenuTresPuntos
                        etiqueta={t.nombre}
                        opciones={[
                          {
                            texto: da.tintorerias.activarPago,
                            oculta: t.plan === "pagado",
                            alElegir: () => cambiar(t, { plan: "pagado" }),
                          },
                          {
                            texto: da.tintorerias.volverPrueba,
                            oculta: t.plan === "prueba" && !vencida,
                            alElegir: () => cambiar(t, { plan: "prueba", diasPrueba: 14 }),
                          },
                          {
                            texto: da.tintorerias.darCortesia,
                            oculta: t.plan === "cortesia",
                            alElegir: () => cambiar(t, { plan: "cortesia" }),
                          },
                          {
                            texto: da.tintorerias.reactivar,
                            oculta: t.estado !== "suspendida",
                            alElegir: () => cambiar(t, { estado: "activa" }),
                          },
                          {
                            texto: da.tintorerias.suspender,
                            oculta: t.estado === "suspendida",
                            destructiva: {
                              titulo: fmt(da.tintorerias.confirmarSuspender, { nombre: t.nombre }),
                              mensaje: da.tintorerias.confirmarSuspenderTexto,
                              confirmar: da.tintorerias.suspender,
                            },
                            alElegir: () => cambiar(t, { estado: "suspendida" }),
                          },
                        ]}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </Tarjeta>
        </div>
      )}
    </div>
  );
}
