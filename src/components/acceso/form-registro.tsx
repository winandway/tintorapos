"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Casilla, CampoSelector, CampoTexto } from "@/components/ui/campo";
import { CampoClave } from "@/components/ui/campo-clave";
import { Turnstile } from "@/components/ui/turnstile";
import { pedir } from "@/lib/api";
import { camposDe, textoCampo, textoError } from "@/lib/errores-cliente";
import { useIdioma } from "@/lib/i18n/cliente";
import { recargarEn } from "@/lib/navegacion";
import { rutaPagina } from "@/lib/rutas-publicas";

const PAISES: { codigo: string; es: string; en: string; moneda: string }[] = [
  { codigo: "US", es: "Estados Unidos", en: "United States", moneda: "USD" },
  { codigo: "PR", es: "Puerto Rico", en: "Puerto Rico", moneda: "USD" },
  { codigo: "CA", es: "Canadá", en: "Canada", moneda: "CAD" },
  { codigo: "MX", es: "México", en: "Mexico", moneda: "MXN" },
  { codigo: "CO", es: "Colombia", en: "Colombia", moneda: "COP" },
  { codigo: "PE", es: "Perú", en: "Peru", moneda: "PEN" },
  { codigo: "CL", es: "Chile", en: "Chile", moneda: "CLP" },
  { codigo: "AR", es: "Argentina", en: "Argentina", moneda: "ARS" },
  { codigo: "DO", es: "República Dominicana", en: "Dominican Republic", moneda: "DOP" },
  { codigo: "GT", es: "Guatemala", en: "Guatemala", moneda: "GTQ" },
  { codigo: "HN", es: "Honduras", en: "Honduras", moneda: "HNL" },
  { codigo: "CR", es: "Costa Rica", en: "Costa Rica", moneda: "CRC" },
  { codigo: "PA", es: "Panamá", en: "Panama", moneda: "USD" },
  { codigo: "SV", es: "El Salvador", en: "El Salvador", moneda: "USD" },
  { codigo: "EC", es: "Ecuador", en: "Ecuador", moneda: "USD" },
  { codigo: "BO", es: "Bolivia", en: "Bolivia", moneda: "BOB" },
  { codigo: "PY", es: "Paraguay", en: "Paraguay", moneda: "PYG" },
  { codigo: "UY", es: "Uruguay", en: "Uruguay", moneda: "UYU" },
  { codigo: "ES", es: "España", en: "Spain", moneda: "EUR" },
];

const MONEDAS = [
  "USD",
  "CAD",
  "MXN",
  "COP",
  "PEN",
  "CLP",
  "ARS",
  "DOP",
  "GTQ",
  "HNL",
  "CRC",
  "PAB",
  "BOB",
  "PYG",
  "UYU",
  "EUR",
];

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
      if (k === "pais") nuevo.moneda = PAISES.find((p) => p.codigo === valor)?.moneda ?? x.moneda;
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
      <div className="grid grid-cols-2 gap-3">
        <CampoSelector
          etiqueta={d.acceso.pais}
          value={v.pais}
          onChange={cambiar("pais")}
          opciones={PAISES.map((p) => ({ valor: p.codigo, texto: idioma === "en" ? p.en : p.es }))}
        />
        <CampoSelector
          etiqueta={d.acceso.moneda}
          value={v.moneda}
          onChange={cambiar("moneda")}
          opciones={MONEDAS.map((m) => ({ valor: m, texto: m }))}
          error={textoCampo(d, campos.moneda)}
        />
      </div>
      <CampoSelector
        etiqueta={d.acceso.zona}
        value={v.zonaHoraria}
        onChange={cambiar("zonaHoraria")}
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
