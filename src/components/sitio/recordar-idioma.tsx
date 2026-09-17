"use client";

import { useEffect } from "react";
import type { Idioma } from "@/lib/i18n";
import { guardarIdiomaElegido } from "@/lib/i18n/navegador";

/** En /es y /en: guarda ese idioma para el resto del sitio y corrige el lang de la página. */
export function RecordarIdioma({ idioma }: { idioma: Idioma }) {
  useEffect(() => {
    guardarIdiomaElegido(idioma);
  }, [idioma]);
  return null;
}
