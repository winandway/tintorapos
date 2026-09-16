"use client";

import { useCallback, useEffect, useState } from "react";
import { Boton } from "@/components/ui/boton";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { MenuTresPuntos } from "@/components/ui/menu-tres-puntos";
import { formatoFecha } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { operaciones, type OperacionLocal } from "@/lib/sin-conexion/almacen";
import { descartarOperacion, EVENTO_COLA, sincronizar } from "@/lib/sin-conexion/cola";

export function PantallaPendientes({ zona }: { zona: string }) {
  const { d, idioma } = useIdioma();
  const ds = d.sinConexion;
  const [lista, setLista] = useState<OperacionLocal[] | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = useCallback(() => {
    operaciones()
      .then(setLista)
      .catch(() => setLista([]));
  }, []);

  useEffect(() => {
    cargar();
    window.addEventListener(EVENTO_COLA, cargar);
    return () => window.removeEventListener(EVENTO_COLA, cargar);
  }, [cargar]);

  return (
    <div className="mx-auto max-w-3xl">
      <EncabezadoPagina
        titulo={ds.titulo}
        subtitulo={ds.subtitulo}
        acciones={
          <Boton
            cargando={subiendo}
            disabled={!lista?.length}
            onClick={async () => {
              setSubiendo(true);
              try {
                await sincronizar();
              } finally {
                setSubiendo(false);
              }
            }}
          >
            {ds.subirAhora}
          </Boton>
        }
      />
      {!lista ? (
        <p className="text-gris">{d.comun.cargando}</p>
      ) : lista.length === 0 ? (
        <p className="rounded-3xl bg-superficie p-6 text-center text-gris ring-1 ring-percha/80">
          {ds.vacio}
        </p>
      ) : (
        <ul className="divide-y divide-percha/60 overflow-hidden rounded-3xl bg-superficie ring-1 ring-percha/80">
          {lista.map((op) => (
            <li key={op.id} className="flex items-center gap-3 px-5 py-3">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {ds.tipos[op.tipo]}
                  {typeof op.resumen?.cliente === "string" ? ` · ${op.resumen.cliente}` : ""}
                </span>
                <span className="block text-[13px] text-gris">{formatoFecha(op.creadoEn, idioma, zona)}</span>
                <span
                  className={`block text-[13px] font-semibold ${op.error ? "text-peligro" : "text-alerta"}`}
                >
                  {op.error ? op.error.mensaje : ds.pendiente}
                </span>
              </span>
              {op.error && (
                <MenuTresPuntos
                  opciones={[
                    {
                      texto: ds.descartar,
                      alElegir: () => descartarOperacion(op.id),
                      destructiva: {
                        titulo: ds.confirmarDescartar,
                        mensaje: ds.confirmarDescartarTexto,
                        confirmar: ds.descartar,
                      },
                    },
                  ]}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
