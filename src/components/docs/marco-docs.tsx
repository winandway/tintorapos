import { cookies } from "next/headers";
import { BarraDocs, type SeccionBarra } from "@/components/docs/barra-docs";
import { Pie } from "@/components/pie";
import { EncabezadoSitio } from "@/components/sitio/encabezado-sitio";
import { guiasDeSeccion, indiceBuscador, SECCIONES } from "@/lib/docs";
import { diccionario, type Idioma } from "@/lib/i18n";
import { rutaGuia, rutaPagina } from "@/lib/rutas-publicas";
import { COOKIE_SESION } from "@/server/cookies";

/**
 * Marco de Docs con la barra lateral que nunca se pierde. Lo usan los dos grupos de
 * rutas de Docs: `(docs)` (x-default) y `[idioma]/docs` (/es/docs, /en/docs).
 */
export async function MarcoDocs({ idioma, children }: { idioma: Idioma; children: React.ReactNode }) {
  const d = diccionario(idioma);
  const haySesion = (await cookies()).has(COOKIE_SESION);
  const secciones: SeccionBarra[] = SECCIONES.map((s) => ({
    clave: s.clave,
    titulo: s[idioma],
    icono: s.icono,
    guias: guiasDeSeccion(s.clave).map((g) => ({
      slug: g.slug,
      titulo: g[idioma].titulo,
      href: rutaGuia(idioma, g.slug),
    })),
  }));
  return (
    <div className="flex min-h-dvh flex-col">
      <EncabezadoSitio
        idioma={idioma}
        haySesion={haySesion}
        enlaces={[{ href: rutaPagina(idioma, "docs"), texto: d.comun.docs }]}
      />
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 lg:py-10">
        <BarraDocs
          secciones={secciones}
          indice={indiceBuscador(idioma)}
          inicioDocs={rutaPagina(idioma, "docs")}
        />
        <main id="contenido" className="min-w-0">
          {children}
        </main>
      </div>
      <Pie idioma={idioma} />
    </div>
  );
}
