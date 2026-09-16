import { AjustesAvisos } from "@/components/ajustes/ajustes-avisos";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaAvisos() {
  const { sesion } = await exigirSesion("ajustes.avisos");
  const { d } = await obtenerTextos();
  return (
    <div className="mx-auto max-w-3xl">
      <EncabezadoPagina
        titulo={d.ajustes.secciones.avisos.titulo}
        subtitulo={d.avisos.consentimiento}
        volver={{ href: "/app/ajustes", texto: d.ajustes.volver }}
      />
      <AjustesAvisos tienda={sesion.tintoreria.nombre} zona={sesion.tintoreria.zonaHoraria} />
    </div>
  );
}
