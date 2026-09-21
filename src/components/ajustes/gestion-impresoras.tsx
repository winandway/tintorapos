"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoSelector, Casilla } from "@/components/ui/campo";
import { Tarjeta, TituloSeccion } from "@/components/ui/encabezado";
import { MenuTresPuntos } from "@/components/ui/menu-tres-puntos";
import {
  BAUDIOS,
  elegirSerie,
  elegirUsb,
  ErrorImpresora,
  guardarImpresora,
  leerImpresora,
  mandarAImpresora,
  soporteDelEquipo,
  type ImpresoraGuardada,
  type PuestoImpresora,
} from "@/lib/impresion/conexion";
import { LENGUAJES_ETIQUETA, TAMANOS_ETIQUETA, type TamanoEtiqueta } from "@/lib/impresion/etiquetas";
import { bytesDeEtiquetas, etiquetaDePrueba, reciboDePrueba } from "@/lib/impresion/imprimir";
import { reciboAEscPos } from "@/lib/impresion/recibo";
import { useIdioma } from "@/lib/i18n/cliente";

type Soporte = ReturnType<typeof soporteDelEquipo>;
type ModoEtiquetas = "navegador" | "recibos" | "directa";

const BASE: Omit<ImpresoraGuardada, "camino" | "nombre"> = { ancho: 48, cortar: true, abrirCajon: false };

/**
 * Las impresoras se conectan POR EQUIPO: la computadora del mostrador tiene las
 * suyas y el celular del dueño no. Cada equipo puede tener dos: la de recibos y
 * la de etiquetas (que puede ser la misma de recibos).
 */
export function GestionImpresoras({ tienda }: { tienda: string }) {
  const { d } = useIdioma();
  const di = d.impresion.impresoras;
  const [soporte, setSoporte] = useState<Soporte | null>(null);
  const [recibos, setRecibos] = useState<ImpresoraGuardada | null>(null);
  const [etiquetas, setEtiquetas] = useState<ImpresoraGuardada | null>(null);
  const [ocupado, setOcupado] = useState<PuestoImpresora | null>(null);
  const [aviso, setAviso] = useState<{ puesto: PuestoImpresora; tono: "ok" | "error"; texto: string } | null>(
    null,
  );

  // Lo que sabe hacer este equipo se averigua en el navegador, no en el servidor.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSoporte(soporteDelEquipo());
    setRecibos(leerImpresora("recibos"));
    setEtiquetas(leerImpresora("etiquetas"));
  }, []);

  const guardar = (puesto: PuestoImpresora, i: ImpresoraGuardada | null) => {
    guardarImpresora(i, puesto);
    if (puesto === "recibos") setRecibos(i);
    else setEtiquetas(i);
  };

  const fallo = (puesto: PuestoImpresora, e: unknown) => {
    const codigo = e instanceof ErrorImpresora ? e.codigo : "desconocido";
    if (codigo !== "cancelado") setAviso({ puesto, tono: "error", texto: di.errores[codigo] });
  };

  const conectar = async (puesto: PuestoImpresora, camino: "usb" | "serie") => {
    setAviso(null);
    setOcupado(puesto);
    try {
      const elegida = camino === "usb" ? await elegirUsb() : await elegirSerie();
      const anterior = puesto === "recibos" ? recibos : etiquetas;
      guardar(puesto, {
        ...BASE,
        ...(anterior ?? {}),
        camino,
        nombre: elegida.nombre,
        vendorId: elegida.vendorId,
        productId: elegida.productId,
        baudios: camino === "serie" ? (anterior?.baudios ?? 9600) : undefined,
        ...(puesto === "etiquetas"
          ? { lenguaje: anterior?.lenguaje ?? "tspl", tamano: anterior?.tamano ?? "2x1" }
          : {}),
      });
    } catch (e) {
      fallo(puesto, e);
    } finally {
      setOcupado(null);
    }
  };

  const probar = async (puesto: PuestoImpresora) => {
    const impresora = puesto === "recibos" ? recibos : etiquetas;
    if (!impresora) return;
    setAviso(null);
    setOcupado(puesto);
    try {
      const bytes =
        puesto === "recibos"
          ? reciboAEscPos(reciboDePrueba(tienda, di.reciboPrueba, di.reciboPruebaTexto), {
              ancho: impresora.ancho,
              cortar: impresora.cortar,
            })
          : bytesDeEtiquetas(
              etiquetaDePrueba({ pieza: di.pruebaPieza, prenda: di.pruebaPrenda, cliente: tienda }),
              impresora,
            );
      await mandarAImpresora(impresora, bytes);
      setAviso({ puesto, tono: "ok", texto: di.pruebaOk });
    } catch (e) {
      fallo(puesto, e);
    } finally {
      setOcupado(null);
    }
  };

  if (!soporte) return <p className="text-gris">{d.comun.cargando}</p>;
  const puedeDirecto = soporte.usb || soporte.serie;
  const recibosDirecta = recibos && recibos.camino !== "navegador" ? recibos : null;
  const modoEtiquetas: ModoEtiquetas =
    !etiquetas || etiquetas.camino === "navegador"
      ? "navegador"
      : etiquetas.camino === "recibos"
        ? "recibos"
        : "directa";
  const etiquetera = modoEtiquetas === "directa" ? etiquetas : null;

  const elegirModo = (modo: ModoEtiquetas) => {
    setAviso(null);
    if (modo === "navegador") guardar("etiquetas", null);
    else if (modo === "recibos")
      guardar("etiquetas", { ...BASE, camino: "recibos", nombre: di.modos.recibos, lenguaje: "escpos" });
    // «directa» no guarda nada hasta que se elige la etiquetera con su botón.
    else if (modoEtiquetas !== "directa")
      setEtiquetas({ ...BASE, camino: "usb", nombre: "", lenguaje: "tspl", tamano: "2x1" });
  };

  const botonesConectar = (puesto: PuestoImpresora, conectada: boolean) =>
    puedeDirecto && (
      <>
        {soporte.usb && (
          <Boton
            onClick={() => conectar(puesto, "usb")}
            cargando={ocupado === puesto}
            variante={conectada ? "secundario" : "primario"}
          >
            {di.conectarUsb}
          </Boton>
        )}
        {soporte.serie && (
          <Boton
            onClick={() => conectar(puesto, "serie")}
            cargando={ocupado === puesto}
            variante="secundario"
          >
            {di.conectarSerie}
          </Boton>
        )}
      </>
    );

  const menuDesconectar = (puesto: PuestoImpresora, nombre: string) => (
    <MenuTresPuntos
      etiqueta={nombre}
      opciones={[
        {
          texto: di.desconectar,
          destructiva: {
            titulo: di.confirmarDesconectar,
            mensaje: di.confirmarDesconectarTexto,
            confirmar: di.desconectar,
          },
          alElegir: () => guardar(puesto, null),
        },
      ]}
    />
  );

  return (
    <div className="space-y-4">
      {soporte.ios && <Aviso tono="info">{di.enIpad}</Aviso>}
      {!soporte.ios && !puedeDirecto && <Aviso tono="alerta">{di.noSoporta}</Aviso>}
      {soporte.windows && puedeDirecto && !recibosDirecta && <Aviso tono="info">{di.enWindows}</Aviso>}

      {/* ---------------- Recibos ---------------- */}
      <Tarjeta>
        <TituloSeccion>{di.recibos}</TituloSeccion>
        <p className="-mt-2 mb-3 text-[14px] text-gris">{di.recibosAyuda}</p>
        {aviso?.puesto === "recibos" && (
          <Aviso tono={aviso.tono} className="mb-3">
            {aviso.texto}
          </Aviso>
        )}
        {recibosDirecta ? (
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ok" data-testid="impresora-conectada">
                ✓ {di.conectada}: {recibosDirecta.nombre}
              </p>
              <p className="text-[14px] text-gris">{di.directa}</p>
            </div>
            {menuDesconectar("recibos", recibosDirecta.nombre)}
          </div>
        ) : (
          <p className="text-[15px] text-gris">{di.ninguna}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {botonesConectar("recibos", Boolean(recibosDirecta))}
          {recibosDirecta && (
            <Boton onClick={() => probar("recibos")} cargando={ocupado === "recibos"} variante="exito">
              {di.probar}
            </Boton>
          )}
        </div>
        {recibosDirecta && (
          <div className="mt-5 border-t border-percha/60 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoSelector
                etiqueta={di.papel}
                value={String(recibosDirecta.ancho)}
                onChange={(e) =>
                  guardar("recibos", { ...recibosDirecta, ancho: Number(e.target.value) as 48 | 42 | 32 })
                }
                opciones={[
                  { valor: "48", texto: di.papel80 },
                  { valor: "42", texto: di.papel72 },
                  { valor: "32", texto: di.papel58 },
                ]}
              />
              {recibosDirecta.camino === "serie" && (
                <CampoSelector
                  etiqueta={di.velocidad}
                  ayuda={di.velocidadAyuda}
                  value={String(recibosDirecta.baudios ?? 9600)}
                  onChange={(e) => guardar("recibos", { ...recibosDirecta, baudios: Number(e.target.value) })}
                  opciones={BAUDIOS.map((b) => ({ valor: String(b), texto: String(b) }))}
                />
              )}
            </div>
            <div className="mt-4 space-y-3">
              <Casilla
                etiqueta={di.cortar}
                checked={recibosDirecta.cortar}
                onChange={(e) => guardar("recibos", { ...recibosDirecta, cortar: e.target.checked })}
              />
              <Casilla
                etiqueta={di.cajon}
                checked={recibosDirecta.abrirCajon}
                onChange={(e) => guardar("recibos", { ...recibosDirecta, abrirCajon: e.target.checked })}
              />
            </div>
          </div>
        )}
      </Tarjeta>

      {/* ---------------- Etiquetas ---------------- */}
      <Tarjeta>
        <TituloSeccion>{di.etiquetas}</TituloSeccion>
        <p className="-mt-2 mb-3 text-[14px] text-gris">{di.etiquetasAyuda}</p>
        {aviso?.puesto === "etiquetas" && (
          <Aviso tono={aviso.tono} className="mb-3">
            {aviso.texto}
          </Aviso>
        )}
        <div
          className="flex flex-col gap-2"
          role="radiogroup"
          aria-label={di.comoEtiquetas}
          data-testid="modo-etiquetas"
        >
          {(["navegador", "recibos", "directa"] as const).map((modo) => {
            const elegido = modoEtiquetas === modo;
            const bloqueado = modo !== "navegador" && !puedeDirecto;
            return (
              <button
                key={modo}
                type="button"
                role="radio"
                aria-checked={elegido}
                disabled={bloqueado}
                onClick={() => elegirModo(modo)}
                className={`rounded-2xl px-4 py-3 text-left text-[15px] font-semibold ring-1 disabled:opacity-50 ${elegido ? "bg-tinta text-white ring-tinta" : "bg-superficie ring-percha hover:bg-tinta-suave"}`}
              >
                {di.modos[modo]}
                <span className={`block text-[13px] font-normal ${elegido ? "text-white/80" : "text-gris"}`}>
                  {di.modosAyuda[modo]}
                </span>
              </button>
            );
          })}
        </div>

        {modoEtiquetas === "recibos" && !recibosDirecta && (
          <Aviso tono="alerta" className="mt-3">
            {di.faltaRecibos}
          </Aviso>
        )}

        {modoEtiquetas === "directa" && (
          <div className="mt-4">
            {etiquetera?.nombre ? (
              <div className="flex items-start gap-3">
                <p className="min-w-0 flex-1 font-semibold text-ok" data-testid="etiquetera-conectada">
                  ✓ {di.conectada}: {etiquetera.nombre}
                </p>
                {menuDesconectar("etiquetas", etiquetera.nombre)}
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {botonesConectar("etiquetas", Boolean(etiquetera?.nombre))}
            </div>
            {etiquetera?.nombre ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <CampoSelector
                  etiqueta={di.lenguaje}
                  ayuda={di.lenguajeAyuda}
                  value={etiquetera.lenguaje ?? "tspl"}
                  onChange={(e) =>
                    guardar("etiquetas", {
                      ...etiquetera,
                      lenguaje: e.target.value as (typeof LENGUAJES_ETIQUETA)[number],
                    })
                  }
                  opciones={LENGUAJES_ETIQUETA.map((l) => ({ valor: l, texto: di.lenguajes[l] }))}
                />
                {etiquetera.lenguaje !== "escpos" && (
                  <CampoSelector
                    etiqueta={di.tamano}
                    value={etiquetera.tamano ?? "2x1"}
                    onChange={(e) =>
                      guardar("etiquetas", { ...etiquetera, tamano: e.target.value as TamanoEtiqueta })
                    }
                    opciones={(Object.keys(TAMANOS_ETIQUETA) as TamanoEtiqueta[]).map((t) => ({
                      valor: t,
                      texto: di.tamanos[t],
                    }))}
                  />
                )}
                {etiquetera.camino === "serie" && (
                  <CampoSelector
                    etiqueta={di.velocidad}
                    ayuda={di.velocidadAyuda}
                    value={String(etiquetera.baudios ?? 9600)}
                    onChange={(e) => guardar("etiquetas", { ...etiquetera, baudios: Number(e.target.value) })}
                    opciones={BAUDIOS.map((b) => ({ valor: String(b), texto: String(b) }))}
                  />
                )}
              </div>
            ) : null}
          </div>
        )}

        {((modoEtiquetas === "recibos" && recibosDirecta) ||
          (modoEtiquetas === "directa" && etiquetera?.nombre)) && (
          <div className="mt-4">
            <Boton onClick={() => probar("etiquetas")} cargando={ocupado === "etiquetas"} variante="exito">
              {di.probarEtiqueta}
            </Boton>
          </div>
        )}
      </Tarjeta>

      <p className="text-[15px]">
        <Link href="/docs/impresoras" className="font-semibold text-tinta underline">
          {di.verGuia}
        </Link>
      </p>
    </div>
  );
}
