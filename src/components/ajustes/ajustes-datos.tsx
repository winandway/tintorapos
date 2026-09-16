"use client";

import { clasesBoton } from "@/components/ui/boton";
import { Tarjeta, TituloSeccion } from "@/components/ui/encabezado";
import { fmt, formatoFecha } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";

export function AjustesDatos({ zona }: { zona: string }) {
  const { d, idioma } = useIdioma();
  const dd = d.datos;
  const { datos } = useDatos<{
    respaldos: { id: string; bytes: number; filas: number; creado_en: number }[];
  }>("/datos/respaldos");
  const enlaces = [
    { href: "/datos/exportar?formato=json", texto: dd.todoJson },
    { href: "/datos/exportar?formato=csv&tabla=clientes", texto: dd.clientesCsv },
    { href: "/datos/exportar?formato=csv&tabla=ordenes", texto: dd.ordenesCsv },
    { href: "/datos/exportar?formato=csv&tabla=pagos", texto: dd.pagosCsv },
  ];
  return (
    <div className="space-y-4">
      <Tarjeta>
        <TituloSeccion>{dd.exportar}</TituloSeccion>
        <p className="mb-4 text-[15px] text-gris">{dd.exportarTexto}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {enlaces.map((e, i) => (
            <a
              key={e.href}
              href={e.href}
              download
              className={clasesBoton(i === 0 ? "primario" : "secundario", "normal", true)}
            >
              ⤓ {e.texto}
            </a>
          ))}
        </div>
      </Tarjeta>
      <Tarjeta>
        <TituloSeccion>{dd.respaldos}</TituloSeccion>
        <p className="mb-3 text-[15px] text-gris">{dd.respaldosTexto}</p>
        {!datos?.respaldos.length ? (
          <p className="text-gris">{dd.sinRespaldos}</p>
        ) : (
          <ul className="divide-y divide-percha/60 text-[14px]">
            {datos.respaldos.map((r) => (
              <li key={r.id} className="flex justify-between py-2">
                <span>🔒 {formatoFecha(r.creado_en, idioma, zona)}</span>
                <span className="text-gris">
                  {fmt(dd.filas, { n: r.filas })} · {(r.bytes / 1024).toFixed(0)} KB
                </span>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
