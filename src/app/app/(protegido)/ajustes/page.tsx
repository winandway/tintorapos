import Link from "next/link";
import { EncabezadoPagina } from "@/components/ui/encabezado";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { exigirSesion } from "@/server/pagina";
import { type Permiso, usuarioPuede } from "@/server/permisos";

const SECCIONES: {
  clave: "tienda" | "precios" | "empleados" | "dispositivos" | "avisos" | "seguridad" | "datos";
  permiso: Permiso | null;
  color: string;
}[] = [
  { clave: "tienda", permiso: "ajustes.tienda", color: "bg-dia-1" },
  { clave: "precios", permiso: "ajustes.catalogo", color: "bg-dia-3" },
  { clave: "empleados", permiso: "empleados.gestionar", color: "bg-dia-4" },
  { clave: "dispositivos", permiso: "dispositivos.gestionar", color: "bg-dia-2" },
  { clave: "avisos", permiso: "ajustes.avisos", color: "bg-dia-5" },
  { clave: "seguridad", permiso: null, color: "bg-dia-6" },
  { clave: "datos", permiso: "datos.exportar", color: "bg-dia-0" },
];

export default async function PaginaAjustes() {
  const { sesion } = await exigirSesion();
  const { d } = await obtenerTextos();
  const visibles = SECCIONES.filter((s) =>
    s.permiso ? usuarioPuede(sesion.usuario, s.permiso) : sesion.tipo === "cuenta",
  );
  return (
    <div className="mx-auto max-w-5xl">
      <EncabezadoPagina titulo={d.ajustes.titulo} subtitulo={d.ajustes.subtitulo} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((s) => (
          <Link
            key={s.clave}
            href={`/app/ajustes/${s.clave}`}
            className="group relative overflow-hidden rounded-3xl bg-superficie p-5 ring-1 ring-percha/80 transition hover:ring-2 hover:ring-tinta"
          >
            <span className={`absolute top-0 right-5 h-9 w-6 rounded-b-md ${s.color}`} aria-hidden="true" />
            <h2 className="pr-10 text-[17px] font-bold group-hover:text-tinta">
              {d.ajustes.secciones[s.clave].titulo}
            </h2>
            <p className="mt-1 text-[14px] text-gris">{d.ajustes.secciones[s.clave].texto}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
