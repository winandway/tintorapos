import { GestionEmpleados } from "@/components/ajustes/gestion-empleados";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaEmpleados() {
  const { sesion } = await exigirSesion("empleados.gestionar");
  const { d } = await obtenerTextos();
  return (
    <div className="mx-auto max-w-4xl">
      <EncabezadoPagina
        titulo={d.ajustes.secciones.empleados.titulo}
        subtitulo={d.ajustes.secciones.empleados.texto}
        volver={{ href: "/app/ajustes", texto: d.ajustes.volver }}
      />
      <GestionEmpleados
        miRol={sesion.usuario.rol}
        miId={sesion.usuario.id}
        zona={sesion.tintoreria.zonaHoraria}
      />
    </div>
  );
}
