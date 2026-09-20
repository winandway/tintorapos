"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoArea, CampoSelector, CampoTexto, Casilla } from "@/components/ui/campo";
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
import { useBorrador } from "@/lib/use-borrador";
import { AvisoBorrador } from "@/components/ui/aviso-borrador";
import { MarcoContabilidad, useRango } from "./marco";

interface Compra {
  id: string;
  fecha: string;
  proveedorId: string | null;
  proveedor: string | null;
  numeroFactura: string | null;
  subtotalCents: number;
  impuestoCents: number;
  totalCents: number;
  pagadoCents: number;
  saldoCents: number;
  notas: string | null;
}
interface Linea {
  insumoId: string;
  descripcion: string;
  cantidad: string;
  costo: string;
}

const lineaVacia = (): Linea => ({ insumoId: "", descripcion: "", cantidad: "1", costo: "" });
const vacio = (hoy: string) => ({
  proveedorId: "",
  numeroFactura: "",
  fecha: hoy,
  impuesto: "",
  pagada: true,
  notas: "",
  lineas: [lineaVacia()],
});

export function PantallaCompras({ moneda, hoy }: { moneda: string; hoy: string }) {
  const { d, idioma } = useIdioma();
  const dc = d.contabilidad.compras;
  const { consulta, control } = useRango();
  const [pendientes, setPendientes] = useState(false);
  const { datos, error, recargar } = useDatos<{
    compras: Compra[];
    totalCents: number;
    porPagarCents: number;
  }>(`/datos/contabilidad/compras?${consulta}${pendientes ? "&pendientes=1" : ""}`);
  const proveedores = useDatos<{ proveedores: { id: string; nombre: string }[] }>(
    "/datos/contabilidad/proveedores",
  );
  const insumos = useDatos<{ insumos: { id: string; nombre: string; unidad: string }[] }>(
    "/datos/contabilidad/insumos",
  );
  const [form, setForm] = useState<ReturnType<typeof vacio> | null>(null);
  const [abono, setAbono] = useState<{ compra: Compra; monto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<unknown>(null);
  // Regla de la casa: lo escrito no se pierde aunque se cierre la ventana.
  const borrador = useBorrador("compra", form, {
    activo: form !== null,
    alRecuperar: (guardado) => setForm(guardado),
  });
  const dinero = (n: number) => formatoDinero(n, moneda, idioma);

  const subtotal = (form?.lineas ?? []).reduce(
    (n, l) => n + Math.round((Number(l.cantidad.replace(",", ".")) || 0) * (aCentavos(l.costo) ?? 0)),
    0,
  );
  const impuesto = form ? (aCentavos(form.impuesto) ?? 0) : 0;
  const total = subtotal + impuesto;

  const guardar = async () => {
    if (!form || total <= 0) return;
    setGuardando(true);
    setFallo(null);
    try {
      await pedir("/datos/contabilidad/compras", {
        cuerpo: {
          compra: {
            proveedorId: form.proveedorId || null,
            numeroFactura: form.numeroFactura || null,
            fecha: form.fecha,
            impuestoCents: impuesto,
            pagadoCents: form.pagada ? total : 0,
            notas: form.notas || null,
            lineas: form.lineas
              .filter((l) => (aCentavos(l.costo) ?? 0) >= 0 && l.descripcion.trim())
              .map((l) => ({
                insumoId: l.insumoId || null,
                descripcion: l.descripcion.trim(),
                cantidad: Number(l.cantidad.replace(",", ".")) || 1,
                costoUnitCents: aCentavos(l.costo) ?? 0,
              })),
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

  const aplicarAbono = async () => {
    if (!abono) return;
    const cents = aCentavos(abono.monto);
    if (!cents) return;
    setGuardando(true);
    setFallo(null);
    try {
      await pedir(`/datos/contabilidad/compras/${abono.compra.id}`, { cuerpo: { montoCents: cents } });
      setAbono(null);
      recargar();
    } catch (e) {
      setFallo(e);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarLinea = (i: number, cambio: Partial<Linea>) => {
    if (!form) return;
    const lineas = form.lineas.map((l, n) => (n === i ? { ...l, ...cambio } : l));
    setForm({ ...form, lineas });
  };

  return (
    <MarcoContabilidad
      titulo={dc.titulo}
      subtitulo={dc.entrada}
      acciones={<Boton onClick={() => setForm(vacio(hoy))}>+ {dc.agregar}</Boton>}
    >
      {control}
      <label className="mb-4 flex items-center gap-2 text-[15px]">
        <input
          type="checkbox"
          checked={pendientes}
          onChange={(e) => setPendientes(e.target.checked)}
          className="size-5 rounded-md border-percha accent-tinta"
        />
        {dc.pendientes}
      </label>
      {error ? (
        <Aviso tono="error">{textoError(d, error)}</Aviso>
      ) : !datos ? (
        <p className="text-gris">{d.comun.cargando}</p>
      ) : (
        <Tarjeta>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <span className="text-[15px] text-gris">{dc.total}</span>
            <span className="numero-ticket text-2xl">{dinero(datos.totalCents)}</span>
            <span className="text-[15px] text-gris">{dc.porPagar}</span>
            <span className={`numero-ticket text-xl ${datos.porPagarCents > 0 ? "text-peligro" : ""}`}>
              {dinero(datos.porPagarCents)}
            </span>
          </div>
          {datos.compras.length === 0 ? (
            <p className="py-6 text-center text-gris">{dc.vacio}</p>
          ) : (
            <ul className="divide-y divide-percha/60">
              {datos.compras.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.proveedor ?? dc.sinProveedor}</p>
                    <p className="truncate text-[13px] text-gris">
                      {[c.fecha, c.numeroFactura, c.notas].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="numero-ticket">{dinero(c.totalCents)}</p>
                    {c.saldoCents > 0 && (
                      <p className="text-[13px] font-semibold text-peligro">
                        {dc.saldo}: {dinero(c.saldoCents)}
                      </p>
                    )}
                  </div>
                  <MenuTresPuntos
                    etiqueta={c.proveedor ?? dc.sinProveedor}
                    opciones={[
                      {
                        texto: dc.abonar,
                        oculta: c.saldoCents <= 0,
                        alElegir: () => setAbono({ compra: c, monto: (c.saldoCents / 100).toFixed(2) }),
                      },
                      {
                        texto: d.comun.eliminar,
                        destructiva: {
                          titulo: dc.confirmarBorrar,
                          mensaje: dc.confirmarBorrarTexto,
                          confirmar: d.comun.eliminar,
                        },
                        alElegir: async () => {
                          await pedir(`/datos/contabilidad/compras/${c.id}`, { metodo: "DELETE" });
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
        titulo={dc.agregar}
        ancho="max-w-2xl"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setForm(null)}>
              {d.comun.cancelar}
            </Boton>
            <Boton onClick={guardar} cargando={guardando} disabled={total <= 0}>
              {d.comun.guardar}
            </Boton>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            {borrador.recuperado && <AvisoBorrador alDescartar={borrador.descartar} />}
            {fallo ? <Aviso tono="error">{textoError(d, fallo)}</Aviso> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <CampoSelector
                etiqueta={dc.proveedor}
                value={form.proveedorId}
                onChange={(e) => setForm({ ...form, proveedorId: e.target.value })}
                opciones={[
                  { valor: "", texto: dc.sinProveedor },
                  ...(proveedores.datos?.proveedores ?? []).map((p) => ({
                    valor: p.id,
                    texto: p.nombre,
                  })),
                ]}
              />
              <CampoTexto
                etiqueta={dc.fecha}
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
              <CampoTexto
                etiqueta={dc.factura}
                opcional={d.comun.opcional}
                value={form.numeroFactura}
                onChange={(e) => setForm({ ...form, numeroFactura: e.target.value })}
              />
              <CampoDinero
                etiqueta={dc.impuesto}
                moneda={moneda}
                valor={form.impuesto}
                alCambiar={(v) => setForm({ ...form, impuesto: v })}
              />
            </div>

            <h3 className="pt-2 text-[15px] font-bold">{dc.lineas}</h3>
            <ul className="space-y-3">
              {form.lineas.map((l, i) => (
                <li key={i} className="rounded-2xl bg-papel p-3">
                  <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
                    <CampoSelector
                      etiqueta={dc.insumo}
                      value={l.insumoId}
                      onChange={(e) => {
                        const insumo = (insumos.datos?.insumos ?? []).find((x) => x.id === e.target.value);
                        cambiarLinea(i, {
                          insumoId: e.target.value,
                          descripcion: insumo ? insumo.nombre : l.descripcion,
                        });
                      }}
                      opciones={[
                        { valor: "", texto: dc.otroConcepto },
                        ...(insumos.datos?.insumos ?? []).map((x) => ({ valor: x.id, texto: x.nombre })),
                      ]}
                    />
                    <CampoTexto
                      etiqueta={dc.cantidad}
                      inputMode="decimal"
                      value={l.cantidad}
                      onChange={(e) => cambiarLinea(i, { cantidad: e.target.value.replace(/[^\d.,]/g, "") })}
                    />
                    <CampoDinero
                      etiqueta={dc.costoUnit}
                      moneda={moneda}
                      valor={l.costo}
                      alCambiar={(v) => cambiarLinea(i, { costo: v })}
                    />
                  </div>
                  {!l.insumoId && (
                    <CampoTexto
                      etiqueta={dc.descripcion}
                      className="mt-2"
                      value={l.descripcion}
                      onChange={(e) => cambiarLinea(i, { descripcion: e.target.value })}
                    />
                  )}
                  {form.lineas.length > 1 && (
                    <Boton
                      tamano="chico"
                      variante="fantasma"
                      className="mt-2"
                      onClick={() => setForm({ ...form, lineas: form.lineas.filter((_, n) => n !== i) })}
                    >
                      {dc.quitar}
                    </Boton>
                  )}
                </li>
              ))}
            </ul>
            <Boton
              tamano="chico"
              variante="secundario"
              onClick={() => setForm({ ...form, lineas: [...form.lineas, lineaVacia()] })}
            >
              + {dc.agregarLinea}
            </Boton>

            <dl className="space-y-1 border-t border-percha/60 pt-3 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-gris">{dc.subtotal}</dt>
                <dd className="numero-ticket">{dinero(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-[17px] font-bold">
                <dt>{dc.total}</dt>
                <dd className="numero-ticket">{dinero(total)}</dd>
              </div>
            </dl>
            <Casilla
              etiqueta={dc.pagado}
              checked={form.pagada}
              onChange={(e) => setForm({ ...form, pagada: e.target.checked })}
            />
            <CampoArea
              etiqueta={dc.notas}
              opcional={d.comun.opcional}
              rows={2}
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
            />
          </div>
        )}
      </Modal>

      <Modal
        abierto={abono !== null}
        alCerrar={() => setAbono(null)}
        titulo={dc.abonar}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setAbono(null)}>
              {d.comun.cancelar}
            </Boton>
            <Boton onClick={aplicarAbono} cargando={guardando}>
              {d.comun.guardar}
            </Boton>
          </>
        }
      >
        {abono && (
          <div className="space-y-3">
            {fallo ? <Aviso tono="error">{textoError(d, fallo)}</Aviso> : null}
            <p className="text-[15px] text-gris">{dc.abonarTexto}</p>
            <CampoDinero
              etiqueta={dc.abonar}
              moneda={moneda}
              valor={abono.monto}
              alCambiar={(v) => setAbono({ ...abono, monto: v })}
            />
          </div>
        )}
      </Modal>
    </MarcoContabilidad>
  );
}
