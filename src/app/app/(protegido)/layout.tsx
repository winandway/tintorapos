import type { ReactNode } from "react";
import { MarcoApp } from "@/components/app/marco-app";
import { estadoVerificacion } from "@/server/cuentas/verificacion";
import { obtenerContexto } from "@/server/entorno";
import { permisosEfectivos } from "@/server/permisos";
import { diasDePrueba, exigirSesion } from "@/server/pagina";

export default async function LayoutProtegido({ children }: { children: ReactNode }) {
  const { sesion, dispositivo } = await exigirSesion();
  // Solo se le recuerda a quien entró con su correo (no en la tablet con PIN).
  const { env } = obtenerContexto();
  const verificacion =
    sesion.tipo === "cuenta" && sesion.usuario.correo
      ? await estadoVerificacion(env.DB, sesion.usuario.id, sesion.tintoreria.id)
      : { correo: null, verificado: true };
  return (
    <MarcoApp
      info={{
        usuario: { nombre: sesion.usuario.nombre, rol: sesion.usuario.rol },
        permisos: permisosEfectivos(sesion.usuario),
        tienda: sesion.tintoreria.nombre,
        tipo: sesion.tipo,
        diasPrueba: diasDePrueba(sesion.tintoreria),
        bloqueoMin: dispositivo ? dispositivo.bloqueoInactividadMin : null,
        correoPorVerificar: verificacion.verificado ? null : (verificacion.correo ?? sesion.usuario.correo),
      }}
    >
      {children}
    </MarcoApp>
  );
}
