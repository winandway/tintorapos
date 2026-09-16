"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso, useAvisar } from "@/components/ui/aviso";
import { Boton, clasesBoton } from "@/components/ui/boton";
import { CampoTexto } from "@/components/ui/campo";
import { Tarjeta, TituloSeccion } from "@/components/ui/encabezado";
import { MenuTresPuntos } from "@/components/ui/menu-tres-puntos";
import { pedir } from "@/lib/api";
import { camposDe, textoCampo, textoError } from "@/lib/errores-cliente";
import { fmt, formatoFecha } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";

interface Dispositivo {
  id: string;
  nombre: string;
  sucursal: string;
  creadoPor: string | null;
  creadoEn: number;
  ultimoUsoEn: number | null;
  revocadoEn: number | null;
}

export function GestionDispositivos({
  puedeRegistrar,
  zona,
  esteId,
}: {
  puedeRegistrar: boolean;
  zona: string;
  esteId: string | null;
}) {
  const { d, idioma } = useIdioma();
  const avisar = useAvisar();
  const dd = d.ajustes.dispositivos;
  const { datos, error, recargar } = useDatos<{ dispositivos: Dispositivo[] }>("/datos/dispositivos");
  const [nombre, setNombre] = useState("");
  const [registrado, setRegistrado] = useState(Boolean(esteId));
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [errorRegistro, setErrorRegistro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setErrorRegistro(null);
    setCampos({});
    try {
      await pedir("/datos/dispositivos", { cuerpo: { nombre } });
      setRegistrado(true);
      recargar();
    } catch (err) {
      setErrorRegistro(textoError(d, err));
      setCampos(camposDe(err));
    } finally {
      setOcupado(false);
    }
  }

  async function revocar(x: Dispositivo) {
    try {
      await pedir(`/datos/dispositivos/${x.id}`, { metodo: "DELETE" });
      recargar();
      avisar(d.comun.guardado);
    } catch (err) {
      avisar(textoError(d, err), "error");
    }
  }

  return (
    <div className="space-y-4">
      {registrado ? (
        <Aviso tono="ok" titulo={dd.registrado}>
          <Link href="/app/pin" className={`${clasesBoton("secundario", "chico")} mt-2`}>
            {dd.irPin}
          </Link>
        </Aviso>
      ) : (
        puedeRegistrar && (
          <Tarjeta>
            <TituloSeccion>{dd.registrarEste}</TituloSeccion>
            <p className="mb-4 text-[15px] text-gris">{dd.registrarTexto}</p>
            <form onSubmit={registrar} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
              <CampoTexto
                className="flex-1"
                etiqueta={dd.nombre}
                placeholder={dd.nombrePlaceholder}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                error={textoCampo(d, campos.nombre)}
              />
              <Boton type="submit" cargando={ocupado}>
                {dd.registrarEste}
              </Boton>
            </form>
            {errorRegistro && (
              <Aviso tono="error" className="mt-3">
                {errorRegistro}
              </Aviso>
            )}
          </Tarjeta>
        )
      )}
      <Tarjeta className="p-0 md:p-0">
        <h2 className="px-5 pt-5 pb-2 text-[17px] font-bold md:px-6">{dd.lista}</h2>
        {!datos ? (
          <p className="px-5 pb-5 text-gris">{error ? textoError(d, error) : d.comun.cargando}</p>
        ) : datos.dispositivos.length === 0 ? (
          <p className="px-5 pb-5 text-gris">{dd.vacio}</p>
        ) : (
          <ul className="divide-y divide-percha/60">
            {datos.dispositivos.map((x) => (
              <li
                key={x.id}
                className={`flex items-center gap-3 px-5 py-3.5 md:px-6 ${x.revocadoEn ? "opacity-55" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {x.nombre}
                    {x.id === esteId && (
                      <span className="ml-2 rounded-full bg-tinta-suave px-2 py-0.5 text-[11px] font-bold text-tinta">
                        ✓
                      </span>
                    )}
                    {x.revocadoEn && (
                      <span className="ml-2 rounded-full bg-peligro-suave px-2 py-0.5 text-[11px] font-bold text-peligro">
                        {dd.revocado}
                      </span>
                    )}
                  </p>
                  <p className="text-[13px] text-gris">
                    {x.creadoPor ? fmt(dd.creadoPor, { nombre: x.creadoPor }) : ""}
                    {x.ultimoUsoEn
                      ? ` · ${fmt(dd.ultimoUso, { fecha: formatoFecha(x.ultimoUsoEn, idioma, zona) })}`
                      : ""}
                  </p>
                </div>
                {!x.revocadoEn && (
                  <MenuTresPuntos
                    opciones={[
                      {
                        texto: dd.desactivar,
                        alElegir: () => revocar(x),
                        destructiva: {
                          titulo: fmt(dd.confirmarDesactivar, { nombre: x.nombre }),
                          mensaje: dd.confirmarDesactivarTexto,
                          confirmar: dd.desactivar,
                        },
                      },
                    ]}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
