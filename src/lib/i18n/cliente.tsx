"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Diccionario } from "./index";
import type { Idioma } from "./idiomas";

interface ValorIdioma {
  idioma: Idioma;
  d: Diccionario;
}

const ContextoIdioma = createContext<ValorIdioma | null>(null);

export function ProveedorIdioma({ idioma, d, children }: ValorIdioma & { children: ReactNode }) {
  return <ContextoIdioma.Provider value={{ idioma, d }}>{children}</ContextoIdioma.Provider>;
}

export function useIdioma(): ValorIdioma {
  const v = useContext(ContextoIdioma);
  if (!v) throw new Error("useIdioma se usó fuera de <ProveedorIdioma>");
  return v;
}
