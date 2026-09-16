import { siguientePaso } from "@/server/auth/cookies-sesion";
import { leerDispositivo, necesitaDosPasos } from "@/server/auth/sesiones";
import { COOKIE_DISPOSITIVO } from "@/server/cookies";
import { permisosDe } from "@/server/permisos";
import { ruta } from "@/server/ruta";

/** Quién está conectado en este navegador (o null) y si es un dispositivo de la tienda. */
export const GET = ruta({
  acceso: "publico",
  manejar: async (c) => {
    const dispositivo = await leerDispositivo(c.db, c.cookies[COOKIE_DISPOSITIVO], c.ahora);
    const s = c.sesion;
    return {
      sesion: s
        ? {
            tipo: s.tipo,
            siguiente: siguientePaso(s.usuario, !necesitaDosPasos(s) || s.segundoFactorOk),
            usuario: { id: s.usuario.id, nombre: s.usuario.nombre, rol: s.usuario.rol },
            permisos: permisosDe(s.usuario.rol),
            tintoreria: {
              nombre: s.tintoreria.nombre,
              moneda: s.tintoreria.moneda,
              zonaHoraria: s.tintoreria.zonaHoraria,
              pais: s.tintoreria.pais,
              plan: s.tintoreria.plan,
              pruebaHasta: s.tintoreria.pruebaHasta,
              bloqueoInactividadMin: s.tintoreria.bloqueoInactividadMin,
            },
          }
        : null,
      dispositivo: dispositivo
        ? {
            nombre: dispositivo.nombre,
            tienda: dispositivo.tintoreriaNombre,
            bloqueoInactividadMin: dispositivo.bloqueoInactividadMin,
          }
        : null,
    };
  },
});
