"use client";

import { useState } from "react";
import { useConAutorizacion } from "@/components/autorizacion";
import { Aviso, useAvisar } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoArea, CampoTexto } from "@/components/ui/campo";
import { CampoDinero } from "@/components/ui/campo-dinero";
import { EncabezadoPagina, Tarjeta, TituloSeccion } from "@/components/ui/encabezado";
import { Modal } from "@/components/ui/modal";
import { ErrorApi, pedir } from "@/lib/api";
import { aCentavos } from "@/lib/dinero";
import { camposDe, textoCampo, textoError } from "@/lib/errores-cliente";
import { fmt, formatoDinero, formatoFecha } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";

interface Turno {
  id: string;
  abiertoPorNombre: string | null;
  abiertoEn: number;
  fondoCents: number;
  cerradoEn: number | null;
  contadoCents: number | null;
  esperadoCents: number | null;
  diferenciaCents: number | null;
}

interface Resumen {
  turno: Turno;
  pagosCantidad: number;
  ventasPorMetodo?: Record<"efectivo" | "tarjeta_externa" | "otro", number>;
  entradasCents?: number;
  salidasCents?: number;
  esperadoCents?: number;
  movimientos: {
    id: string;
    tipo: string;
    montoCents: number;
    motivo: string;
    usuario: string | null;
    autorizadoPor: string | null;
    creadoEn: number;
  }[];
}

type TipoMovimiento = "entrada" | "salida" | "sin_venta";

export function PantallaCaja({
  moneda,
  zona,
  verDiferencias,
}: {
  moneda: string;
  zona: string;
  verDiferencias: boolean;
}) {
  const { d, idioma } = useIdioma();
  const dc = d.caja;
  const avisar = useAvisar();
  const { datos, error, recargar } = useDatos<{ turno: Resumen | null }>("/datos/caja");
  const historial = useDatos<{ turnos: Turno[] }>(verDiferencias ? "/datos/caja/turnos" : null);
  const { ejecutar, modal } = useConAutorizacion();
  const [fondo, setFondo] = useState("");
  const [mov, setMov] = useState<TipoMovimiento | null>(null);
  const [cerrando, setCerrando] = useState(false);
  const [resultado, setResultado] = useState<{ diferenciaCents?: number } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const dinero = (n: number) => formatoDinero(n, moneda, idioma);
  const hora = (n: number) => formatoFecha(n, idioma, zona, { timeStyle: "short", dateStyle: "short" });

  async function abrir(e: React.FormEvent) {
    e.preventDefault();
    const cents = aCentavos(fondo || "0");
    if (cents === null) return setErrorForm(d.errores.monto_invalido);
    setOcupado(true);
    setErrorForm(null);
    try {
      await pedir("/datos/caja", { cuerpo: { fondoCents: cents } });
      setResultado(null);
      setFondo("");
      recargar();
    } catch (err) {
      setErrorForm(textoError(d, err));
    } finally {
      setOcupado(false);
    }
  }

  if (!datos)
    return error ? (
      <Aviso tono="error">{textoError(d, error)}</Aviso>
    ) : (
      <p className="text-gris">{d.comun.cargando}</p>
    );
  const r = datos.turno;

  return (
    <div className="mx-auto max-w-4xl">
      <EncabezadoPagina titulo={dc.titulo} />
      {resultado && (
        <Aviso
          tono={resultado.diferenciaCents === undefined || resultado.diferenciaCents === 0 ? "ok" : "alerta"}
          className="mb-4"
          titulo={dc.cerradaOk}
        >
          {resultado.diferenciaCents !== undefined &&
            (resultado.diferenciaCents === 0
              ? dc.cuadra
              : fmt(resultado.diferenciaCents > 0 ? dc.sobra : dc.falta, {
                  monto: dinero(Math.abs(resultado.diferenciaCents)),
                }))}
        </Aviso>
      )}
      {!r ? (
        <Tarjeta className="max-w-lg">
          <TituloSeccion>{dc.cerrada}</TituloSeccion>
          <p className="mb-4 text-[15px] text-gris">{dc.cerradaTexto}</p>
          <form onSubmit={abrir} className="space-y-4">
            {errorForm && <Aviso tono="error">{errorForm}</Aviso>}
            <CampoDinero
              etiqueta={dc.fondo}
              moneda={moneda}
              valor={fondo}
              alCambiar={setFondo}
              grande
              placeholder="0.00"
            />
            <Boton type="submit" ancho tamano="grande" cargando={ocupado}>
              {dc.abrir}
            </Boton>
          </form>
        </Tarjeta>
      ) : (
        <div className="space-y-4">
          <Tarjeta>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-[15px] font-bold text-ok">
                  <span className="size-2.5 rounded-full bg-ok" />
                  {dc.abierta}
                </p>
                <p className="text-[13px] text-gris">
                  {fmt(dc.abiertaPor, {
                    nombre: r.turno.abiertoPorNombre ?? "—",
                    hora: hora(r.turno.abiertoEn),
                  })}
                </p>
              </div>
              <Boton variante="secundario" onClick={() => setCerrando(true)}>
                {dc.cerrar}
              </Boton>
            </div>
            {r.esperadoCents !== undefined && r.ventasPorMetodo && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Cifra etiqueta={dc.fondoInicial} valor={dinero(r.turno.fondoCents)} />
                <Cifra etiqueta={dc.efectivo} valor={dinero(r.ventasPorMetodo.efectivo)} />
                <Cifra etiqueta={dc.tarjeta} valor={dinero(r.ventasPorMetodo.tarjeta_externa)} />
                <Cifra etiqueta={dc.otro} valor={dinero(r.ventasPorMetodo.otro)} />
                <Cifra etiqueta={dc.entradas} valor={dinero(r.entradasCents ?? 0)} />
                <Cifra etiqueta={dc.salidas} valor={dinero(r.salidasCents ?? 0)} />
                <div className="col-span-2 rounded-2xl bg-tinta p-4 text-white sm:col-span-3">
                  <p className="text-[13px] opacity-80">{dc.esperado}</p>
                  <p className="numero-ticket text-4xl">{dinero(r.esperadoCents)}</p>
                </div>
              </div>
            )}
            <p className="mt-4 text-[13px] text-gris">{fmt(dc.pagos, { n: r.pagosCantidad })}</p>
          </Tarjeta>
          <div className="grid grid-cols-3 gap-2">
            <Boton variante="secundario" onClick={() => setMov("entrada")}>
              + {dc.entrada}
            </Boton>
            <Boton variante="secundario" onClick={() => setMov("salida")}>
              − {dc.salida}
            </Boton>
            <Boton variante="secundario" onClick={() => setMov("sin_venta")}>
              {dc.sinVenta}
            </Boton>
          </div>
          <Tarjeta className="p-0 md:p-0">
            <h2 className="px-5 pt-5 pb-2 text-[17px] font-bold">{dc.movimientos}</h2>
            {r.movimientos.length === 0 ? (
              <p className="px-5 pb-5 text-gris">{dc.sinMovimientos}</p>
            ) : (
              <ul className="divide-y divide-percha/60">
                {r.movimientos.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">
                        {m.tipo === "entrada" ? dc.entrada : m.tipo === "salida" ? dc.salida : dc.sinVenta}
                      </span>
                      <span className="block text-[13px] text-gris">
                        {m.motivo} · {m.usuario}
                        {m.autorizadoPor ? ` ✓ ${m.autorizadoPor}` : ""} · {hora(m.creadoEn)}
                      </span>
                    </span>
                    {m.tipo !== "sin_venta" && (
                      <span className={`cifra font-bold ${m.tipo === "salida" ? "text-peligro" : "text-ok"}`}>
                        {m.tipo === "salida" ? "−" : "+"}
                        {dinero(m.montoCents)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>
      )}

      {verDiferencias && historial.datos && historial.datos.turnos.some((x) => x.cerradoEn) && (
        <Tarjeta className="mt-4 p-0 md:p-0">
          <h2 className="px-5 pt-5 pb-2 text-[17px] font-bold">{dc.historial}</h2>
          <ul className="divide-y divide-percha/60">
            {historial.datos.turnos
              .filter((x) => x.cerradoEn)
              .map((x) => (
                <li key={x.id} className="flex items-center gap-3 px-5 py-3 text-[14px]">
                  <span className="flex-1">
                    {hora(x.abiertoEn)} → {hora(x.cerradoEn!)}
                    <span className="block text-[13px] text-gris">{x.abiertoPorNombre}</span>
                  </span>
                  <span className="text-right">
                    <span className="cifra block">{dinero(x.contadoCents ?? 0)}</span>
                    <span
                      className={`cifra block text-[13px] font-bold ${x.diferenciaCents ? (x.diferenciaCents > 0 ? "text-alerta" : "text-peligro") : "text-ok"}`}
                    >
                      {x.diferenciaCents
                        ? fmt(x.diferenciaCents > 0 ? dc.sobra : dc.falta, {
                            monto: dinero(Math.abs(x.diferenciaCents)),
                          })
                        : dc.cuadra}
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        </Tarjeta>
      )}

      <ModalMovimiento
        tipo={mov}
        moneda={moneda}
        alCerrar={() => setMov(null)}
        alGuardar={async (cuerpo) => {
          await ejecutar((autorizacion) =>
            pedir("/datos/caja/movimientos", { cuerpo: { ...cuerpo, autorizacion } }),
          );
          setMov(null);
          recargar();
          avisar(d.comun.guardado);
        }}
      />
      <ModalCierre
        abierto={cerrando}
        moneda={moneda}
        alCerrar={() => setCerrando(false)}
        alCerrarCaja={async (contadoCents, notas) => {
          const res = await pedir<{ diferenciaCents?: number }>("/datos/caja/cerrar", {
            cuerpo: { contadoCents, notas },
          });
          setCerrando(false);
          setResultado(res);
          recargar();
          historial.recargar();
        }}
      />
      {modal}
    </div>
  );
}

function Cifra({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-papel p-3">
      <p className="text-[12px] text-gris">{etiqueta}</p>
      <p className="cifra text-lg font-bold">{valor}</p>
    </div>
  );
}

function ModalMovimiento({
  tipo,
  moneda,
  alCerrar,
  alGuardar,
}: {
  tipo: TipoMovimiento | null;
  moneda: string;
  alCerrar: () => void;
  alGuardar: (c: { tipo: TipoMovimiento; montoCents: number; motivo: string }) => Promise<void>;
}) {
  const { d } = useIdioma();
  const dc = d.caja;
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(false);
  if (!tipo)
    return (
      <Modal abierto={false} alCerrar={alCerrar} titulo="">
        {null}
      </Modal>
    );

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo) return;
    const cents = tipo === "sin_venta" ? 0 : aCentavos(monto);
    if (cents === null) return setCampos({ montoCents: "invalido" });
    setOcupado(true);
    setError(null);
    setCampos({});
    try {
      await alGuardar({ tipo, montoCents: cents, motivo });
      setMonto("");
      setMotivo("");
    } catch (err) {
      if (!(err instanceof ErrorApi && err.codigo === "cancelado")) {
        setError(textoError(d, err));
        setCampos(camposDe(err));
      }
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal
      abierto
      alCerrar={alCerrar}
      titulo={tipo === "entrada" ? dc.entrada : tipo === "salida" ? dc.salida : dc.sinVenta}
      pie={
        <>
          <Boton variante="secundario" onClick={alCerrar}>
            {d.comun.cancelar}
          </Boton>
          <Boton type="submit" form="form-mov" cargando={ocupado}>
            {dc.registrar}
          </Boton>
        </>
      }
    >
      <form id="form-mov" onSubmit={guardar} className="space-y-4">
        {error && <Aviso tono="error">{error}</Aviso>}
        {tipo !== "sin_venta" && (
          <CampoDinero
            etiqueta={dc.monto}
            moneda={moneda}
            valor={monto}
            alCambiar={setMonto}
            error={textoCampo(d, campos.montoCents)}
            autoFocus
          />
        )}
        <CampoTexto
          etiqueta={dc.motivo}
          placeholder={dc.motivoPlaceholder}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          error={textoCampo(d, campos.motivo)}
        />
      </form>
    </Modal>
  );
}

function ModalCierre({
  abierto,
  moneda,
  alCerrar,
  alCerrarCaja,
}: {
  abierto: boolean;
  moneda: string;
  alCerrar: () => void;
  alCerrarCaja: (contado: number, notas: string) => Promise<void>;
}) {
  const { d } = useIdioma();
  const dc = d.caja;
  const [contado, setContado] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function cerrar(e: React.FormEvent) {
    e.preventDefault();
    const cents = aCentavos(contado);
    if (cents === null) return setError(d.errores.monto_invalido);
    setOcupado(true);
    setError(null);
    try {
      await alCerrarCaja(cents, notas);
      setContado("");
      setNotas("");
    } catch (err) {
      setError(textoError(d, err));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={dc.cerrarTitulo}
      pie={
        <>
          <Boton variante="secundario" onClick={alCerrar}>
            {d.comun.cancelar}
          </Boton>
          <Boton type="submit" form="form-cierre" cargando={ocupado} disabled={!contado}>
            {dc.cerrar}
          </Boton>
        </>
      }
    >
      <form id="form-cierre" onSubmit={cerrar} className="space-y-4">
        <p className="text-[15px] text-gris">{dc.cerrarTexto}</p>
        {error && <Aviso tono="error">{error}</Aviso>}
        <CampoDinero
          etiqueta={dc.contado}
          moneda={moneda}
          valor={contado}
          alCambiar={setContado}
          grande
          autoFocus
          placeholder="0.00"
        />
        <CampoArea
          etiqueta={dc.notas}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          opcional={d.comun.opcional}
        />
      </form>
    </Modal>
  );
}
