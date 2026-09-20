"use client";

import { useState } from "react";
import { clasesBoton } from "@/components/ui/boton";
import { pedir } from "@/lib/api";
import { useIdioma } from "@/lib/i18n/cliente";
import { recargarEn } from "@/lib/navegacion";

/**
 * Abre la demostración: pide una tintorería de mentira, y la carga COMPLETA de
 * la página deja a la persona dentro del sistema con su sesión nueva.
 */
export function BotonDemo({ variante = "primario" }: { variante?: "primario" | "secundario" }) {
  const { d } = useIdioma();
  const [estado, setEstado] = useState<"listo" | "abriendo" | "error">("listo");
  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={estado === "abriendo"}
        onClick={async () => {
          setEstado("abriendo");
          try {
            await pedir("/datos/demo", { metodo: "POST" });
            recargarEn("/app");
          } catch {
            setEstado("error");
          }
        }}
        className={clasesBoton(variante, "grande")}
      >
        {estado === "abriendo" ? d.demo.abriendo : d.demo.boton}
      </button>
      {estado === "error" && <p className="text-sm font-semibold text-peligro">{d.demo.error}</p>}
    </div>
  );
}
