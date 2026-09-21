"use client";

import { useState, type ReactNode } from "react";
import { useAvisar } from "@/components/ui/aviso";
import { clasesBoton } from "@/components/ui/boton";
import { ErrorImpresora } from "@/lib/impresion/conexion";
import { imprimirReciboDirecto } from "@/lib/impresion/imprimir";
import { useIdioma } from "@/lib/i18n/cliente";

type Variante = Parameters<typeof clasesBoton>[0];
type Tamano = Parameters<typeof clasesBoton>[1];

/**
 * «Imprimir recibo» sin saltos: si este equipo tiene la impresora conectada
 * directo, el papel sale con ESTE toque — sin abrir otra pantalla ni la ventana
 * del navegador. Si no hay, o si la impresora falla, se abre el camino de
 * siempre para que el cliente nunca se quede sin su recibo.
 */
export function BotonRecibo({
  ordenId,
  tipo,
  children,
  variante = "secundario",
  tamano = "grande",
  ancho = true,
  className = "",
}: {
  ordenId: string;
  tipo: "recibo" | "interna";
  children: ReactNode;
  variante?: Variante;
  tamano?: Tamano;
  ancho?: boolean;
  className?: string;
}) {
  const { d } = useIdioma();
  const di = d.impresion.impresoras;
  const avisar = useAvisar();
  const [ocupado, setOcupado] = useState(false);

  const abrirVentana = () =>
    window.open(`/app/ordenes/${ordenId}/imprimir?tipo=${tipo}`, "_blank", "noopener");

  const imprimir = async () => {
    setOcupado(true);
    try {
      if (await imprimirReciboDirecto(ordenId, tipo)) {
        avisar(di.directoOk);
        return;
      }
      abrirVentana();
    } catch (e) {
      // Si la impresora falla se dice por qué y se abre el camino de siempre.
      const codigo = e instanceof ErrorImpresora ? e.codigo : null;
      avisar(codigo && codigo !== "cancelado" ? di.errores[codigo] : di.directoFallo);
      abrirVentana();
    } finally {
      setOcupado(false);
    }
  };

  return (
    <button
      type="button"
      onClick={imprimir}
      disabled={ocupado}
      data-testid={`imprimir-${tipo}`}
      className={`${clasesBoton(variante, tamano, ancho)} ${className}`}
    >
      {children}
    </button>
  );
}
