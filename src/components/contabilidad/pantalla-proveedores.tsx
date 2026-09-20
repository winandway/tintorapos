"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoArea, CampoTexto, Casilla } from "@/components/ui/campo";
import { Tarjeta } from "@/components/ui/encabezado";
import { MenuTresPuntos } from "@/components/ui/menu-tres-puntos";
import { Modal } from "@/components/ui/modal";
import { pedir } from "@/lib/api";
import { textoError } from "@/lib/errores-cliente";
import { fmt, formatoDinero } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";
import { useBorrador } from "@/lib/use-borrador";
import { AvisoBorrador } from "@/components/ui/aviso-borrador";
import { MarcoContabilidad } from "./marco";

interface Proveedor {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  contacto: string | null;
  terminosDias: number;
  notas: string | null;
  activo: boolean;
  compradoCents: number;
  porPagarCents: number;
}

const vacio = () => ({
  id: null as string | null,
  nombre: "",
  contacto: "",
  telefono: "",
  correo: "",
  terminosDias: "0",
  notas: "",
  activo: true,
});

export function PantallaProveedores({ moneda }: { moneda: string }) {
  const { d, idioma } = useIdioma();
  const dp = d.contabilidad.proveedores;
  const { datos, error, recargar } = useDatos<{ proveedores: Proveedor[] }>(
    "/datos/contabilidad/proveedores",
  );
  const [form, setForm] = useState<ReturnType<typeof vacio> | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<unknown>(null);
  // Regla de la casa: lo escrito no se pierde aunque se cierre la ventana.
  const borrador = useBorrador("proveedor", form, {
    activo: form !== null,
    alRecuperar: (guardado) => setForm(guardado),
  });
  const dinero = (n: number) => formatoDinero(n, moneda, idioma);

  const guardar = async () => {
    if (!form || form.nombre.trim().length < 2) return;
    setGuardando(true);
    setFallo(null);
    try {
      await pedir(
        form.id ? `/datos/contabilidad/proveedores/${form.id}` : "/datos/contabilidad/proveedores",
        {
          metodo: form.id ? "PUT" : "POST",
          cuerpo: {
            proveedor: {
              nombre: form.nombre.trim(),
              contacto: form.contacto || null,
              telefono: form.telefono || null,
              correo: form.correo || "",
              terminosDias: Number(form.terminosDias) || 0,
              notas: form.notas || null,
              activo: form.activo,
            },
          },
        },
      );
      borrador.olvidar();
      setForm(null);
      recargar();
    } catch (e) {
      setFallo(e);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <MarcoContabilidad
      titulo={dp.titulo}
      subtitulo={dp.entrada}
      acciones={<Boton onClick={() => setForm(vacio())}>+ {dp.agregar}</Boton>}
    >
      {error ? (
        <Aviso tono="error">{textoError(d, error)}</Aviso>
      ) : !datos ? (
        <p className="text-gris">{d.comun.cargando}</p>
      ) : datos.proveedores.length === 0 ? (
        <Tarjeta>
          <p className="py-6 text-center text-gris">{dp.vacio}</p>
        </Tarjeta>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {datos.proveedores.map((p) => (
            <Tarjeta key={p.id} className={p.activo ? "" : "opacity-60"}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[17px] font-bold">{p.nombre}</h2>
                  <p className="truncate text-[14px] text-gris">
                    {[p.contacto, p.telefono, p.correo].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <dl className="mt-3 flex gap-6 text-[14px]">
                    <div>
                      <dt className="text-gris">{dp.comprado}</dt>
                      <dd className="numero-ticket">{dinero(p.compradoCents)}</dd>
                    </div>
                    <div>
                      <dt className="text-gris">{dp.porPagar}</dt>
                      <dd className={`numero-ticket ${p.porPagarCents > 0 ? "text-peligro" : ""}`}>
                        {dinero(p.porPagarCents)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gris">{dp.terminos}</dt>
                      <dd className="numero-ticket">{p.terminosDias}</dd>
                    </div>
                  </dl>
                </div>
                <MenuTresPuntos
                  etiqueta={p.nombre}
                  opciones={[
                    {
                      texto: dp.editar,
                      alElegir: () =>
                        setForm({
                          id: p.id,
                          nombre: p.nombre,
                          contacto: p.contacto ?? "",
                          telefono: p.telefono ?? "",
                          correo: p.correo ?? "",
                          terminosDias: String(p.terminosDias),
                          notas: p.notas ?? "",
                          activo: p.activo,
                        }),
                    },
                    {
                      texto: d.comun.eliminar,
                      destructiva: {
                        titulo: fmt(dp.confirmarBorrar, { nombre: p.nombre }),
                        mensaje: dp.confirmarBorrarTexto,
                        confirmar: d.comun.eliminar,
                      },
                      alElegir: async () => {
                        await pedir(`/datos/contabilidad/proveedores/${p.id}`, { metodo: "DELETE" });
                        recargar();
                      },
                    },
                  ]}
                />
              </div>
            </Tarjeta>
          ))}
        </div>
      )}

      <Modal
        abierto={form !== null}
        alCerrar={() => setForm(null)}
        titulo={form?.id ? dp.editar : dp.agregar}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setForm(null)}>
              {d.comun.cancelar}
            </Boton>
            <Boton onClick={guardar} cargando={guardando} disabled={!form || form.nombre.trim().length < 2}>
              {d.comun.guardar}
            </Boton>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            {borrador.recuperado && <AvisoBorrador alDescartar={borrador.descartar} />}
            {fallo ? <Aviso tono="error">{textoError(d, fallo)}</Aviso> : null}
            <CampoTexto
              etiqueta={dp.nombre}
              placeholder={dp.nombrePlaceholder}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <CampoTexto
              etiqueta={dp.contacto}
              opcional={d.comun.opcional}
              value={form.contacto}
              onChange={(e) => setForm({ ...form, contacto: e.target.value })}
            />
            <CampoTexto
              etiqueta={dp.telefono}
              opcional={d.comun.opcional}
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
            <CampoTexto
              etiqueta={dp.correo}
              opcional={d.comun.opcional}
              type="email"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
            />
            <CampoTexto
              etiqueta={dp.terminos}
              ayuda={dp.terminosAyuda}
              inputMode="numeric"
              value={form.terminosDias}
              onChange={(e) => setForm({ ...form, terminosDias: e.target.value.replace(/\D/g, "") })}
            />
            <CampoArea
              etiqueta={dp.notas}
              opcional={d.comun.opcional}
              rows={2}
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
            />
            <Casilla
              etiqueta={dp.activo}
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
          </div>
        )}
      </Modal>
    </MarcoContabilidad>
  );
}
