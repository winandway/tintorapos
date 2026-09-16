import { cookies } from "next/headers";
import { BarraDocs, type SeccionBarra } from "@/components/docs/barra-docs";
import { Pie } from "@/components/pie";
import { EncabezadoSitio } from "@/components/sitio/encabezado-sitio";
import { guiasDeSeccion, indiceBuscador, SECCIONES } from "@/lib/docs";
import { diccionario } from "@/lib/i18n";
import { obtenerIdioma } from "@/lib/i18n/servidor";
import { COOKIE_SESION } from "@/server/cookies";

/**
 * Grupo de rutas de Docs: TODAS las páginas que cuelgan de Docs van dentro,
 * así la barra lateral nunca se pierde al tocar una guía.
 */
export default async function LayoutDocs({ children }: { children: React.ReactNode }) {
  const idioma = await obtenerIdioma();
  const d = diccionario(idioma);
  const haySesion = (await cookies()).has(COOKIE_SESION);
  const secciones: SeccionBarra[] = SECCIONES.map((s) => ({
    clave: s.clave,
    titulo: s[idioma],
    icono: s.icono,
    guias: guiasDeSeccion(s.clave).map((g) => ({ slug: g.slug, titulo: g[idioma].titulo })),
  }));
  return (
    <div className="flex min-h-dvh flex-col">
      <EncabezadoSitio
        idioma={idioma}
        haySesion={haySesion}
        enlaces={[{ href: "/docs", texto: d.comun.docs }]}
      />
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 lg:py-10">
        <BarraDocs secciones={secciones} indice={indiceBuscador(idioma)} />
        <main id="contenido" className="min-w-0">
          {children}
        </main>
      </div>
      <Pie idioma={idioma} />
    </div>
  );
}
