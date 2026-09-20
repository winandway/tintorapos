"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoTexto } from "@/components/ui/campo";
import { pedir } from "@/lib/api";
import { textoError } from "@/lib/errores-cliente";
import { fmt } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { recargarEn } from "@/lib/navegacion";

/** Activación: QR → primer código → códigos de respaldo. */
export function FormActivarDosPasos() {
  const { d } = useIdioma();
  const [datos, setDatos] = useState<{ secreto: string; qrSvg: string } | null>(null);
  const [codigo, setCodigo] = useState("");
  const [respaldos, setRespaldos] = useState<string[] | null>(null);
  const [guardados, setGuardados] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function empezar(regenerar = false) {
    setOcupado(true);
    setError(null);
    try {
      setDatos(
        await pedir<{ secreto: string; qrSvg: string }>("/datos/sesion/dos-pasos/iniciar", {
          cuerpo: { regenerar },
        }),
      );
      if (regenerar) setCodigo("");
    } catch (e) {
      setError(textoError(d, e));
    } finally {
      setOcupado(false);
    }
  }

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    try {
      const r = await pedir<{ codigosRespaldo: string[] }>("/datos/sesion/dos-pasos/activar", {
        cuerpo: { codigo },
      });
      setRespaldos(r.codigosRespaldo);
    } catch (err) {
      setError(textoError(d, err));
    } finally {
      setOcupado(false);
    }
  }

  if (respaldos) {
    const texto = `Tintora POS\n${respaldos.join("\n")}`;
    return (
      <div className="space-y-5">
        <h1 className="titulo-ancho text-3xl leading-tight">{d.acceso.respaldoTitulo}</h1>
        <p className="text-[15px] text-gris">{d.acceso.respaldoTexto}</p>
        <ol
          className="grid grid-cols-2 gap-2 rounded-2xl bg-superficie p-4 ring-1 ring-percha"
          data-testid="codigos-respaldo"
        >
          {respaldos.map((c) => (
            <li key={c} className="font-mono text-[17px] tracking-wider">
              {c}
            </li>
          ))}
        </ol>
        <div className="flex gap-2">
          <Boton
            variante="secundario"
            onClick={async () => {
              await navigator.clipboard.writeText(texto);
              setCopiado(true);
            }}
          >
            {copiado ? d.acceso.copiado : d.acceso.copiar}
          </Boton>
          <a
            className="inline-flex h-11 items-center rounded-xl px-4 text-[15px] font-semibold text-tinta ring-1 ring-inset ring-percha hover:bg-tinta-suave"
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(texto)}`}
            download="tintora-pos-codigos-respaldo.txt"
          >
            {d.acceso.descargar}
          </a>
        </div>
        <label className="flex items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            className="size-5 accent-tinta"
            checked={guardados}
            onChange={(e) => setGuardados(e.target.checked)}
          />
          {d.acceso.yaGuarde}
        </label>
        <Boton ancho tamano="grande" disabled={!guardados} onClick={() => recargarEn("/app")}>
          {d.acceso.irAlPanel}
        </Boton>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="titulo-ancho text-3xl leading-tight">{d.acceso.activarTitulo}</h1>
      <p className="text-[15px] text-gris">{d.acceso.activarTexto}</p>
      {error && <Aviso tono="error">{error}</Aviso>}
      <ol className="space-y-4 text-[15px]">
        <li className="flex gap-3">
          <PasoNumero n={1} />
          <span>{d.acceso.activarPaso1}</span>
        </li>
        {datos && (
          <>
            <li className="flex gap-3">
              <PasoNumero n={2} />
              <div className="space-y-3">
                <span>{d.acceso.activarPaso2}</span>
                <div
                  className="w-48 rounded-2xl bg-white p-2 ring-1 ring-percha [&_svg]:h-auto [&_svg]:w-full"
                  // SVG generado en nuestro servidor a partir del secreto.
                  dangerouslySetInnerHTML={{ __html: datos.qrSvg }}
                />
                <p className="text-[13px] text-gris">{d.acceso.activarManual}</p>
                <p className="font-mono text-[15px] tracking-wider" data-testid="secreto-totp">
                  {datos.secreto}
                </p>
                <button
                  type="button"
                  onClick={() => void empezar(true)}
                  className="text-[13px] font-semibold text-tinta underline underline-offset-2"
                >
                  {d.acceso.otroCodigo}
                </button>
              </div>
            </li>
            <li className="flex gap-3">
              <PasoNumero n={3} />
              <form onSubmit={confirmar} className="flex-1 space-y-3">
                <span>{d.acceso.activarPaso3}</span>
                <CampoTexto
                  etiqueta={d.acceso.codigo}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                />
                <Boton type="submit" ancho cargando={ocupado} disabled={codigo.length !== 6}>
                  {d.acceso.confirmarCodigo}
                </Boton>
              </form>
            </li>
          </>
        )}
      </ol>
      {!datos && (
        <Boton ancho tamano="grande" onClick={() => void empezar()} cargando={ocupado}>
          {d.acceso.empezar}
        </Boton>
      )}
    </div>
  );
}

function PasoNumero({ n }: { n: number }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tinta-suave text-sm font-bold text-tinta">
      {n}
    </span>
  );
}

/** Verificación al entrar. */
export function FormVerificarDosPasos() {
  const { d } = useIdioma();
  const [modoRespaldo, setModoRespaldo] = useState(false);
  const [valor, setValor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    try {
      const r = await pedir<{ respaldosRestantes: number | null }>("/datos/sesion/dos-pasos/verificar", {
        cuerpo: modoRespaldo ? { respaldo: valor } : { codigo: valor },
      });
      if (r.respaldosRestantes !== null && r.respaldosRestantes <= 3) {
        setAviso(fmt(d.acceso.respaldosQuedan, { n: r.respaldosRestantes }));
        setTimeout(() => recargarEn("/app"), 2500);
      } else {
        recargarEn("/app");
      }
    } catch (err) {
      setError(textoError(d, err));
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <h1 className="titulo-ancho text-3xl leading-tight">{d.acceso.dosPasosTitulo}</h1>
      <p className="text-[15px] text-gris">{d.acceso.dosPasosTexto}</p>
      {error && <Aviso tono="error">{error}</Aviso>}
      {aviso && <Aviso tono="alerta">{aviso}</Aviso>}
      {modoRespaldo ? (
        <CampoTexto
          etiqueta={d.acceso.codigoRespaldo}
          autoCapitalize="characters"
          autoComplete="off"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      ) : (
        <CampoTexto
          etiqueta={d.acceso.codigo}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))}
        />
      )}
      <Boton
        type="submit"
        ancho
        tamano="grande"
        cargando={ocupado}
        disabled={modoRespaldo ? valor.length < 8 : valor.length !== 6}
      >
        {d.acceso.verificar}
      </Boton>
      <button
        type="button"
        className="w-full text-center text-sm font-semibold text-tinta hover:underline"
        onClick={() => {
          setModoRespaldo((m) => !m);
          setValor("");
        }}
      >
        {modoRespaldo ? d.acceso.usarApp : d.acceso.usarRespaldo}
      </button>
    </form>
  );
}
