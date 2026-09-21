import { lineasRecibo } from "@/lib/impresion/recibo";
import { leerTienda } from "@/server/ajustes/tienda";
import { ErrorApp } from "@/server/errores";
import { puedeImprimirRecibo } from "@/server/impresion";
import { verOrden } from "@/server/ordenes/consultas";
import { ruta } from "@/server/ruta";

/**
 * El recibo en líneas, para la impresora conectada directo (sin el diálogo del
 * navegador). Respeta la misma regla que la pantalla de imprimir: pasado el
 * cuarto de hora, el recibo del cliente pide la autorización de un gerente.
 */
export const GET = ruta({
  acceso: "sesion",
  permiso: "ordenes.ver",
  manejar: async (c) => {
    const s = c.sesion!;
    const interna = new URL(c.req.url).searchParams.get("tipo") === "interna";
    const orden = await verOrden(c.db, s.tintoreria.id, c.params.id ?? "", c.ahora);
    if (!interna && !(await puedeImprimirRecibo(c.db, s, orden, c.ahora)))
      throw new ErrorApp(403, "requiere_autorizacion");
    const tienda = await leerTienda(c.db, s.tintoreria.id);
    return {
      numero: orden.numero,
      lineas: lineasRecibo(orden, tienda, interna ? c.idioma : orden.cliente.idioma, {
        interna,
        enlace: `${c.vars.APP_URL}/t/${orden.codigoPublico}`,
      }),
    };
  },
});
