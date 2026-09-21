/**
 * Lo que de verdad viaja en un correo de aviso: el HTML, el nombre de la tienda
 * como remitente y su correo para responder. El HTML se arma AL MANDAR (la tabla
 * `avisos` guarda solo el texto), con la orden como está en ese momento.
 */
import { diccionario } from "@/lib/i18n";
import { lineasRecibo } from "@/lib/impresion/recibo";
import { avisoAHtml, reciboAHtml, reciboATexto } from "@/lib/impresion/recibo-html";
import { leerTienda } from "@/server/ajustes/tienda";
import { verOrden } from "@/server/ordenes/consultas";

export interface AvisoPorCorreo {
  tintoreria_id: string;
  orden_id: string | null;
  tipo: string;
  idioma: string;
  cuerpo: string;
}

export interface ContenidoCorreo {
  texto: string;
  html?: string;
  remitente: string | null;
  responderA: string | null;
}

export async function contenidoCorreo(
  db: D1Database,
  appUrl: string,
  a: AvisoPorCorreo,
  ahora = Date.now(),
): Promise<ContenidoCorreo> {
  const base: ContenidoCorreo = { texto: a.cuerpo, remitente: null, responderA: null };
  try {
    const tienda = await leerTienda(db, a.tintoreria_id);
    base.remitente = tienda.nombre;
    base.responderA = tienda.correo ?? null;
    if (!a.orden_id) return base;
    const idioma = a.idioma === "en" ? "en" : "es";
    const di = diccionario(idioma).impresion;
    const orden = await verOrden(db, a.tintoreria_id, a.orden_id, ahora);
    const enlace = `${appUrl}/t/${orden.codigoPublico}`;
    const opciones = {
      enlace,
      textoBoton: di.correo.boton,
      avance: a.cuerpo,
      pie: di.correo.pie.replace("{tienda}", tienda.nombre),
      idioma,
    } as const;
    if (a.tipo !== "recibida") return { ...base, html: avisoAHtml(tienda.nombre, a.cuerpo, opciones) };
    const lineas = lineasRecibo(orden, tienda, idioma, { interna: false, enlace });
    return {
      ...base,
      texto: `${a.cuerpo}\n\n${reciboATexto(lineas)}`,
      html: reciboAHtml(lineas, opciones),
    };
  } catch (e) {
    // Sin el HTML el aviso sale igual, en texto. Pero se deja dicho: un recibo
    // que llega «pelado» sin que nadie sepa por qué es un fallo escondido.
    console.error("[avisos] el correo sale solo en texto:", e instanceof Error ? e.message : e);
    return base;
  }
}
