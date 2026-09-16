"use client";

import { useEffect } from "react";

/** Registra el service worker (solo en producción: en desarrollo estorba a la recarga en caliente). */
export function RegistroServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((e: unknown) => console.warn("Service worker:", e));
  }, []);
  return null;
}

/** Al salir de una cuenta, se borran las pantallas guardadas (llevan datos de la sesión). */
export function limpiarPaginasGuardadas() {
  navigator.serviceWorker?.controller?.postMessage("limpiar-paginas");
}
