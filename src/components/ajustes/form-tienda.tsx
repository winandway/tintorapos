"use client";

import { useEffect, useMemo, useState } from "react";
import { Aviso, useAvisar } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoSelector, CampoTexto } from "@/components/ui/campo";
import { CampoBuscador } from "@/components/ui/campo-buscador";
import { Tarjeta, TituloSeccion } from "@/components/ui/encabezado";
import { pedir } from "@/lib/api";
import { camposDe, textoCampo, textoError } from "@/lib/errores-cliente";
import { useIdioma } from "@/lib/i18n/cliente";
import { listaMonedas, listaPaises, monedaDePais } from "@/lib/paises";
import { useBorrador } from "@/lib/use-borrador";
import { AvisoBorrador } from "@/components/ui/aviso-borrador";

interface Tienda {
  nombre: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  ciudad: string | null;
  estadoRegion: string | null;
  codigoPostal: string | null;
  pais: string;
  zonaHoraria: string;
  moneda: string;
  idioma: "es" | "en";
  impuestoBps: number;
  recargoUrgenteBps: number;
  descuentoMaxBps: number;
  diasEntrega: number;
  politicaCobro: "entrega" | "recepcion";
  unidadPeso: "lb" | "kg";
  diasRecordatorio: number;
  maxRecordatorios: number;
  diasAbandono: number;
  bloqueoInactividadMin: number;
}

const bpsATexto = (bps: number) => String(bps / 100);
const textoABps = (t: string) => {
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : Number.NaN;
};

export function FormTienda() {
  const { d, idioma } = useIdioma();
  const avisar = useAvisar();
  const [t, setT] = useState<Tienda | null>(null);
  const [pct, setPct] = useState({ impuesto: "0", recargo: "0", descuento: "0" });
  const [zonas, setZonas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  // Todos los países y monedas del mundo, con el nombre en el idioma de la tienda.
  const paises = useMemo(() => listaPaises(idioma), [idioma]);
  const monedas = useMemo(() => listaMonedas(idioma), [idioma]);
  // Si se cierra la ventana a mitad de cambiar los datos de la tienda, vuelven
  // a salir. «Empezar de nuevo» devuelve lo que hay guardado en el servidor.
  const borrador = useBorrador(
    "ajustes-tienda",
    { t, pct },
    {
      activo: t !== null,
      alRecuperar: (g) => {
        if (g.t) setT(g.t);
        if (g.pct) setPct(g.pct);
      },
    },
  );

  useEffect(() => {
    pedir<{ tienda: Tienda }>("/datos/ajustes/tienda")
      .then(({ tienda }) => {
        setT(tienda);
        setPct({
          impuesto: bpsATexto(tienda.impuestoBps),
          recargo: bpsATexto(tienda.recargoUrgenteBps),
          descuento: bpsATexto(tienda.descuentoMaxBps),
        });
        const todas = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
        setZonas(todas.includes(tienda.zonaHoraria) ? todas : [tienda.zonaHoraria, ...todas]);
      })
      .catch((e) => setError(textoError(d, e)));
  }, [d]);

  if (!t)
    return error ? <Aviso tono="error">{error}</Aviso> : <p className="text-gris">{d.comun.cargando}</p>;

  const texto = (k: keyof Tienda) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setT({ ...t, [k]: e.target.value });
  const cambiar = (cambios: Partial<Tienda>) => setT((x) => (x ? { ...x, ...cambios } : x));
  const numero = (k: keyof Tienda) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setT({ ...t, [k]: e.target.value === "" ? Number.NaN : Number(e.target.value) });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!t) return;
    setGuardando(true);
    setError(null);
    setCampos({});
    try {
      await pedir("/datos/ajustes/tienda", {
        metodo: "PUT",
        cuerpo: {
          ...t,
          telefono: t.telefono ?? "",
          correo: t.correo ?? "",
          direccion: t.direccion ?? "",
          ciudad: t.ciudad ?? "",
          estadoRegion: t.estadoRegion ?? "",
          codigoPostal: t.codigoPostal ?? "",
          impuestoBps: textoABps(pct.impuesto),
          recargoUrgenteBps: textoABps(pct.recargo),
          descuentoMaxBps: textoABps(pct.descuento),
        },
      });
      borrador.olvidar();
      avisar(d.comun.guardado);
    } catch (err) {
      setError(textoError(d, err));
      setCampos(camposDe(err));
    } finally {
      setGuardando(false);
    }
  }

  const c = (k: string) => textoCampo(d, campos[k]);
  const dt = d.ajustes.tienda;
  return (
    <form onSubmit={guardar} className="space-y-4" noValidate>
      {borrador.recuperado && (
        <AvisoBorrador
          alDescartar={() => {
            borrador.descartar();
            window.location.reload();
          }}
        />
      )}
      {error && <Aviso tono="error">{error}</Aviso>}
      <Tarjeta>
        <TituloSeccion>{dt.identidad}</TituloSeccion>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto
            className="sm:col-span-2"
            etiqueta={dt.nombre}
            value={t.nombre}
            onChange={texto("nombre")}
            error={c("nombre")}
          />
          <CampoTexto
            etiqueta={dt.telefono}
            type="tel"
            value={t.telefono ?? ""}
            onChange={texto("telefono")}
            error={c("telefono")}
            opcional={d.comun.opcional}
          />
          <CampoTexto
            etiqueta={dt.correo}
            type="email"
            value={t.correo ?? ""}
            onChange={texto("correo")}
            error={c("correo")}
            opcional={d.comun.opcional}
          />
          <CampoTexto
            className="sm:col-span-2"
            etiqueta={dt.direccion}
            value={t.direccion ?? ""}
            onChange={texto("direccion")}
            error={c("direccion")}
            opcional={d.comun.opcional}
          />
          <CampoTexto
            etiqueta={dt.ciudad}
            value={t.ciudad ?? ""}
            onChange={texto("ciudad")}
            opcional={d.comun.opcional}
          />
          <div className="grid grid-cols-2 gap-3">
            <CampoTexto etiqueta={dt.estado} value={t.estadoRegion ?? ""} onChange={texto("estadoRegion")} />
            <CampoTexto
              etiqueta={dt.codigoPostal}
              value={t.codigoPostal ?? ""}
              onChange={texto("codigoPostal")}
            />
          </div>
        </div>
      </Tarjeta>
      <Tarjeta>
        <TituloSeccion>{dt.region}</TituloSeccion>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoBuscador
            etiqueta={d.acceso.pais}
            valor={t.pais}
            alElegir={(codigo) => cambiar({ pais: codigo, moneda: monedaDePais(codigo) })}
            opciones={paises.map((p) => ({
              valor: p.codigo,
              texto: p.nombre,
              icono: p.bandera,
              detalle: p.moneda,
              busca: p.codigo,
            }))}
          />
          <CampoBuscador
            etiqueta={d.acceso.moneda}
            valor={t.moneda}
            alElegir={(m) => cambiar({ moneda: m })}
            opciones={monedas.map((m) => ({ valor: m.codigo, texto: m.codigo, detalle: m.nombre }))}
            error={c("moneda")}
          />
          <CampoBuscador
            etiqueta={d.acceso.zona}
            valor={t.zonaHoraria}
            alElegir={(z) => cambiar({ zonaHoraria: z })}
            opciones={zonas.map((z) => ({ valor: z, texto: z.replace(/_/g, " ") }))}
            error={c("zonaHoraria")}
          />
          <CampoSelector
            etiqueta={dt.idiomaTienda}
            value={t.idioma}
            onChange={texto("idioma")}
            opciones={[
              { valor: "es", texto: "Español" },
              { valor: "en", texto: "English" },
            ]}
          />
        </div>
      </Tarjeta>
      <Tarjeta>
        <TituloSeccion>{dt.cobros}</TituloSeccion>
        <div className="grid gap-4 sm:grid-cols-3">
          <CampoTexto
            etiqueta={dt.impuesto}
            inputMode="decimal"
            value={pct.impuesto}
            onChange={(e) => setPct({ ...pct, impuesto: e.target.value })}
            error={c("impuestoBps")}
            ayuda={dt.impuestoAyuda}
            className="sm:col-span-3"
          />
          <CampoTexto
            etiqueta={dt.recargo}
            inputMode="decimal"
            value={pct.recargo}
            onChange={(e) => setPct({ ...pct, recargo: e.target.value })}
            error={c("recargoUrgenteBps")}
          />
          <CampoTexto
            etiqueta={dt.descuentoMax}
            inputMode="decimal"
            value={pct.descuento}
            onChange={(e) => setPct({ ...pct, descuento: e.target.value })}
            error={c("descuentoMaxBps")}
            className="sm:col-span-2"
          />
          <CampoSelector
            etiqueta={dt.unidadPeso}
            ayuda={dt.unidadPesoAyuda}
            value={t.unidadPeso}
            onChange={(e) => setT({ ...t, unidadPeso: e.target.value as "lb" | "kg" })}
            opciones={[
              { valor: "kg", texto: dt.unidadesPeso.kg },
              { valor: "lb", texto: dt.unidadesPeso.lb },
            ]}
            className="sm:col-span-3"
            data-testid="unidad-peso"
          />
        </div>
      </Tarjeta>
      <Tarjeta>
        <TituloSeccion>{dt.cobro}</TituloSeccion>
        <p className="mb-3 text-[15px] text-gris">{dt.cobroAyuda}</p>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label={dt.cobro}
          data-testid="politica-cobro"
        >
          {(["entrega", "recepcion"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={t.politicaCobro === v}
              onClick={() => setT({ ...t, politicaCobro: v })}
              className={`rounded-2xl px-4 py-3 text-left text-[15px] font-semibold ring-1 ${t.politicaCobro === v ? "bg-tinta text-white ring-tinta" : "bg-superficie ring-percha hover:bg-tinta-suave"}`}
            >
              {dt.politicaCobro[v]}
              <span
                className={`block text-[13px] font-normal ${t.politicaCobro === v ? "text-white/80" : "text-gris"}`}
              >
                {dt.politicaCobroAyuda[v]}
              </span>
            </button>
          ))}
        </div>
      </Tarjeta>
      <Tarjeta>
        <TituloSeccion>{dt.entregas}</TituloSeccion>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto
            etiqueta={dt.diasEntrega}
            type="number"
            min={0}
            value={Number.isNaN(t.diasEntrega) ? "" : t.diasEntrega}
            onChange={numero("diasEntrega")}
            error={c("diasEntrega")}
          />
          <CampoTexto
            etiqueta={dt.diasRecordatorio}
            type="number"
            min={1}
            value={Number.isNaN(t.diasRecordatorio) ? "" : t.diasRecordatorio}
            onChange={numero("diasRecordatorio")}
            error={c("diasRecordatorio")}
          />
          <CampoTexto
            etiqueta={dt.maxRecordatorios}
            type="number"
            min={0}
            value={Number.isNaN(t.maxRecordatorios) ? "" : t.maxRecordatorios}
            onChange={numero("maxRecordatorios")}
            error={c("maxRecordatorios")}
          />
          <CampoTexto
            etiqueta={dt.diasAbandono}
            type="number"
            min={7}
            value={Number.isNaN(t.diasAbandono) ? "" : t.diasAbandono}
            onChange={numero("diasAbandono")}
            error={c("diasAbandono")}
            ayuda={dt.diasAbandonoAyuda}
          />
        </div>
      </Tarjeta>
      <Tarjeta>
        <TituloSeccion>{dt.seguridad}</TituloSeccion>
        <CampoTexto
          etiqueta={dt.bloqueo}
          type="number"
          min={1}
          value={Number.isNaN(t.bloqueoInactividadMin) ? "" : t.bloqueoInactividadMin}
          onChange={numero("bloqueoInactividadMin")}
          error={c("bloqueoInactividadMin")}
          className="max-w-xs"
        />
      </Tarjeta>
      <div className="sticky bottom-20 z-10 flex justify-end md:bottom-4">
        <Boton type="submit" tamano="grande" cargando={guardando} className="shadow-lg">
          {d.comun.guardar}
        </Boton>
      </div>
    </form>
  );
}
