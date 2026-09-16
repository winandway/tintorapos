"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoTexto } from "@/components/ui/campo";
import { CampoClave } from "@/components/ui/campo-clave";
import { Turnstile } from "@/components/ui/turnstile";
import { pedir } from "@/lib/api";
import { camposDe, textoCampo, textoError } from "@/lib/errores-cliente";
import { useIdioma } from "@/lib/i18n/cliente";
import { recargarEn } from "@/lib/navegacion";

export function FormCambiarClave() {
  const { d } = useIdioma();
  const [v, setV] = useState({ actual: "", nueva: "", repetir: "" });
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCampos({});
    if (v.nueva !== v.repetir) {
      setCampos({ repetir: "claves_distintas" });
      return;
    }
    setOcupado(true);
    try {
      await pedir("/datos/clave/cambiar", { cuerpo: { actual: v.actual, nueva: v.nueva } });
      recargarEn("/app");
    } catch (err) {
      setError(textoError(d, err));
      setCampos(camposDe(err));
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <h1 className="titulo-ancho text-3xl leading-tight">{d.acceso.cambiarTitulo}</h1>
      <p className="text-[15px] text-gris">{d.acceso.cambiarTexto}</p>
      {error && <Aviso tono="error">{error}</Aviso>}
      <CampoClave
        etiqueta={d.acceso.claveActual}
        autoComplete="current-password"
        value={v.actual}
        onChange={(e) => setV({ ...v, actual: e.target.value })}
        error={textoCampo(d, campos.actual)}
      />
      <CampoClave
        etiqueta={d.acceso.claveNueva}
        autoComplete="new-password"
        ayuda={d.acceso.claveAyuda}
        value={v.nueva}
        onChange={(e) => setV({ ...v, nueva: e.target.value })}
        error={textoCampo(d, campos.clave)}
      />
      <CampoClave
        etiqueta={d.acceso.claveRepetir}
        autoComplete="new-password"
        value={v.repetir}
        onChange={(e) => setV({ ...v, repetir: e.target.value })}
        error={textoCampo(d, campos.repetir)}
      />
      <Boton type="submit" ancho tamano="grande" cargando={ocupado}>
        {d.acceso.guardarClave}
      </Boton>
    </form>
  );
}

export function FormRecuperar({ siteKey }: { siteKey: string | null }) {
  const { d } = useIdioma();
  const [correo, setCorreo] = useState("");
  const [pase, setPase] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(false);
  const alPase = useCallback((t: string | null) => setPase(t), []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    setCampos({});
    try {
      await pedir("/datos/clave/recuperar", { cuerpo: { correo }, turnstile: pase });
      setEnviado(true);
    } catch (err) {
      setError(textoError(d, err));
      setCampos(camposDe(err));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <h1 className="titulo-ancho text-3xl leading-tight">{d.acceso.recuperarTitulo}</h1>
      {enviado ? (
        <Aviso tono="ok">{d.acceso.recuperarEnviado}</Aviso>
      ) : (
        <>
          <p className="text-[15px] text-gris">{d.acceso.recuperarTexto}</p>
          {error && <Aviso tono="error">{error}</Aviso>}
          <CampoTexto
            etiqueta={d.acceso.correo}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={d.acceso.correoPlaceholder}
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            error={textoCampo(d, campos.correo)}
          />
          <Turnstile siteKey={siteKey} alCambiar={alPase} />
          <Boton type="submit" ancho tamano="grande" cargando={ocupado}>
            {d.acceso.enviarEnlace}
          </Boton>
        </>
      )}
      <Link href="/entrar" className="block text-center text-sm font-semibold text-tinta hover:underline">
        {d.acceso.volverEntrar}
      </Link>
    </form>
  );
}

export function FormRestablecer({ token }: { token: string }) {
  const { d } = useIdioma();
  const [v, setV] = useState({ nueva: "", repetir: "" });
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCampos({});
    if (v.nueva !== v.repetir) {
      setCampos({ repetir: "claves_distintas" });
      return;
    }
    setOcupado(true);
    try {
      await pedir("/datos/clave/restablecer", { cuerpo: { token, clave: v.nueva } });
      setListo(true);
    } catch (err) {
      setError(textoError(d, err));
      setCampos(camposDe(err));
    } finally {
      setOcupado(false);
    }
  }

  if (!token) return <Aviso tono="error">{d.acceso.enlaceInvalido}</Aviso>;
  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <h1 className="titulo-ancho text-3xl leading-tight">{d.acceso.restablecerTitulo}</h1>
      {listo ? (
        <>
          <Aviso tono="ok">{d.acceso.restablecerListo}</Aviso>
          <Link href="/entrar" className="block text-center font-semibold text-tinta hover:underline">
            {d.acceso.volverEntrar}
          </Link>
        </>
      ) : (
        <>
          {error && <Aviso tono="error">{error}</Aviso>}
          <CampoClave
            etiqueta={d.acceso.claveNueva}
            autoComplete="new-password"
            ayuda={d.acceso.claveAyuda}
            value={v.nueva}
            onChange={(e) => setV({ ...v, nueva: e.target.value })}
            error={textoCampo(d, campos.clave)}
          />
          <CampoClave
            etiqueta={d.acceso.claveRepetir}
            autoComplete="new-password"
            value={v.repetir}
            onChange={(e) => setV({ ...v, repetir: e.target.value })}
            error={textoCampo(d, campos.repetir)}
          />
          <Boton type="submit" ancho tamano="grande" cargando={ocupado}>
            {d.acceso.guardarClave}
          </Boton>
        </>
      )}
    </form>
  );
}
