"use client";

import { useEffect, useMemo, useState } from "react";
import { Aviso, useAvisar } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Casilla, CampoSelector, CampoTexto } from "@/components/ui/campo";
import { MenuTresPuntos } from "@/components/ui/menu-tres-puntos";
import { Modal } from "@/components/ui/modal";
import { pedir } from "@/lib/api";
import { useDatos } from "@/lib/use-datos";
import { aCentavos, aTextoEditable } from "@/lib/dinero";
import { camposDe, textoCampo, textoError } from "@/lib/errores-cliente";
import { fmt, textoBilingue } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import type { UnidadPeso } from "@/lib/peso";

interface Prenda {
  id: string;
  nombreEs: string;
  nombreEn: string | null;
  orden: number;
  activo: boolean;
}
interface Servicio extends Prenda {
  unidad: "pieza" | "libra";
  aplicaImpuesto: boolean;
  diasEntrega: number | null;
}
interface Catalogo {
  prendas: Prenda[];
  servicios: Servicio[];
  precios: { servicioId: string; prendaId: string; precioCents: number }[];
}

type Editando =
  { tipo: "prenda"; datos: Partial<Prenda> } | { tipo: "servicio"; datos: Partial<Servicio> } | null;

export function EditorPrecios({ moneda, unidadPeso }: { moneda: string; unidadPeso: UnidadPeso }) {
  const { d, idioma } = useIdioma();
  const avisar = useAvisar();
  const { datos: cat, error: errorCarga, recargar } = useDatos<Catalogo>("/datos/catalogo");
  const [elegido, setServicioId] = useState<string>("");
  const [borrador, setBorrador] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState<Editando>(null);
  const servicioId = elegido || cat?.servicios[0]?.id || "";
  const cargar = async () => recargar();

  const precioGuardado = useMemo(() => {
    const m = new Map<string, number>();
    cat?.precios.forEach((p) => m.set(`${p.servicioId}|${p.prendaId}`, p.precioCents));
    return m;
  }, [cat]);

  if (!cat)
    return errorCarga ? (
      <Aviso tono="error">{textoError(d, errorCarga)}</Aviso>
    ) : (
      <p className="text-gris">{d.comun.cargando}</p>
    );
  const servicio = cat.servicios.find((s) => s.id === servicioId);
  const nombre = (x: { nombreEs: string; nombreEn: string | null }) =>
    textoBilingue(idioma, x.nombreEs, x.nombreEn);
  const clave = (prendaId: string) => `${servicioId}|${prendaId}`;
  const valor = (prendaId: string) =>
    borrador[clave(prendaId)] ??
    (precioGuardado.has(clave(prendaId)) ? aTextoEditable(precioGuardado.get(clave(prendaId))!) : "");
  const pendientes = Object.entries(borrador).filter(([k, v]) => {
    const g = precioGuardado.get(k);
    return v.trim() === "" ? g !== undefined : aCentavos(v) !== g;
  });
  const invalidos = pendientes.filter(([, v]) => v.trim() !== "" && aCentavos(v) === null).map(([k]) => k);
  const simbolo =
    new Intl.NumberFormat(`${idioma}-US`, { style: "currency", currency: moneda })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? "$";

  async function guardarPrecios() {
    setGuardando(true);
    setError(null);
    try {
      await pedir("/datos/catalogo/precios", {
        metodo: "PUT",
        cuerpo: {
          precios: pendientes.map(([k, v]) => {
            const [s, p] = k.split("|");
            return { servicioId: s, prendaId: p, precioCents: v.trim() === "" ? null : aCentavos(v) };
          }),
        },
      });
      setBorrador({});
      await cargar();
      avisar(d.comun.guardado);
    } catch (e) {
      setError(textoError(d, e));
    } finally {
      setGuardando(false);
    }
  }

  async function alternar(tipo: "prenda" | "servicio", x: Prenda | Servicio) {
    const url = tipo === "prenda" ? `/datos/catalogo/prendas/${x.id}` : `/datos/catalogo/servicios/${x.id}`;
    await pedir(url, { metodo: "PUT", cuerpo: { ...x, activo: !x.activo } });
    await cargar();
  }

  const prendasVisibles = [...cat.prendas].sort(
    (a, b) => Number(b.activo) - Number(a.activo) || a.orden - b.orden,
  );

  return (
    <div className="space-y-4">
      {error && <Aviso tono="error">{error}</Aviso>}
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex w-max gap-2 pb-1" role="tablist">
          {cat.servicios.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === servicioId}
              onClick={() => setServicioId(s.id)}
              className={`rounded-full px-4 py-2 text-[15px] font-semibold ring-1 transition ${
                s.id === servicioId
                  ? "bg-tinta text-white ring-tinta"
                  : "bg-superficie text-noche ring-percha"
              } ${s.activo ? "" : "opacity-60"}`}
            >
              {nombre(s)}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              setEditando({ tipo: "servicio", datos: { unidad: "pieza", aplicaImpuesto: true } })
            }
            className="rounded-full px-4 py-2 text-[15px] font-semibold text-tinta ring-1 ring-dashed ring-tinta/50"
          >
            + {d.ajustes.precios.agregarServicio}
          </button>
        </div>
      </div>

      {servicio && (
        <section className="rounded-3xl bg-superficie ring-1 ring-percha/80">
          <div className="flex items-center justify-between gap-3 border-b border-percha/70 px-5 py-3">
            <div>
              <h2 className="text-[17px] font-bold">{nombre(servicio)}</h2>
              <p className="text-[13px] text-gris">
                {servicio.unidad === "libra" ? d.ajustes.precios.peso[unidadPeso] : d.ajustes.precios.pieza}
                {servicio.aplicaImpuesto ? ` · ${d.ajustes.precios.aplicaImpuesto}` : ""}
                {servicio.activo ? "" : ` · ${d.ajustes.precios.inactiva}`}
              </p>
            </div>
            <MenuTresPuntos
              opciones={[
                {
                  texto: d.ajustes.precios.editarServicio,
                  alElegir: () => setEditando({ tipo: "servicio", datos: servicio }),
                },
                servicio.activo
                  ? {
                      texto: d.ajustes.precios.desactivar,
                      alElegir: () => alternar("servicio", servicio),
                      destructiva: {
                        titulo: fmt(d.ajustes.precios.confirmarOcultar, { nombre: nombre(servicio) }),
                        mensaje: d.ajustes.precios.confirmarOcultarTexto,
                        confirmar: d.ajustes.precios.desactivar,
                      },
                    }
                  : { texto: d.ajustes.precios.activar, alElegir: () => alternar("servicio", servicio) },
              ]}
            />
          </div>
          {servicio.unidad === "libra" ? (
            <div className="p-5">
              <FilaPrecio
                etiqueta={d.ajustes.precios.porPeso[unidadPeso]}
                simbolo={simbolo}
                valor={valor("")}
                invalido={invalidos.includes(clave(""))}
                alCambiar={(v) => setBorrador({ ...borrador, [clave("")]: v })}
              />
            </div>
          ) : (
            <ul className="divide-y divide-percha/60">
              {prendasVisibles.map((p) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-2 px-5 py-2 ${p.activo ? "" : "opacity-55"}`}
                >
                  <div className="min-w-0 flex-1">
                    <FilaPrecio
                      etiqueta={nombre(p)}
                      simbolo={simbolo}
                      valor={valor(p.id)}
                      invalido={invalidos.includes(clave(p.id))}
                      alCambiar={(v) => setBorrador({ ...borrador, [clave(p.id)]: v })}
                    />
                  </div>
                  <MenuTresPuntos
                    opciones={[
                      {
                        texto: d.ajustes.precios.editarPrenda,
                        alElegir: () => setEditando({ tipo: "prenda", datos: p }),
                      },
                      p.activo
                        ? {
                            texto: d.ajustes.precios.desactivar,
                            alElegir: () => alternar("prenda", p),
                            destructiva: {
                              titulo: fmt(d.ajustes.precios.confirmarOcultar, { nombre: nombre(p) }),
                              mensaje: d.ajustes.precios.confirmarOcultarTexto,
                              confirmar: d.ajustes.precios.desactivar,
                            },
                          }
                        : { texto: d.ajustes.precios.activar, alElegir: () => alternar("prenda", p) },
                    ]}
                  />
                </li>
              ))}
              <li className="px-5 py-3">
                <Boton
                  variante="fantasma"
                  tamano="chico"
                  onClick={() => setEditando({ tipo: "prenda", datos: {} })}
                >
                  + {d.ajustes.precios.agregarPrenda}
                </Boton>
              </li>
            </ul>
          )}
        </section>
      )}

      <div className="sticky bottom-20 z-10 flex items-center justify-end gap-3 md:bottom-4">
        {pendientes.length > 0 && (
          <span className="rounded-full bg-alerta-suave px-3 py-1 text-sm font-semibold text-alerta">
            {fmt(d.ajustes.precios.cambiosPendientes, { n: pendientes.length })}
          </span>
        )}
        <Boton
          tamano="grande"
          className="shadow-lg"
          cargando={guardando}
          disabled={!pendientes.length || invalidos.length > 0}
          onClick={guardarPrecios}
        >
          {d.ajustes.precios.guardarPrecios}
        </Boton>
      </div>

      <ModalCatalogo
        editando={editando}
        unidadPeso={unidadPeso}
        alCerrar={() => setEditando(null)}
        alGuardar={async () => {
          setEditando(null);
          await cargar();
        }}
      />
    </div>
  );
}

function FilaPrecio({
  etiqueta,
  simbolo,
  valor,
  invalido,
  alCambiar,
}: {
  etiqueta: string;
  simbolo: string;
  valor: string;
  invalido: boolean;
  alCambiar: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-[15px]">{etiqueta}</span>
      <span
        className={`flex w-32 items-center rounded-xl bg-papel px-3 ring-1 ring-inset focus-within:ring-2 focus-within:ring-tinta ${invalido ? "ring-peligro" : "ring-percha"}`}
      >
        <span className="text-gris">{simbolo}</span>
        <input
          inputMode="decimal"
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          placeholder="—"
          aria-invalid={invalido || undefined}
          className="cifra w-full bg-transparent py-2 pl-1 text-right text-[16px] outline-none"
        />
      </span>
    </label>
  );
}

function ModalCatalogo({
  editando,
  unidadPeso,
  alCerrar,
  alGuardar,
}: {
  editando: Editando;
  unidadPeso: UnidadPeso;
  alCerrar: () => void;
  alGuardar: () => Promise<void>;
}) {
  const { d } = useIdioma();
  const [datos, setDatos] = useState<Record<string, unknown>>({});
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    // Copia local para editar sin tocar la lista hasta guardar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDatos(editando ? { ...editando.datos } : {});
    setCampos({});
    setError(null);
  }, [editando]);

  if (!editando)
    return (
      <Modal abierto={false} alCerrar={alCerrar} titulo="">
        {null}
      </Modal>
    );
  const esServicio = editando.tipo === "servicio";
  const id = datos.id as string | undefined;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    setCampos({});
    const base = esServicio ? "/datos/catalogo/servicios" : "/datos/catalogo/prendas";
    const cuerpo = esServicio
      ? {
          nombreEs: datos.nombreEs ?? "",
          nombreEn: datos.nombreEn ?? "",
          unidad: datos.unidad ?? "pieza",
          aplicaImpuesto: Boolean(datos.aplicaImpuesto),
          diasEntrega:
            datos.diasEntrega === "" || datos.diasEntrega === undefined || datos.diasEntrega === null
              ? null
              : Number(datos.diasEntrega),
          ...(datos.activo !== undefined ? { activo: datos.activo } : {}),
        }
      : {
          nombreEs: datos.nombreEs ?? "",
          nombreEn: datos.nombreEn ?? "",
          ...(datos.activo !== undefined ? { activo: datos.activo } : {}),
        };
    try {
      await pedir(id ? `${base}/${id}` : base, { metodo: id ? "PUT" : "POST", cuerpo });
      await alGuardar();
    } catch (err) {
      setError(textoError(d, err));
      setCampos(camposDe(err));
    } finally {
      setOcupado(false);
    }
  }

  const dp = d.ajustes.precios;
  const titulo = esServicio
    ? id
      ? dp.editarServicio
      : dp.agregarServicio
    : id
      ? dp.editarPrenda
      : dp.agregarPrenda;
  return (
    <Modal
      abierto
      alCerrar={alCerrar}
      titulo={titulo}
      pie={
        <>
          <Boton variante="secundario" onClick={alCerrar}>
            {d.comun.cancelar}
          </Boton>
          <Boton type="submit" form="form-catalogo" cargando={ocupado}>
            {d.comun.guardar}
          </Boton>
        </>
      }
    >
      <form id="form-catalogo" onSubmit={guardar} className="space-y-4" noValidate>
        {error && <Aviso tono="error">{error}</Aviso>}
        <CampoTexto
          etiqueta={dp.nombreEs}
          value={String(datos.nombreEs ?? "")}
          onChange={(e) => setDatos({ ...datos, nombreEs: e.target.value })}
          error={textoCampo(d, campos.nombreEs)}
          autoFocus
        />
        <CampoTexto
          etiqueta={dp.nombreEn}
          value={String(datos.nombreEn ?? "")}
          onChange={(e) => setDatos({ ...datos, nombreEn: e.target.value })}
          error={textoCampo(d, campos.nombreEn)}
          opcional={d.comun.opcional}
        />
        {esServicio && (
          <>
            <CampoSelector
              etiqueta={dp.unidad}
              value={String(datos.unidad ?? "pieza")}
              onChange={(e) => setDatos({ ...datos, unidad: e.target.value })}
              opciones={[
                { valor: "pieza", texto: dp.pieza },
                { valor: "libra", texto: dp.peso[unidadPeso] },
              ]}
            />
            <CampoTexto
              etiqueta={dp.diasEntrega}
              type="number"
              min={0}
              value={
                datos.diasEntrega === null || datos.diasEntrega === undefined ? "" : String(datos.diasEntrega)
              }
              onChange={(e) => setDatos({ ...datos, diasEntrega: e.target.value })}
              error={textoCampo(d, campos.diasEntrega)}
            />
            <Casilla
              etiqueta={dp.aplicaImpuesto}
              checked={Boolean(datos.aplicaImpuesto)}
              onChange={(e) => setDatos({ ...datos, aplicaImpuesto: e.target.checked })}
            />
          </>
        )}
      </form>
    </Modal>
  );
}
