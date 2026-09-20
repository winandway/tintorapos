"use client";

import { useEffect, useRef, useState } from "react";
import { borrarBorrador, claveBorrador, guardarBorrador, leerBorrador } from "./borradores";

/** Medio segundo de respiro: se guarda al dejar de escribir, no en cada tecla. */
const ESPERA_MS = 500;

export interface Borrador {
  /** Había algo guardado y se devolvió: hay que avisarlo en una línea. */
  recuperado: boolean;
  /** Se llama al guardar con éxito o al cancelar a propósito. */
  olvidar: () => void;
  /** «Empezar de nuevo»: borra lo recuperado y quita el aviso. */
  descartar: () => void;
}

/**
 * Guarda lo que se escribe y lo devuelve al volver (regla de la casa: ningún
 * formulario pierde lo escrito). `formulario` identifica la pantalla y
 * `duenoId` a la persona, para no mezclar borradores en una computadora
 * compartida.
 */
export function useBorrador<T>(
  formulario: string,
  valor: T,
  opciones: { duenoId?: string | null; activo?: boolean; alRecuperar?: (v: T) => void } = {},
): Borrador {
  const activo = opciones.activo !== false;
  const clave = claveBorrador(formulario, opciones.duenoId);
  const [recuperado, setRecuperado] = useState(false);
  const leido = useRef(false);
  const alRecuperar = useRef(opciones.alRecuperar);

  // La función de recuperar cambia en cada render (va en línea): se guarda
  // aparte para que el efecto de lectura no se dispare una y otra vez.
  useEffect(() => {
    alRecuperar.current = opciones.alRecuperar;
  });

  // 1. Al abrir: si hay algo guardado, se devuelve. Se lee del navegador al
  // montar porque `localStorage` no existe en el servidor.
  useEffect(() => {
    if (!activo || leido.current) return;
    leido.current = true;
    const b = leerBorrador<T>(clave);
    if (!b) return;
    alRecuperar.current?.(b.valor);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecuperado(true);
  }, [clave, activo]);

  // 2. Mientras se escribe: se guarda solo, con medio segundo de respiro.
  useEffect(() => {
    if (!activo || !leido.current) return;
    const t = setTimeout(() => guardarBorrador(clave, valor), ESPERA_MS);
    return () => clearTimeout(t);
  }, [clave, valor, activo]);

  // 3. Si cierran la pestaña de golpe, se guarda lo último sin esperar.
  useEffect(() => {
    if (!activo) return;
    const alSalir = () => guardarBorrador(clave, valor);
    window.addEventListener("pagehide", alSalir);
    return () => window.removeEventListener("pagehide", alSalir);
  }, [clave, valor, activo]);

  return {
    recuperado,
    olvidar: () => {
      borrarBorrador(clave);
      setRecuperado(false);
    },
    descartar: () => {
      borrarBorrador(clave);
      setRecuperado(false);
    },
  };
}
