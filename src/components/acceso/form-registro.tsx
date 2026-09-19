"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Casilla, CampoTexto } from "@/components/ui/campo";
import { CampoBuscador } from "@/components/ui/campo-buscador";
import { CampoClave } from "@/components/ui/campo-clave";
import { Turnstile } from "@/components/ui/turnstile";
import { pedir } from "@/lib/api";
import { camposDe, textoCampo, textoError } from "@/lib/errores-cliente";
import { useIdioma } from "@/lib/i18n/cliente";
import { recargarEn } from "@/lib/navegacion";
import { listaMonedas, listaPaises, monedaDePais } from "@/lib/paises";
import { rutaPagina } from "@/lib/rutas-publicas";

export function FormRegistro({ siteKey }: { siteKey: string | null }) {
  const { d, idioma } = useIdioma();
  const [v, setV] = useState({
    negocio: "",
    nombre: "",
    correo: "",
    clave: "",
    telefono: "",
    pais: "US",
    moneda: "USD",
    zonaHoraria: "America/New_York",
    aceptaTerminos: false,
  });
  const [zonas, setZonas] = useState<string[]>(["America/New_York"]);
  // Todos los países y todas las monedas, con el nombre en el idioma de la persona.
  const paises = useMemo(() => listaPaises(idioma), [idioma]);
  const monedas = useMemo(() => listaMonedas(idioma), [idioma]);
  const [pase, setPase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const alPase = useCallback((t: string | null) => setPase(t), []);

  useEffect(() => {
    const propia = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const todas =
      typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [propia];
    // Se lee del navegador al montar: no existe en el servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZonas(todas.includes(propia) ? todas : [propia, ...todas]);
    setV((x) => ({ ...x, zonaHoraria: propia || x.zonaHoraria }));
  }, []);

  const cambiar = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const valor = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setV((x) => {
      const nuevo = { ...x, [k]: valor };
      if (k === "pais") nuevo.moneda = monedaDePais(String(valor));
      return nuevo;
    });
  };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setCampos({});
    try {
      await pedir("/datos/registro", { cuerpo: { ...v, idioma }, turnstile: pase });
      recargarEn("/entrar/activar-dos-pasos");
    } catch (err) {
      setError(textoError(d, err));
      setCampos(camposDe(err));
      setEnviando(false);
    }
  }

  const [antes, entre, despues] = d.acceso.aceptoTerminos.split(/\{terminos\}|\{privacidad\}/);
  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <div>
        <h1 className="titulo-ancho text-3xl leading-tight">{d.acceso.registroTitulo}</h1>
        <p className="mt-2 text-[15px] text-gris">{d.acceso.registroSubtitulo}</p>
      </div>
      {error && <Aviso tono="error">{error}</Aviso>}
      <CampoTexto
        etiqueta={d.acceso.negocio}
        placeholder={d.acceso.negocioPlaceholder}
        autoComplete="organization"
        value={v.negocio}
        onChange={cambiar("negocio")}
        error={textoCampo(d, campos.negocio)}
      />
      <CampoTexto
        etiqueta={d.acceso.tuNombre}
        placeholder={d.acceso.tuNombrePlaceholder}
        autoComplete="name"
        value={v.nombre}
        onChange={cambiar("nombre")}
        error={textoCampo(d, campos.nombre)}
      />
      <CampoTexto
        etiqueta={d.acceso.correo}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={d.acceso.correoPlaceholder}
        value={v.correo}
        onChange={cambiar("correo")}
        error={textoCampo(d, campos.correo)}
      />
      <CampoClave
        etiqueta={d.acceso.clave}
        autoComplete="new-password"
        ayuda={d.acceso.claveAyuda}
        value={v.clave}
        onChange={cambiar("clave")}
        error={textoCampo(d, campos.clave)}
      />
      <CampoTexto
        etiqueta={d.acceso.telefonoNegocio}
        opcional={d.comun.opcional}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={d.acceso.telefonoPlaceholder}
        value={v.telefono}
        onChange={cambiar("telefono")}
        error={textoCampo(d, campos.telefono)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <CampoBuscador
          etiqueta={d.acceso.pais}
          valor={v.pais}
          alElegir={(codigo) => setV((x) => ({ ...x, pais: codigo, moneda: monedaDePais(codigo) }))}
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
          valor={v.moneda}
          alElegir={(m) => setV((x) => ({ ...x, moneda: m }))}
          opciones={monedas.map((m) => ({ valor: m.codigo, texto: m.codigo, detalle: m.nombre }))}
          error={textoCampo(d, campos.moneda)}
        />
      </div>
      <CampoBuscador
        etiqueta={d.acceso.zona}
        valor={v.zonaHoraria}
        alElegir={(z) => setV((x) => ({ ...x, zonaHoraria: z }))}
        opciones={zonas.map((z) => ({ valor: z, texto: z.replace(/_/g, " ") }))}
        error={textoCampo(d, campos.zonaHoraria)}
      />
      <div>
        <Casilla
          checked={v.aceptaTerminos}
          onChange={cambiar("aceptaTerminos")}
          etiqueta={
            <>
              {antes}
              <Link
                href={rutaPagina(idioma, "terminos")}
                target="_blank"
                className="font-semibold text-tinta underline"
              >
                {d.acceso.terminos}
              </Link>
              {entre}
              <Link
                href={rutaPagina(idioma, "privacidad")}
                target="_blank"
                className="font-semibold text-tinta underline"
              >
                {d.acceso.privacidad}
              </Link>
              {despues}
            </>
          }
        />
        {campos.aceptaTerminos && (
          <p className="mt-1 text-[13px] font-medium text-peligro">{textoCampo(d, campos.aceptaTerminos)}</p>
        )}
      </div>
      <Turnstile siteKey={siteKey} alCambiar={alPase} />
      <Boton type="submit" ancho tamano="grande" cargando={enviando}>
        {d.acceso.crearCuenta}
      </Boton>
      <p className="border-t border-percha/70 pt-5 text-center text-[15px] text-gris">
        {d.acceso.yaTienes}{" "}
        <Link href="/entrar" className="font-semibold text-tinta hover:underline">
          {d.comun.entrar}
        </Link>
      </p>
    </form>
  );
}
