import { GestionImpresoras } from "@/components/ajustes/gestion-impresoras";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { exigirSesion } from "@/server/pagina";

/**
 * La impresora se conecta en el equipo que imprime, así que aquí entra quien
 * atiende el mostrador (no hace falta ser dueño ni gerente).
 */
export default async function PaginaImpresoras() {
  const { sesion } = await exigirSesion("ordenes.ver");
  const { d } = await obtenerTextos();
  return (
    <div className="mx-auto max-w-3xl" data-captura="impresoras">
      <EncabezadoPagina
        titulo={d.ajustes.secciones.impresoras.titulo}
        subtitulo={d.ajustes.secciones.impresoras.texto}
        volver={{ href: "/app/ajustes", texto: d.ajustes.volver }}
      />
      <GestionImpresoras tienda={sesion.tintoreria.nombre} />
    </div>
  );
}
