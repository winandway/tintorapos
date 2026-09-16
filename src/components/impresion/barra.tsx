"use client";

import { useEffect } from "react";
import { useConAutorizacion } from "@/components/autorizacion";
import { Boton } from "@/components/ui/boton";
import { ErrorApi, pedir } from "@/lib/api";
import { diccionario, type Idioma } from "@/lib/i18n";

/** Barra de arriba (no sale en el papel) y el diálogo de impresión automático. */
export function BarraImpresion({ idioma, automatico = true }: { idioma: Idioma; automatico?: boolean }) {
  const d = diccionario(idioma).impresion;
  useEffect(() => {
    // Con ?vista=1 (vista previa, pruebas y capturas de Docs) no se abre el diálogo solo.
    if (!automatico || navigator.webdriver) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [automatico]);
  return (
    <div className="no-imprimir sticky top-0 z-10 flex justify-center gap-2 bg-papel/95 p-3 backdrop-blur">
      <Boton onClick={() => window.print()}>{d.imprimir}</Boton>
      <Boton variante="secundario" onClick={() => window.close()}>
        {d.cerrar}
      </Boton>
    </div>
  );
}

export function ReciboBloqueado({ ordenId, mensaje }: { ordenId: string; mensaje: string }) {
  const { ejecutar, modal } = useConAutorizacion();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <p className="text-[17px]">{mensaje}</p>
      <Boton
        onClick={async () => {
          try {
            await ejecutar((autorizacion) =>
              pedir(`/datos/ordenes/${ordenId}/reimpresion`, { cuerpo: { tipo: "recibo", autorizacion } }),
            );
            window.location.reload();
          } catch (e) {
            if (!(e instanceof ErrorApi && e.codigo === "cancelado")) window.location.reload();
          }
        }}
      >
        OK
      </Boton>
      {modal}
    </div>
  );
}
