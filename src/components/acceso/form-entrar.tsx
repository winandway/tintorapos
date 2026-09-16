"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoTexto } from "@/components/ui/campo";
import { CampoClave } from "@/components/ui/campo-clave";
import { Turnstile } from "@/components/ui/turnstile";
import { pedir } from "@/lib/api";
import { camposDe, textoCampo, textoError } from "@/lib/errores-cliente";
import { useIdioma } from "@/lib/i18n/cliente";
import { recargarEn } from "@/lib/navegacion";
import { borrarCache } from "@/lib/sin-conexion/almacen";
import { limpiarPaginasGuardadas } from "@/components/app/registro-sw";
import { destinoSiguiente } from "./destinos";

export function FormEntrar({ siteKey, hayDispositivo }: { siteKey: string | null; hayDispositivo: boolean }) {
  const { d } = useIdioma();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [pase, setPase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const alPase = useCallback((t: string | null) => setPase(t), []);

  useEffect(() => {
    // Si este navegador ya no es dispositivo de la tienda (se desactivó), se borra lo guardado en él.
    if (!hayDispositivo) {
      borrarCache().catch(() => {});
      limpiarPaginasGuardadas();
    }
  }, [hayDispositivo]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setCampos({});
    try {
      const r = await pedir<{ siguiente: string }>("/datos/sesion/entrar", {
        cuerpo: { correo, clave },
        turnstile: pase,
      });
      recargarEn(destinoSiguiente(r.siguiente));
    } catch (err) {
      setError(textoError(d, err));
      setCampos(camposDe(err));
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <div>
        <h1 className="titulo-ancho text-3xl leading-tight">{d.acceso.entrarTitulo}</h1>
        <p className="mt-2 text-[15px] text-gris">{d.acceso.entrarSubtitulo}</p>
      </div>
      {error && <Aviso tono="error">{error}</Aviso>}
      <CampoTexto
        etiqueta={d.acceso.correo}
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder={d.acceso.correoPlaceholder}
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        error={textoCampo(d, campos.correo)}
        required
      />
      <div className="space-y-2">
        <CampoClave
          etiqueta={d.acceso.clave}
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          error={textoCampo(d, campos.clave)}
          required
        />
        <Link
          href="/entrar/recuperar"
          className="inline-block text-sm font-semibold text-tinta hover:underline"
        >
          {d.acceso.olvidaste}
        </Link>
      </div>
      <Turnstile siteKey={siteKey} alCambiar={alPase} />
      <Boton type="submit" ancho tamano="grande" cargando={enviando}>
        {d.acceso.entrar}
      </Boton>
      <div className="space-y-2 border-t border-percha/70 pt-5 text-center text-[15px]">
        <p className="text-gris">
          {d.acceso.sinCuenta}{" "}
          <Link href="/registro" className="font-semibold text-tinta hover:underline">
            {d.acceso.probarGratis}
          </Link>
        </p>
        {hayDispositivo && (
          <Link href="/app/pin" className="inline-block font-semibold text-tinta hover:underline">
            {d.acceso.irPin}
          </Link>
        )}
      </div>
    </form>
  );
}
