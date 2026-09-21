import { encolarAvisos, procesarCola } from "@/server/avisos";
import { PLAN_DEMO } from "@/server/demo";
import { ErrorApp } from "@/server/errores";
import { verOrden } from "@/server/ordenes/consultas";
import { ruta } from "@/server/ruta";

/**
 * «Enviar recibo por correo» desde la orden: el mismo recibo digital que sale
 * solo al crearla, a pedido. Va al correo que el cliente tiene en su ficha (no se
 * acepta otra dirección: así nadie usa una orden ajena para escribirle a quien
 * quiera). Con tope, para que el botón no sirva de cañón de correos.
 */
export const POST = ruta({
  acceso: "sesion",
  permiso: "ordenes.ver",
  limite: {
    clave: (c) => `recibo-correo:${c.sesion?.tintoreria.id}:${c.params.id}`,
    max: 5,
    ventanaSeg: 3600,
  },
  manejar: async (c) => {
    const s = c.sesion!;
    const orden = await verOrden(c.db, s.tintoreria.id, c.params.id ?? "", c.ahora);
    if (s.tintoreria.plan === PLAN_DEMO) throw new ErrorApp(400, "demo_sin_correos");
    if (!orden.cliente.correo) throw new ErrorApp(400, "cliente_sin_correo");
    const ids = await encolarAvisos(
      c.db,
      c.vars.APP_URL,
      { tintoreriaId: s.tintoreria.id, ordenId: orden.id, tipo: "recibida", reciboAPedido: true },
      c.ahora,
    );
    if (!ids.length) throw new ErrorApp(400, "cliente_sin_correo");
    // Se manda ya, no «luego»: quien tocó el botón espera saber si salió.
    const r = await procesarCola(c.env, c.vars, { ids }, c.ahora);
    const aviso = await c.db
      .prepare("select estado, error from avisos where tintoreria_id = ? and id = ?")
      .bind(s.tintoreria.id, ids[0])
      .first<{ estado: string; error: string | null }>();
    return { estado: aviso?.estado ?? "pendiente", error: aviso?.error ?? null, enviados: r.enviados };
  },
});
