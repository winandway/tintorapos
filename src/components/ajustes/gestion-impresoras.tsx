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
} from "@/lib/impresion/conexion";
import { reciboDePrueba } from "@/lib/impresion/imprimir";
import { reciboAEscPos } from "@/lib/impresion/recibo";
import { useIdioma } from "@/lib/i18n/cliente";

type Soporte = ReturnType<typeof soporteDelEquipo>;

/**
 * La impresora se conecta POR EQUIPO: la computadora del mostrador tiene la
 * suya y el celular del dueño no. Por eso todo esto vive en el navegador y no
 * en la cuenta.
 */
export function GestionImpresoras({ tienda }: { tienda: string }) {
  const { d } = useIdioma();
  const di = d.impresion.impresoras;
  const [soporte, setSoporte] = useState<Soporte | null>(null);
  const [impresora, setImpresora] = useState<ImpresoraGuardada | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tono: "ok" | "error"; texto: string } | null>(null);

  // Lo que sabe hacer este equipo se averigua en el navegador, no en el servidor.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSoporte(soporteDelEquipo());
    setImpresora(leerImpresora());
  }, []);

  const guardar = (i: ImpresoraGuardada | null) => {
    guardarImpresora(i);
    setImpresora(i);
  };

  const fallo = (e: unknown) => {
    const codigo = e instanceof ErrorImpresora ? e.codigo : "desconocido";
    if (codigo !== "cancelado") setAviso({ tono: "error", texto: di.errores[codigo] });
  };

  const conectar = async (camino: "usb" | "serie") => {
    setAviso(null);
    setOcupado(true);
    try {
      const elegida = camino === "usb" ? await elegirUsb() : await elegirSerie();
      guardar({
        camino,
        nombre: elegida.nombre,
        vendorId: elegida.vendorId,
        productId: elegida.productId,
        baudios: camino === "serie" ? 9600 : undefined,
        ancho: impresora?.ancho ?? 48,
        cortar: impresora?.cortar ?? true,
        abrirCajon: impresora?.abrirCajon ?? false,
      });
    } catch (e) {
      fallo(e);
    } finally {
      setOcupado(false);
    }
  };

  const probar = async () => {
    if (!impresora) return;
    setAviso(null);
    setOcupado(true);
    try {
      await mandarAImpresora(
        impresora,
        reciboAEscPos(reciboDePrueba(tienda, di.reciboPrueba, di.reciboPruebaTexto), {
          ancho: impresora.ancho,
          cortar: impresora.cortar,
        }),
      );
      setAviso({ tono: "ok", texto: di.pruebaOk });
    } catch (e) {
      fallo(e);
    } finally {
      setOcupado(false);
    }
  };

  if (!soporte) return <p className="text-gris">{d.comun.cargando}</p>;
  const directa = impresora && impresora.camino !== "navegador" ? impresora : null;
  const puedeDirecto = soporte.usb || soporte.serie;

  return (
    <div className="space-y-4">
      {aviso && <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>}

      <Tarjeta>
        <TituloSeccion>{di.esteEquipo}</TituloSeccion>
        {directa ? (
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ok" data-testid="impresora-conectada">
                ✓ {di.conectada}: {directa.nombre}
              </p>
              <p className="text-[14px] text-gris">{di.directa}</p>
            </div>
            <MenuTresPuntos
              etiqueta={directa.nombre}
              opciones={[
                {
                  texto: di.desconectar,
                  destructiva: {
                    titulo: di.confirmarDesconectar,
                    mensaje: di.confirmarDesconectarTexto,
                    confirmar: di.desconectar,
                  },
                  alElegir: () => guardar(null),
                },
              ]}
            />
          </div>
        ) : (
          <p className="text-[15px] text-gris">{di.ninguna}</p>
        )}

        {soporte.ios && (
          <Aviso tono="info" className="mt-3">
            {di.enIpad}
          </Aviso>
        )}
        {!soporte.ios && !puedeDirecto && (
          <Aviso tono="alerta" className="mt-3">
            {di.noSoporta}
          </Aviso>
        )}
        {soporte.windows && puedeDirecto && !directa && (
          <Aviso tono="info" className="mt-3">
            {di.enWindows}
          </Aviso>
        )}

        {puedeDirecto && (
          <div className="mt-4 flex flex-wrap gap-2">
            {soporte.usb && (
              <Boton
                onClick={() => conectar("usb")}
                cargando={ocupado}
                variante={directa ? "secundario" : "primario"}
              >
                {di.conectarUsb}
              </Boton>
            )}
            {soporte.serie && (
              <Boton onClick={() => conectar("serie")} cargando={ocupado} variante="secundario">
                {di.conectarSerie}
              </Boton>
            )}
            {directa && (
              <Boton onClick={probar} cargando={ocupado} variante="exito">
                {ocupado ? di.probando : di.probar}
              </Boton>
            )}
          </div>
        )}
      </Tarjeta>

      {directa && (
        <Tarjeta>
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoSelector
              etiqueta={di.papel}
              value={String(directa.ancho)}
              onChange={(e) => guardar({ ...directa, ancho: Number(e.target.value) as 48 | 42 | 32 })}
              opciones={[
                { valor: "48", texto: di.papel80 },
                { valor: "42", texto: di.papel72 },
                { valor: "32", texto: di.papel58 },
              ]}
            />
            {directa.camino === "serie" && (
              <CampoSelector
                etiqueta={di.velocidad}
                ayuda={di.velocidadAyuda}
                value={String(directa.baudios ?? 9600)}
                onChange={(e) => guardar({ ...directa, baudios: Number(e.target.value) })}
                opciones={BAUDIOS.map((b) => ({ valor: String(b), texto: String(b) }))}
              />
            )}
          </div>
          <div className="mt-4 space-y-3">
            <Casilla
              etiqueta={di.cortar}
              checked={directa.cortar}
              onChange={(e) => guardar({ ...directa, cortar: e.target.checked })}
            />
            <Casilla
              etiqueta={di.cajon}
              checked={directa.abrirCajon}
              onChange={(e) => guardar({ ...directa, abrirCajon: e.target.checked })}
            />
          </div>
        </Tarjeta>
      )}

      <p className="text-[15px]">
        <Link href="/docs/impresoras" className="font-semibold text-tinta underline">
          {di.verGuia}
        </Link>
      </p>
    </div>
  );
}
