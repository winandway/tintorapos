import type { ReactNode } from "react";

/** Diseño vacío: lo que se imprime no lleva menú ni encabezado. */
export default function LayoutImpresion({ children }: { children: ReactNode }) {
  return <main className="min-h-dvh bg-white">{children}</main>;
}
