"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pedir } from "./api";
import { pedirConCache } from "./sin-conexion/cache";
import { EVENTO_SINCRONIZADO } from "./sin-conexion/cola";

/** Cada cuánto se refresca una pantalla «en vivo» aunque nadie la toque. */
export const INTERVALO_EN_VIVO_MS = 60_000;
/** Volver a la pestaña dispara varios avisos seguidos (focus, pageshow, visibility): uno solo cuenta. */
const RESPIRO_MS = 2_000;

/**
 * Carga datos de /datos y permite recargarlos después de un cambio.
 * Con `enVivo`, además se refresca sola: al volver a la pestaña o a la app, cada
 * minuto, y cuando la cola del equipo termina de subir. Así lo que se hace en un
 * equipo se ve en los demás sin recargar (lo que Richard vio fallar el 22 sep 2026).
 */
export function useDatos<T>(url: string | null, opciones: { cache?: boolean; enVivo?: boolean } = {}) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [version, setVersion] = useState(0);
  const enVivo = Boolean(opciones.enVivo);
  const ultimaCarga = useRef(0);

  useEffect(() => {
    if (!url || !enVivo) return;
    const refrescar = () => {
      if (Date.now() - ultimaCarga.current < RESPIRO_MS) return;
      setVersion((v) => v + 1);
    };
    const alVolver = () => {
      if (document.visibilityState === "visible") refrescar();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", refrescar);
    window.addEventListener("pageshow", refrescar);
    window.addEventListener(EVENTO_SINCRONIZADO, refrescar);
    const reloj = setInterval(() => {
      if (document.visibilityState === "visible") refrescar();
    }, INTERVALO_EN_VIVO_MS);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", refrescar);
      window.removeEventListener("pageshow", refrescar);
      window.removeEventListener(EVENTO_SINCRONIZADO, refrescar);
      clearInterval(reloj);
    };
  }, [url, enVivo]);

  useEffect(() => {
    if (!url) return;
    let vivo = true;
    ultimaCarga.current = Date.now();
    (opciones.cache ? pedirConCache<T>(url) : pedir<T>(url))
      .then((r) => {
        if (!vivo) return;
        setDatos(r);
        setError(null);
      })
      .catch((e: unknown) => {
        if (vivo) setError(e);
      });
    return () => {
      vivo = false;
    };
  }, [url, version, opciones.cache]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { datos, error, recargar, setDatos };
}
