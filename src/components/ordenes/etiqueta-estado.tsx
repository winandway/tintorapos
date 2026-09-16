"use client";

import { useIdioma } from "@/lib/i18n/cliente";

const COLORES: Record<string, string> = {
  recibida: "bg-dia-1/60 text-noche",
  en_proceso: "bg-dia-3/70 text-noche",
  lista: "bg-ok-suave text-ok",
  entregada: "bg-papel text-gris ring-1 ring-percha",
  anulada: "bg-peligro-suave text-peligro",
  abandonada: "bg-alerta-suave text-alerta",
};

export function EtiquetaEstado({ estado, atrasada = false }: { estado: string; atrasada?: boolean }) {
  const { d, idioma } = useIdioma();
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${COLORES[estado] ?? "bg-papel text-gris"}`}
      >
        {d.ordenes.estados[estado as keyof typeof d.ordenes.estados] ?? estado}
      </span>
      {atrasada && (
        <span className="rounded-full bg-peligro px-2 py-0.5 text-[11px] font-bold text-white">
          {idioma === "en" ? "Late" : "Atrasada"}
        </span>
      )}
    </span>
  );
}
