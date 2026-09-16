import { GestionDispositivos } from "@/components/ajustes/gestion-dispositivos";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaDispositivos() {
  const { sesion, dispositivo } = await exigirSesion("dispositivos.gestionar");
  const { d } = await obtenerTextos();
  return (
    <div className="mx-auto max-w-3xl">
      <EncabezadoPagina
        titulo={d.ajustes.secciones.dispositivos.titulo}
        subtitulo={d.ajustes.secciones.dispositivos.texto}
        volver={{ href: "/app/ajustes", texto: d.ajustes.volver }}
      />
      <GestionDispositivos
        puedeRegistrar={sesion.tipo === "cuenta" && !dispositivo}
        zona={sesion.tintoreria.zonaHoraria}
        esteId={dispositivo?.id ?? null}
      />
    </div>
  );
}
