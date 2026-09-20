"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoSelector, CampoTexto, Casilla } from "@/components/ui/campo";
import { CampoDinero } from "@/components/ui/campo-dinero";
import { Tarjeta } from "@/components/ui/encabezado";
import { MenuTresPuntos } from "@/components/ui/menu-tres-puntos";
import { Modal } from "@/components/ui/modal";
import { pedir } from "@/lib/api";
import { aCentavos } from "@/lib/dinero";
import { textoError } from "@/lib/errores-cliente";
import { fmt, formatoDinero } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";
import { useBorrador } from "@/lib/use-borrador";
import { AvisoBorrador } from "@/components/ui/aviso-borrador";
import { MarcoContabilidad } from "./marco";

interface Insumo {
  id: string;
  nombre: string;
  unidad: string;
  existencia: number;
  minimo: number;
  costoUnitCents: number;
  proveedorId: string | null;
  proveedor: string | null;
  activo: boolean;
  bajo: boolean;
}

const vacio = () => ({
  id: null as string | null,
  nombre: "",
  unidad: "",
  minimo: "0",
  costo: "",
  proveedorId: "",
  activo: true,
});

export function PantallaInsumos({ moneda }: { moneda: string }) {
  const { d, idioma } = useIdioma();
  const di = d.contabilidad.insumos;
  const { datos, error, recargar } = useDatos<{ insumos: Insumo[] }>("/datos/contabilidad/insumos");
  const proveedores = useDatos<{ proveedores: { id: string; nombre: string }[] }>(
    "/datos/contabilidad/proveedores",
  );
  const [form, setForm] = useState<ReturnType<typeof vacio> | null>(null);
  const [mover, setMover] = useState<{ insumo: Insumo; cantidad: string; motivo: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<unknown>(null);
  // Regla de la casa: lo escrito no se pierde aunque se cierre la ventana.
  const borrador = useBorrador("insumo", form, {
    activo: form !== null,
    alRecuperar: (guardado) => setForm(guardado),
  });
  const [nota, setNota] = useState<string | null>(null);
  const dinero = (n: number) => formatoDinero(n, moneda, idioma);

  const guardar = async () => {
    if (!form || form.nombre.trim().length < 2) return;
    setGuardando(true);
    setFallo(null);
    try {
      await pedir(form.id ? `/datos/contabilidad/insumos/${form.id}` : "/datos/contabilidad/insumos", {
        metodo: form.id ? "PUT" : "POST",
        cuerpo: {
          insumo: {
            nombre: form.nombre.trim(),
            unidad: form.unidad.trim() || "unidad",
            minimo: Number(form.minimo) || 0,
            costoUnitCents: aCentavos(form.costo) ?? 0,
            proveedorId: form.proveedorId || null,
            activo: form.activo,
          },
        },
      });
      borrador.olvidar();
      setForm(null);
      recargar();
    } catch (e) {
      setFallo(e);
    } finally {
      setGuardando(false);
    }
  };

  const aplicarMovimiento = async () => {
    if (!mover) return;
    const cantidad = Number(mover.cantidad.replace(",", "."));
    if (!cantidad) return;
    setGuardando(true);
    setFallo(null);
    try {
      await pedir(`/datos/contabilidad/insumos/${mover.insumo.id}`, {
        metodo: "POST",
        cuerpo: { cantidad, motivo: mover.motivo || undefined, tipo: cantidad < 0 ? "consumo" : "ajuste" },
      });
      setMover(null);
      recargar();
    } catch (e) {
      setFallo(e);
    } finally {
      setGuardando(false);
    }
  };

  const agregarEstandar = async () => {
    const r = await pedir<{ creados: number }>("/datos/contabilidad/insumos", {
      metodo: "POST",
      cuerpo: { estandar: true },
    });
    setNota(r.creados ? fmt(di.estandarListo, { n: r.creados }) : di.estandarNada);
    recargar();
  };

  return (
    <MarcoContabilidad
      titulo={di.titulo}
      subtitulo={di.entrada}
      acciones={
        <>
          <Boton variante="secundario" onClick={agregarEstandar}>
            {di.estandar}
          </Boton>
          <Boton onClick={() => setForm(vacio())}>+ {di.agregar}</Boton>
        </>
      }
    >
      {nota && <Aviso tono="ok">{nota}</Aviso>}
      {error ? (
        <Aviso tono="error">{textoError(d, error)}</Aviso>
      ) : !datos ? (
        <p className="text-gris">{d.comun.cargando}</p>
      ) : datos.insumos.length === 0 ? (
        <Tarjeta>
          <p className="py-6 text-center text-gris">{di.vacio}</p>
          <p className="text-center text-[14px] text-gris">{di.estandarAyuda}</p>
        </Tarjeta>
      ) : (
        <Tarjeta>
          <ul className="divide-y divide-percha/60">
            {datos.insumos.map((i) => (
              <li key={i.id} className={`flex items-center gap-3 py-3 ${i.activo ? "" : "opacity-60"}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {i.nombre}
                    {i.bajo && (
                      <span className="ml-2 rounded-full bg-alerta-suave px-2 py-0.5 text-[12px] font-bold text-alerta">
                        {di.bajo}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[13px] text-gris">
                    {[
                      `${di.existencia}: ${i.existencia} ${i.unidad}`,
                      i.minimo > 0 ? `${di.minimo} ${i.minimo}` : null,
                      i.costoUnitCents ? `${dinero(i.costoUnitCents)}/${i.unidad}` : null,
                      i.proveedor,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Boton
                  tamano="chico"
                  variante="secundario"
                  onClick={() => setMover({ insumo: i, cantidad: "", motivo: "" })}
                >
                  {di.mover}
                </Boton>
                <MenuTresPuntos
                  etiqueta={i.nombre}
                  opciones={[
                    {
                      texto: di.editar,
                      alElegir: () =>
                        setForm({
                          id: i.id,
                          nombre: i.nombre,
                          unidad: i.unidad,
                          minimo: String(i.minimo),
                          costo: i.costoUnitCents ? (i.costoUnitCents / 100).toFixed(2) : "",
                          proveedorId: i.proveedorId ?? "",
                          activo: i.activo,
                        }),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      <Modal
        abierto={form !== null}
        alCerrar={() => setForm(null)}
        titulo={form?.id ? di.editar : di.agregar}
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
              etiqueta={di.nombre}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <CampoTexto
              etiqueta={di.unidad}
              placeholder={di.unidadPlaceholder}
              value={form.unidad}
              onChange={(e) => setForm({ ...form, unidad: e.target.value })}
            />
            <CampoTexto
              etiqueta={di.minimo}
              inputMode="decimal"
              value={form.minimo}
              onChange={(e) => setForm({ ...form, minimo: e.target.value.replace(/[^\d.,]/g, "") })}
            />
            <CampoDinero
              etiqueta={di.costo}
              moneda={moneda}
              valor={form.costo}
              alCambiar={(v) => setForm({ ...form, costo: v })}
            />
            <CampoSelector
              etiqueta={di.proveedor}
              value={form.proveedorId}
              onChange={(e) => setForm({ ...form, proveedorId: e.target.value })}
              opciones={[
                { valor: "", texto: d.contabilidad.gastos.ninguno },
                ...(proveedores.datos?.proveedores ?? []).map((p) => ({ valor: p.id, texto: p.nombre })),
              ]}
            />
            <Casilla
              etiqueta={di.activo}
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
          </div>
        )}
      </Modal>

      <Modal
        abierto={mover !== null}
        alCerrar={() => setMover(null)}
        titulo={mover ? `${di.mover}: ${mover.insumo.nombre}` : ""}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setMover(null)}>
              {d.comun.cancelar}
            </Boton>
            <Boton onClick={aplicarMovimiento} cargando={guardando}>
              {d.comun.guardar}
            </Boton>
          </>
        }
      >
        {mover && (
          <div className="space-y-3">
            {fallo ? <Aviso tono="error">{textoError(d, fallo)}</Aviso> : null}
            <p className="text-[15px] text-gris">{di.moverTexto}</p>
            <CampoTexto
              etiqueta={di.cantidad}
              inputMode="decimal"
              value={mover.cantidad}
              onChange={(e) => setMover({ ...mover, cantidad: e.target.value.replace(/[^\d.,-]/g, "") })}
            />
            <CampoTexto
              etiqueta={di.motivo}
              opcional={d.comun.opcional}
              placeholder={di.motivoPlaceholder}
              value={mover.motivo}
              onChange={(e) => setMover({ ...mover, motivo: e.target.value })}
            />
          </div>
        )}
      </Modal>
    </MarcoContabilidad>
  );
}
