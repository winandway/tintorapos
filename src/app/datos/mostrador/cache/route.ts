import { sinPermiso } from "@/server/errores";
import { usuarioPuede } from "@/server/permisos";
import { ruta } from "@/server/ruta";
import { datosParaSinConexion } from "@/server/sync";

/** Clientes y órdenes abiertas para trabajar sin conexión en el dispositivo de la tienda. */
export const GET = ruta({
  acceso: "sesion",
  manejar: async (c) => {
    const usuario = c.sesion!.usuario;
    if (!usuarioPuede(usuario, "ordenes.ver")) throw sinPermiso();
    const datos = await datosParaSinConexion(c.db, c.sesion!.tintoreria.id);
    // Planta no ve montos ni teléfonos.
    if (!usuarioPuede(usuario, "ordenes.ver_montos")) {
      return {
        ...datos,
        clientes: [],
        ordenes: datos.ordenes.map((o) => ({
          ...(o as Record<string, unknown>),
          total_cents: 0,
          pagado_cents: 0,
        })),
      };
    }
    return datos;
  },
});
