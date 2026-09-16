"use client";

import { useCallback, useRef, useState } from "react";
import { ErrorApi, pedir } from "@/lib/api";
import { useIdioma } from "@/lib/i18n/cliente";
import { Modal } from "./ui/modal";
import { TecladoPin } from "./ui/teclado-pin";

export interface Autorizacion {
  usuarioId: string;
  pin: string;
}

type Accion<T> = (autorizacion?: Autorizacion) => Promise<T>;

/**
 * Ejecuta una acción; si el servidor responde que hace falta un gerente, abre la
 * ventana para que un gerente elija su nombre y ponga su PIN, y reintenta.
 */
export function useConAutorizacion() {
  const { d } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const [autorizadores, setAutorizadores] = useState<{ id: string; nombre: string }[] | null>(null);
  const [elegido, setElegido] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const pendiente = useRef<{
    accion: Accion<unknown>;
    resolver: (v: unknown) => void;
    rechazar: (e: unknown) => void;
  } | null>(null);

  const ejecutar = useCallback(async <T,>(accion: Accion<T>): Promise<T> => {
    try {
      return await accion();
    } catch (e) {
      if (!(e instanceof ErrorApi) || e.codigo !== "requiere_autorizacion") throw e;
      setError(null);
      setElegido(null);
      setAbierto(true);
      pedir<{ autorizadores: { id: string; nombre: string }[] }>("/datos/pin/autorizadores")
        .then((r) => {
          setAutorizadores(r.autorizadores);
          if (r.autorizadores.length === 1) setElegido(r.autorizadores[0]!.id);
        })
        .catch(() => setAutorizadores([]));
      return new Promise<T>((resolver, rechazar) => {
        pendiente.current = {
          accion: accion as Accion<unknown>,
          resolver: resolver as (v: unknown) => void,
          rechazar,
        };
      });
    }
  }, []);

  async function confirmar(pin: string) {
    const p = pendiente.current;
    if (!p || !elegido) return;
    setOcupado(true);
    setError(null);
    try {
      const r = await p.accion({ usuarioId: elegido, pin });
      pendiente.current = null;
      setAbierto(false);
      p.resolver(r);
    } catch (e) {
      if (e instanceof ErrorApi && (e.codigo === "autorizacion_invalida" || e.codigo === "pin_bloqueado")) {
        setError(e.message);
      } else {
        pendiente.current = null;
        setAbierto(false);
        p.rechazar(e);
      }
    } finally {
      setOcupado(false);
    }
  }

  function cancelar() {
    pendiente.current?.rechazar(new ErrorApi(499, "cancelado", ""));
    pendiente.current = null;
    setAbierto(false);
  }

  const modal = (
    <Modal abierto={abierto} alCerrar={cancelar} titulo={d.pin.autorizacionTitulo}>
      <p className="mb-4 text-[15px] text-gris">{d.pin.autorizacionTexto}</p>
      {autorizadores === null ? (
        <p className="py-6 text-center text-gris">{d.comun.cargando}</p>
      ) : autorizadores.length === 0 ? (
        <p className="rounded-2xl bg-alerta-suave px-4 py-3 text-[15px] text-alerta">
          {d.pin.sinAutorizadores}
        </p>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            {autorizadores.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setElegido(a.id)}
                aria-pressed={elegido === a.id}
                className={`rounded-full px-4 py-2 text-[15px] font-semibold ring-1 ${
                  elegido === a.id ? "bg-tinta text-white ring-tinta" : "bg-superficie text-noche ring-percha"
                }`}
              >
                {a.nombre}
              </button>
            ))}
          </div>
          {elegido && (
            <TecladoPin
              alEnviar={confirmar}
              ocupado={ocupado}
              error={error}
              etiquetaEnviar={d.pin.autorizar}
            />
          )}
        </>
      )}
    </Modal>
  );

  return { ejecutar, modal };
}
