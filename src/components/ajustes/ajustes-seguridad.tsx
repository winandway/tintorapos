"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton, clasesBoton } from "@/components/ui/boton";
import { CampoTexto } from "@/components/ui/campo";
import { Tarjeta, TituloSeccion } from "@/components/ui/encabezado";
import { pedir } from "@/lib/api";
import { textoError } from "@/lib/errores-cliente";
import { fmt, formatoFecha } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";

interface Registro {
  id: string;
  usuario_nombre: string | null;
  autorizador_nombre: string | null;
  accion: string;
  detalle: string;
  creado_en: number;
}

export function AjustesSeguridad({
  cuenta,
  totpActivo,
  verActividad,
  zona,
}: {
  cuenta: boolean;
  totpActivo: boolean;
  verActividad: boolean;
  zona: string;
}) {
  const { d, idioma } = useIdioma();
  const ds = d.seguridad;
  const [codigo, setCodigo] = useState("");
  const [codigos, setCodigos] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [antes, setAntes] = useState<number | null>(null);
  const [previos, setPrevios] = useState<Registro[]>([]);
  const { datos } = useDatos<{ registros: Registro[] }>(
    verActividad ? `/datos/auditoria${antes ? `?antes=${antes}` : ""}` : null,
  );
  const registros = [...previos, ...(datos?.registros ?? [])];

  async function regenerar() {
    setError(null);
    try {
      const r = await pedir<{ codigosRespaldo: string[] }>("/datos/sesion/dos-pasos/respaldos", {
        cuerpo: { codigo },
      });
      setCodigos(r.codigosRespaldo);
      setCodigo("");
    } catch (e) {
      setError(textoError(d, e));
    }
  }

  return (
    <div className="space-y-4">
      {cuenta && (
        <Tarjeta>
          <TituloSeccion>{ds.dosPasos}</TituloSeccion>
          {totpActivo ? (
            <>
              <p className="font-semibold text-ok">✓ {ds.activa}</p>
              <div className="mt-4 rounded-2xl bg-papel p-4">
                <p className="font-semibold">{ds.nuevosRespaldos}</p>
                <p className="mb-3 text-[14px] text-gris">{ds.nuevosRespaldosTexto}</p>
                {error && (
                  <Aviso tono="error" className="mb-3">
                    {error}
                  </Aviso>
                )}
                {codigos ? (
                  <ol className="grid grid-cols-2 gap-1 font-mono text-[16px]">
                    {codigos.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ol>
                ) : (
                  <div className="flex items-end gap-2">
                    <CampoTexto
                      className="w-44"
                      etiqueta={d.acceso.codigo}
                      inputMode="numeric"
                      maxLength={6}
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                    />
                    <Boton disabled={codigo.length !== 6} onClick={regenerar}>
                      {ds.generar}
                    </Boton>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="font-semibold text-alerta">{ds.inactiva}</p>
              <p className="mt-1 text-[14px] text-gris">{ds.inactivaTexto}</p>
              <Link href="/entrar/activar-dos-pasos" className={`${clasesBoton()} mt-3`}>
                {ds.activar}
              </Link>
            </>
          )}
          <Link href="/entrar/cambiar-clave" className={`${clasesBoton("secundario")} mt-4`}>
            {ds.cambiarClave}
          </Link>
        </Tarjeta>
      )}
      {verActividad && (
        <Tarjeta className="p-0 md:p-0">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-[17px] font-bold">{ds.actividad}</h2>
            <p className="text-[14px] text-gris">{ds.actividadTexto}</p>
          </div>
          {registros.length === 0 ? (
            <p className="px-5 pb-5 text-gris">{ds.sinActividad}</p>
          ) : (
            <ul className="divide-y divide-percha/60 text-[14px]">
              {registros.map((r) => (
                <li key={r.id} className="px-5 py-2.5">
                  <span className="font-semibold">
                    {(ds.acciones as Record<string, string>)[r.accion] ?? r.accion}
                  </span>
                  <span className="text-gris"> · {r.usuario_nombre ?? "—"}</span>
                  {r.autorizador_nombre && (
                    <span className="text-tinta">
                      {" "}
                      · {fmt(ds.autorizo, { nombre: r.autorizador_nombre })}
                    </span>
                  )}
                  <span className="block text-[12px] text-gris">
                    {formatoFecha(r.creado_en, idioma, zona)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(datos?.registros.length ?? 0) >= 50 && (
            <div className="p-4 text-center">
              <Boton
                variante="secundario"
                onClick={() => {
                  setPrevios(registros);
                  setAntes(registros[registros.length - 1]!.creado_en);
                }}
              >
                {ds.verMas}
              </Boton>
            </div>
          )}
        </Tarjeta>
      )}
    </div>
  );
}
