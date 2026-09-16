"use client";

import { useEffect, useState } from "react";
import { Aviso, useAvisar } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoArea, CampoTexto } from "@/components/ui/campo";
import { Tarjeta, TituloSeccion } from "@/components/ui/encabezado";
import { pedir } from "@/lib/api";
import { camposDe, textoCampo, textoError } from "@/lib/errores-cliente";
import { fmt, formatoFecha } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";
import { ahoraMs } from "@/lib/fechas";

type Tipo = "recibida" | "lista" | "recordatorio";
interface Conf {
  activo: boolean;
  es: string;
  en: string;
  personalizado: boolean;
}
interface Datos {
  canales: { sms: boolean; correo: boolean };
  plantillas: Record<Tipo, Conf>;
  avisos: {
    id: string;
    tipo: string;
    canal: string;
    destino: string;
    estado: string;
    error: string | null;
    creado_en: number;
    numero: number | null;
  }[];
}

const TIPOS: Tipo[] = ["recibida", "lista", "recordatorio"];

export function AjustesAvisos({ tienda, zona }: { tienda: string; zona: string }) {
  const { d, idioma } = useIdioma();
  const da = d.avisos;
  const avisar = useAvisar();
  const { datos, error, recargar } = useDatos<Datos>("/datos/avisos");
  const [conf, setConf] = useState<Record<Tipo, Conf> | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [destino, setDestino] = useState("");
  const [probando, setProbando] = useState(false);
  const [resultado, setResultado] = useState<{ estado: string; error: string | null } | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});

  useEffect(() => {
    // Copia editable de lo que llegó del servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (datos) setConf(datos.plantillas);
  }, [datos]);

  if (!datos || !conf)
    return error ? (
      <Aviso tono="error">{textoError(d, error)}</Aviso>
    ) : (
      <p className="text-gris">{d.comun.cargando}</p>
    );

  async function guardar() {
    if (!conf) return;
    setGuardando(true);
    try {
      await pedir("/datos/avisos/plantillas", {
        metodo: "PUT",
        cuerpo: Object.fromEntries(
          TIPOS.map((t) => [t, { activo: conf[t].activo, es: conf[t].es, en: conf[t].en }]),
        ),
      });
      avisar(d.comun.guardado);
      recargar();
    } catch (e) {
      avisar(textoError(d, e), "error");
    } finally {
      setGuardando(false);
    }
  }

  async function probar() {
    setProbando(true);
    setResultado(null);
    setCampos({});
    try {
      const canal = destino.includes("@") ? "correo" : "sms";
      setResultado(
        await pedir<{ estado: string; error: string | null }>("/datos/avisos/prueba", {
          cuerpo: { canal, destino },
        }),
      );
      recargar();
    } catch (e) {
      setCampos(camposDe(e));
      avisar(textoError(d, e), "error");
    } finally {
      setProbando(false);
    }
  }

  const previa = (texto: string) =>
    fmt(texto, {
      tienda,
      nombre: idioma === "en" ? "Alex" : "Ana",
      numero: 1042,
      fecha: formatoFecha(ahoraMs() + 2 * 86_400_000, idioma, zona, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      enlace: `${location.origin}/t/…`,
    });

  return (
    <div className="space-y-4">
      <Tarjeta>
        <TituloSeccion>{da.canales}</TituloSeccion>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["sms", "correo"] as const).map((c) => (
            <div
              key={c}
              className={`rounded-2xl p-3 ${datos.canales[c] ? "bg-ok-suave" : "bg-alerta-suave"}`}
            >
              <p className="font-bold">{da[c]}</p>
              <p className={`text-[14px] ${datos.canales[c] ? "text-ok" : "text-alerta"}`}>
                {datos.canales[c] ? da.configurado : da.noConfigurado}
              </p>
            </div>
          ))}
        </div>
        {(!datos.canales.sms || !datos.canales.correo) && (
          <p className="mt-3 text-[13px] text-gris">{da.noConfiguradoTexto}</p>
        )}
      </Tarjeta>

      {TIPOS.map((t) => (
        <Tarjeta key={t}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-bold">{da.tipos[t].titulo}</h2>
              <p className="text-[14px] text-gris">{da.tipos[t].texto}</p>
            </div>
            <label className="flex items-center gap-2 text-[15px] font-semibold">
              <input
                type="checkbox"
                className="size-6 accent-tinta"
                checked={conf[t].activo}
                onChange={(e) => setConf({ ...conf, [t]: { ...conf[t], activo: e.target.checked } })}
              />
              {da.activo}
            </label>
          </div>
          {conf[t].activo && (
            <div className="mt-4 space-y-3">
              <CampoArea
                etiqueta={da.textoEs}
                value={conf[t].es}
                onChange={(e) => setConf({ ...conf, [t]: { ...conf[t], es: e.target.value } })}
                ayuda={da.variables}
              />
              <CampoArea
                etiqueta={da.textoEn}
                value={conf[t].en}
                onChange={(e) => setConf({ ...conf, [t]: { ...conf[t], en: e.target.value } })}
              />
              <div className="rounded-2xl bg-papel p-3 text-[14px]">
                <p className="mb-1 text-[12px] font-bold text-gris uppercase">{da.vistaPrevia}</p>
                <p>{previa(idioma === "en" ? conf[t].en : conf[t].es)}</p>
              </div>
            </div>
          )}
        </Tarjeta>
      ))}
      <div className="flex justify-end">
        <Boton tamano="grande" cargando={guardando} onClick={guardar}>
          {d.comun.guardar}
        </Boton>
      </div>

      <Tarjeta>
        <TituloSeccion>{da.prueba}</TituloSeccion>
        <p className="mb-3 text-[14px] text-gris">{da.pruebaTexto}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <CampoTexto
            className="flex-1"
            etiqueta={da.destino}
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            error={textoCampo(d, campos.destino)}
          />
          <Boton cargando={probando} disabled={destino.trim().length < 3} onClick={probar}>
            {da.enviar}
          </Boton>
        </div>
        {resultado && (
          <Aviso tono={resultado.estado === "enviado" ? "ok" : "alerta"} className="mt-3">
            {da.resultado[resultado.estado as keyof typeof da.resultado] ?? resultado.estado}
            {resultado.error && resultado.error !== "no_configurado" ? ` · ${resultado.error}` : ""}
          </Aviso>
        )}
      </Tarjeta>

      <Tarjeta className="p-0 md:p-0">
        <h2 className="px-5 pt-5 pb-2 text-[17px] font-bold">{da.historial}</h2>
        {datos.avisos.length === 0 ? (
          <p className="px-5 pb-5 text-gris">{da.sinAvisos}</p>
        ) : (
          <ul className="divide-y divide-percha/60 text-[14px]">
            {datos.avisos.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">
                    {a.tipo === "prueba" ? da.prueba : da.tipos[a.tipo as Tipo]?.titulo}
                  </span>
                  {a.numero ? ` · #${a.numero}` : ""}
                  <span className="block truncate text-[12px] text-gris">
                    {da[a.canal as "sms" | "correo"]} · {a.destino} ·{" "}
                    {formatoFecha(a.creado_en, idioma, zona)}
                  </span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${a.estado === "enviado" ? "bg-ok-suave text-ok" : a.estado === "fallido" ? "bg-peligro-suave text-peligro" : "bg-papel text-gris"}`}
                >
                  {da.resultado[a.estado as keyof typeof da.resultado] ?? a.estado}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
