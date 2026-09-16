"use client";

import { useEffect, useRef } from "react";
import { useIdioma } from "@/lib/i18n/cliente";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, o: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Escudo anti-robots de Cloudflare. Sin clave de sitio no se muestra (y el servidor no lo exige). */
export function Turnstile({
  siteKey,
  alCambiar,
}: {
  siteKey: string | null;
  alCambiar: (token: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { idioma } = useIdioma();

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let id: string | null = null;
    let cancelado = false;
    const pintar = () => {
      if (cancelado || !ref.current || !window.turnstile) return;
      id = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        language: idioma,
        callback: (t: string) => alCambiar(t),
        "expired-callback": () => alCambiar(null),
        "error-callback": () => alCambiar(null),
      });
    };
    if (window.turnstile) pintar();
    else {
      let s = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
      if (!s) {
        s = document.createElement("script");
        s.src = SCRIPT;
        s.async = true;
        document.head.appendChild(s);
      }
      s.addEventListener("load", pintar);
    }
    return () => {
      cancelado = true;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [siteKey, idioma, alCambiar]);

  if (!siteKey) return null;
  return <div ref={ref} className="min-h-[65px]" />;
}
