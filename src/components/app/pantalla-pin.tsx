"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Isotipo } from "@/components/marca/logo";
import { SelectorIdioma } from "@/components/selector-idioma";
import { TecladoPin } from "@/components/ui/teclado-pin";
import { pedir } from "@/lib/api";
import { textoError } from "@/lib/errores-cliente";
import { fmt } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { recargarEn } from "@/lib/navegacion";

interface Empleado {
  id: string;
  nombre: string;
  rol: string;
  bloqueado: boolean;
}

export function PantallaPin() {
  const { d } = useIdioma();
  const [datos, setDatos] = useState<{ tienda: string; dispositivo: string; empleados: Empleado[] } | null>(
    null,
  );
  const [elegido, setElegido] = useState<Empleado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    pedir<{ tienda: string; dispositivo: string; empleados: Empleado[] }>("/datos/pin/empleados")
      .then(setDatos)
      .catch((e) => setError(textoError(d, e)));
  }, [d]);

  async function entrar(pin: string) {
    if (!elegido) return;
    setOcupado(true);
    setError(null);
    try {
      await pedir("/datos/pin/entrar", { cuerpo: { usuarioId: elegido.id, pin } });
      recargarEn("/app");
    } catch (e) {
      setError(textoError(d, e));
      setOcupado(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-papel">
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Isotipo className="size-8" />
          {datos && <span className="text-[15px] font-bold">{datos.tienda}</span>}
        </div>
        <SelectorIdioma />
      </header>
      <main id="contenido" className="flex flex-1 flex-col items-center justify-center px-4 pb-10">
        {!elegido ? (
          <div className="w-full max-w-2xl">
            <h1 className="titulo-ancho text-center text-3xl">{d.pin.titulo}</h1>
            <p className="mt-2 text-center text-gris">{d.pin.subtitulo}</p>
            {error && <p className="mt-4 text-center font-medium text-peligro">{error}</p>}
            {datos && datos.empleados.length === 0 && (
              <p className="mx-auto mt-6 max-w-md rounded-2xl bg-alerta-suave px-4 py-3 text-center text-alerta">
                {d.pin.sinEmpleados}
              </p>
            )}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {datos?.empleados.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    setElegido(e);
                    setError(null);
                  }}
                  className="flex flex-col items-center gap-2 rounded-3xl bg-superficie px-3 py-5 ring-1 ring-percha transition hover:ring-2 hover:ring-tinta"
                >
                  <span className="flex size-14 items-center justify-center rounded-full bg-tinta text-2xl font-bold text-white">
                    {e.nombre.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="text-center text-[15px] font-semibold leading-tight">{e.nombre}</span>
                  <span className={`text-xs ${e.bloqueado ? "font-bold text-peligro" : "text-gris"}`}>
                    {e.bloqueado ? d.pin.bloqueado : d.app.roles[e.rol as keyof typeof d.app.roles]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="mb-6 flex flex-col items-center gap-2">
              <span className="flex size-16 items-center justify-center rounded-full bg-tinta text-3xl font-bold text-white">
                {elegido.nombre.trim().charAt(0).toUpperCase()}
              </span>
              <p className="titulo-ancho text-xl">{elegido.nombre}</p>
            </div>
            <TecladoPin alEnviar={entrar} ocupado={ocupado} error={error} etiquetaEnviar={d.pin.entrar} />
            <button
              type="button"
              onClick={() => setElegido(null)}
              className="mt-6 w-full text-center text-sm font-semibold text-tinta hover:underline"
            >
              {d.pin.cambiarPersona}
            </button>
          </div>
        )}
      </main>
      <footer className="px-5 pb-5 text-center text-xs text-gris">
        {datos && <p>{fmt(d.pin.dispositivoDe, { dispositivo: datos.dispositivo, tienda: datos.tienda })}</p>}
        <Link href="/entrar" className="mt-1 inline-block font-semibold text-tinta hover:underline">
          {d.pin.entrarDueno}
        </Link>
      </footer>
    </div>
  );
}
