import { AjustesSeguridad } from "@/components/ajustes/ajustes-seguridad";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { exigirSesion } from "@/server/pagina";
import { tienePermiso } from "@/server/permisos";

export default async function PaginaSeguridad() {
  const { sesion } = await exigirSesion();
  const { d } = await obtenerTextos();
  return (
    <div className="mx-auto max-w-3xl">
      <EncabezadoPagina
        titulo={d.ajustes.secciones.seguridad.titulo}
        subtitulo={d.ajustes.secciones.seguridad.texto}
        volver={{ href: "/app/ajustes", texto: d.ajustes.volver }}
      />
      <AjustesSeguridad
        cuenta={sesion.tipo === "cuenta"}
        totpActivo={sesion.usuario.totpActivo}
        verActividad={tienePermiso(sesion.usuario.rol, "auditoria.ver")}
        zona={sesion.tintoreria.zonaHoraria}
      />
    </div>
  );
}
