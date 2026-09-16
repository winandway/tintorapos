import type { ReactNode } from "react";
import { MarcoApp } from "@/components/app/marco-app";
import { permisosDe } from "@/server/permisos";
import { exigirSesion } from "@/server/pagina";

export default async function LayoutProtegido({ children }: { children: ReactNode }) {
  const { sesion, dispositivo } = await exigirSesion();
  return (
    <MarcoApp
      info={{
        usuario: { nombre: sesion.usuario.nombre, rol: sesion.usuario.rol },
        permisos: permisosDe(sesion.usuario.rol),
        tienda: sesion.tintoreria.nombre,
        tipo: sesion.tipo,
        plan: sesion.tintoreria.plan,
        pruebaHasta: sesion.tintoreria.pruebaHasta,
        bloqueoMin: dispositivo ? dispositivo.bloqueoInactividadMin : null,
      }}
    >
      {children}
    </MarcoApp>
  );
}
