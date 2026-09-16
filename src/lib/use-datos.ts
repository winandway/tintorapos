"use client";

import { useCallback, useEffect, useState } from "react";
import { pedir } from "./api";

/** Carga datos de /datos y permite recargarlos después de un cambio. */
export function useDatos<T>(url: string | null) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!url) return;
    let vivo = true;
    pedir<T>(url)
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
  }, [url, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { datos, error, recargar, setDatos };
}
