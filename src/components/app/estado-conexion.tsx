"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { refrescarDatosSinConexion } from "@/lib/sin-conexion/cache";
import { estadoCola, EVENTO_COLA, sincronizar, type EstadoCola } from "@/lib/sin-conexion/cola";
import { useEnLinea } from "@/lib/sin-conexion/use-en-linea";

/**
 * Indicador de conexión y motor de sincronización: sube la cola al volver
 * internet (y cada 30 s) y refresca la copia local cada 5 minutos.
 */
export function EstadoConexion({ copiaLocal }: { copiaLocal: boolean }) {
  const { d } = useIdioma();
  const enLinea = useEnLinea();
  const [cola, setCola] = useState<EstadoCola>({ pendientes: 0, conError: 0 });
  const [sesionVencida, setSesionVencida] = useState(false);

  useEffect(() => {
    let vivo = true;
    const actualizar = () =>
      estadoCola()
        .then((e) => vivo && setCola(e))
        .catch(() => {});
    const subir = async () => {
      if (!navigator.onLine) return;
      try {
        const r = await sincronizar();
        if (vivo) setSesionVencida(r.sesionVencida);
      } catch {
        // Se reintenta en la próxima vuelta.
      }
    };
    const refrescar = () => {
      if (copiaLocal && navigator.onLine) refrescarDatosSinConexion().catch(() => {});
    };
    // En cuanto algo entra a la cola se intenta subir, sin esperar al reloj.
    const alCambiarCola = () => {
      void actualizar();
      void subir().then(actualizar);
    };
    void actualizar();
    void subir().then(refrescar);
    window.addEventListener(EVENTO_COLA, alCambiarCola);
    window.addEventListener("online", subir);
    const reloj = setInterval(subir, 30_000);
    const relojCopia = setInterval(refrescar, 5 * 60_000);
    return () => {
      vivo = false;
      window.removeEventListener(EVENTO_COLA, alCambiarCola);
      window.removeEventListener("online", subir);
      clearInterval(reloj);
      clearInterval(relojCopia);
    };
  }, [copiaLocal]);

  if (cola.conError > 0 || sesionVencida) {
    return (
      <Link
        href="/app/pendientes"
        className="flex items-center gap-1.5 rounded-full bg-peligro-suave px-2.5 py-1 text-xs font-bold text-peligro"
        role="status"
      >
        <span className="size-2 rounded-full bg-peligro" />
        {sesionVencida ? d.sinConexion.entrarDeNuevo : fmt(d.sinConexion.porRevisar, { n: cola.conError })}
      </Link>
    );
  }
  if (!enLinea || cola.pendientes > 0) {
    return (
      <Link
        href="/app/pendientes"
        className="flex items-center gap-1.5 rounded-full bg-alerta-suave px-2.5 py-1 text-xs font-bold text-alerta"
        role="status"
        data-testid="estado-conexion"
      >
        <span className={`size-2 rounded-full bg-alerta ${enLinea ? "animate-pulse" : ""}`} />
        {!enLinea ? d.comun.sinConexion : d.comun.sincronizando}
        {cola.pendientes > 0 && ` · ${cola.pendientes}`}
      </Link>
    );
  }
  return null;
}
