import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { renderSVG } from "uqr";
import { Recibo, Etiquetas } from "@/components/impresion/documentos";
import { BarraImpresion, ReciboBloqueado } from "@/components/impresion/barra";
import { diccionario } from "@/lib/i18n";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { ErrorApp } from "@/server/errores";
import { verOrden } from "@/server/ordenes/consultas";
import { exigirSesion } from "@/server/pagina";
import { leerTienda } from "@/server/ajustes/tienda";
import { ahoraMs } from "@/lib/fechas";

export const metadata: Metadata = { title: "Imprimir · Print", robots: { index: false } };

const VENTANA_SIN_AUTORIZACION = 15 * 60_000;

export default async function PaginaImprimir({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tipo?: string; vista?: string }>;
}) {
  const { id } = await params;
  const { tipo = "recibo", vista } = await searchParams;
  const { sesion, db, vars } = await exigirSesion("ordenes.ver");
  const { idioma: idiomaPersonal } = await obtenerTextos();
  let orden;
  try {
    orden = await verOrden(db, sesion.tintoreria.id, id, ahoraMs());
  } catch (e) {
    if (e instanceof ErrorApp) notFound();
    throw e;
  }
  const tienda = await leerTienda(db, sesion.tintoreria.id);

  if (tipo === "etiquetas") {
    const etiquetas = orden.prendas
      .filter((p) => p.estado !== "anulada")
      .map((p, i, todas) => ({
        prenda: p,
        i: i + 1,
        n: todas.length,
        qr: renderSVG(`${vars.APP_URL}/e/${p.codigoEtiqueta}`, { border: 0, ecc: "M", pixelSize: 4 }),
      }));
    return (
      <>
        <style>{`@page { size: 2in 1in; margin: 0; } body { background: #fff; }`}</style>
        <BarraImpresion idioma={idiomaPersonal} automatico={!vista} />
        <Etiquetas
          orden={orden}
          etiquetas={etiquetas}
          idioma={orden.cliente.idioma}
          zona={tienda.zonaHoraria}
        />
      </>
    );
  }

  const interna = tipo === "interna";
  // Reimprimir el recibo del cliente pide autorización: solo se libra en los primeros
  // 15 minutos de la orden o si hay una reimpresión autorizada reciente.
  if (!interna) {
    const reciente = orden.creadaEn > ahoraMs() - VENTANA_SIN_AUTORIZACION;
    const autorizada = await db
      .prepare(
        "select id from auditoria where tintoreria_id = ? and entidad_id = ? and accion = 'orden.reimpresion_recibo' and creado_en > ? limit 1",
      )
      .bind(sesion.tintoreria.id, orden.id, ahoraMs() - VENTANA_SIN_AUTORIZACION)
      .first();
    if (!reciente && !autorizada) {
      return <ReciboBloqueado ordenId={orden.id} mensaje={diccionario(idiomaPersonal).impresion.bloqueada} />;
    }
  }
  const idioma = interna ? idiomaPersonal : orden.cliente.idioma;
  const enlace = `${vars.APP_URL}/t/${orden.codigoPublico}`;
  return (
    <>
      <style>{`@page { size: 80mm auto; margin: 0; } body { background: #fff; }`}</style>
      <BarraImpresion idioma={idiomaPersonal} automatico={!vista} />
      <Recibo
        orden={orden}
        tienda={tienda}
        idioma={idioma}
        interna={interna}
        enlace={enlace}
        qr={interna ? null : renderSVG(enlace, { border: 1, ecc: "M", pixelSize: 3 })}
      />
    </>
  );
}
