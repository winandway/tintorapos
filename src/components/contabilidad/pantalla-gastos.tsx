"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoArea, CampoSelector, CampoTexto } from "@/components/ui/campo";
import { CampoDinero } from "@/components/ui/campo-dinero";
import { Tarjeta } from "@/components/ui/encabezado";
import { MenuTresPuntos } from "@/components/ui/menu-tres-puntos";
import { Modal } from "@/components/ui/modal";
import { pedir } from "@/lib/api";
import { aCentavos } from "@/lib/dinero";
import { textoError } from "@/lib/errores-cliente";
import { formatoDinero } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";
import { CATEGORIAS, nombreCategoria } from "./categorias-cliente";
import { MarcoContabilidad, useRango } from "./marco";

interface Gasto {
  id: string;
  fecha: string;
  categoria: string;
  proveedorId: string | null;
  proveedor: string | null;
  empleadoId: string | null;
  empleado: string | null;
  compraId: string | null;
  descripcion: string | null;
  montoCents: number;
  metodoPago: string;
  referencia: string | null;
}

const METODOS = ["efectivo", "tarjeta", "transferencia", "cheque", "credito"] as const;
type Metodo = (typeof METODOS)[number];

const vacio = (hoy: string) => ({
  id: null as string | null,
  fecha: hoy,
  categoria: "renta",
  proveedorId: "",
  empleadoId: "",
  descripcion: "",
  monto: "",
  metodoPago: "efectivo" as Metodo,
  referencia: "",
});

export function PantallaGastos({
  moneda,
  hoy,
  empleados,
}: {
  moneda: string;
  hoy: string;
  empleados: { id: string; nombre: string }[];
}) {
  const { d, idioma } = useIdioma();
  const dc = d.contabilidad;
  const dg = dc.gastos;
  const { consulta, control } = useRango();
  const { datos, error, recargar } = useDatos<{ gastos: Gasto[]; totalCents: number }>(
    `/datos/contabilidad/gastos?${consulta}`,
  );
  const proveedores = useDatos<{ proveedores: { id: string; nombre: string }[] }>(
    "/datos/contabilidad/proveedores",
  );
  const [form, setForm] = useState<ReturnType<typeof vacio> | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<unknown>(null);
  const dinero = (n: number) => formatoDinero(n, moneda, idioma);
  const cents = form ? aCentavos(form.monto) : null;

  const guardar = async () => {
    if (!form || !cents) return;
    setGuardando(true);
    setFallo(null);
    try {
      await pedir(form.id ? `/datos/contabilidad/gastos/${form.id}` : "/datos/contabilidad/gastos", {
        metodo: form.id ? "PUT" : "POST",
        cuerpo: {
          gasto: {
            fecha: form.fecha,
            categoria: form.categoria,
            proveedorId: form.proveedorId || null,
            empleadoId: form.empleadoId || null,
            descripcion: form.descripcion || null,
            montoCents: cents,
            metodoPago: form.metodoPago,
            referencia: form.referencia || null,
          },
        },
      });
      setForm(null);
      recargar();
    } catch (e) {
      setFallo(e);
    } finally {
      setGuardando(false);
    }
  };

  const opcionesProveedor = [
    { valor: "", texto: dg.ninguno },
    ...(proveedores.datos?.proveedores ?? []).map((p) => ({ valor: p.id, texto: p.nombre })),
  ];

  return (
    <MarcoContabilidad
      titulo={dg.titulo}
      subtitulo={dg.entrada}
      acciones={<Boton onClick={() => setForm(vacio(hoy))}>+ {dg.agregar}</Boton>}
    >
      {control}
      {error ? (
        <Aviso tono="error">{textoError(d, error)}</Aviso>
      ) : !datos ? (
        <p className="text-gris">{d.comun.cargando}</p>
      ) : (
        <Tarjeta>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <span className="text-[15px] text-gris">{dg.total}</span>
            <span className="numero-ticket text-2xl" data-testid="gastos-total">
              {dinero(datos.totalCents)}
            </span>
          </div>
          {datos.gastos.length === 0 ? (
            <p className="py-6 text-center text-gris">{dg.vacio}</p>
          ) : (
            <ul className="divide-y divide-percha/60">
              {datos.gastos.map((g) => (
                <li key={g.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{nombreCategoria(g.categoria, idioma)}</p>
                    <p className="truncate text-[13px] text-gris">
                      {[g.fecha, g.proveedor, g.empleado, g.descripcion, g.compraId ? dg.deCompra : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="numero-ticket shrink-0">{dinero(g.montoCents)}</span>
                  <MenuTresPuntos
                    etiqueta={nombreCategoria(g.categoria, idioma)}
                    opciones={[
                      {
                        texto: dg.editar,
                        oculta: Boolean(g.compraId),
                        alElegir: () =>
                          setForm({
                            id: g.id,
                            fecha: g.fecha,
                            categoria: g.categoria,
                            proveedorId: g.proveedorId ?? "",
                            empleadoId: g.empleadoId ?? "",
                            descripcion: g.descripcion ?? "",
                            monto: (g.montoCents / 100).toFixed(2),
                            metodoPago: (METODOS as readonly string[]).includes(g.metodoPago)
                              ? (g.metodoPago as Metodo)
                              : "efectivo",
                            referencia: g.referencia ?? "",
                          }),
                      },
                      {
                        texto: d.comun.eliminar,
                        oculta: Boolean(g.compraId),
                        destructiva: {
                          titulo: dg.confirmarBorrar,
                          mensaje: dg.confirmarBorrarTexto,
                          confirmar: d.comun.eliminar,
                        },
                        alElegir: async () => {
                          await pedir(`/datos/contabilidad/gastos/${g.id}`, { metodo: "DELETE" });
                          recargar();
                        },
                      },
                    ]}
                  />
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      )}

      <Modal
        abierto={form !== null}
        alCerrar={() => setForm(null)}
        titulo={form?.id ? dg.editar : dg.agregar}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setForm(null)}>
              {d.comun.cancelar}
            </Boton>
            <Boton onClick={guardar} cargando={guardando} disabled={!cents}>
              {d.comun.guardar}
            </Boton>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            {fallo ? <Aviso tono="error">{textoError(d, fallo)}</Aviso> : null}
            <CampoTexto
              etiqueta={dg.fecha}
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
            <CampoSelector
              etiqueta={dg.categoria}
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              opciones={CATEGORIAS.map((c) => ({ valor: c.clave, texto: c[idioma] }))}
            />
            <CampoDinero
              etiqueta={dg.monto}
              moneda={moneda}
              valor={form.monto}
              alCambiar={(v) => setForm({ ...form, monto: v })}
            />
            <CampoSelector
              etiqueta={dg.metodo}
              value={form.metodoPago}
              onChange={(e) => setForm({ ...form, metodoPago: e.target.value as Metodo })}
              opciones={METODOS.map((m) => ({ valor: m, texto: dg.metodos[m] }))}
            />
            <CampoSelector
              etiqueta={dg.proveedor}
              value={form.proveedorId}
              onChange={(e) => setForm({ ...form, proveedorId: e.target.value })}
              opciones={opcionesProveedor}
            />
            {empleados.length > 0 && (
              <CampoSelector
                etiqueta={dg.empleado}
                value={form.empleadoId}
                onChange={(e) => setForm({ ...form, empleadoId: e.target.value })}
                opciones={[
                  { valor: "", texto: dg.ninguno },
                  ...empleados.map((x) => ({ valor: x.id, texto: x.nombre })),
                ]}
              />
            )}
            <CampoArea
              etiqueta={dg.descripcion}
              opcional={d.comun.opcional}
              rows={2}
              placeholder={dg.descripcionPlaceholder}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
            <CampoTexto
              etiqueta={dg.referencia}
              opcional={d.comun.opcional}
              value={form.referencia}
              onChange={(e) => setForm({ ...form, referencia: e.target.value })}
            />
          </div>
        )}
      </Modal>
    </MarcoContabilidad>
  );
}
