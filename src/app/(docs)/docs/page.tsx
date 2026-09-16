import type { Metadata } from "next";
import Link from "next/link";
import { BuscadorGrande } from "@/components/docs/buscador-docs";
import { Icono } from "@/components/marca/iconos-sitio";
import { guiasDeSeccion, indiceBuscador, SECCIONES } from "@/lib/docs";
import { diccionario, fmt } from "@/lib/i18n";
import { obtenerIdioma } from "@/lib/i18n/servidor";

export async function generateMetadata(): Promise<Metadata> {
  const d = diccionario(await obtenerIdioma()).docs;
  return { title: d.titulo, description: d.subtitulo, alternates: { canonical: "/docs" } };
}

export default async function PortadaDocs() {
  const idioma = await obtenerIdioma();
  const d = diccionario(idioma).docs;
  return (
    <div>
      <h1 className="titulo-ancho text-5xl leading-none sm:text-6xl">{d.titulo}</h1>
      <p className="mt-3 max-w-2xl text-lg text-gris">{d.subtitulo}</p>
      <div className="mt-8">
        <BuscadorGrande indice={indiceBuscador(idioma)} />
      </div>
      <div className="mt-12 space-y-12">
        {SECCIONES.map((s) => {
          const guias = guiasDeSeccion(s.clave);
          return (
            <section key={s.clave} aria-labelledby={`seccion-${s.clave}`}>
              <div className="flex items-baseline justify-between gap-4 border-b border-percha pb-2">
                <h2 id={`seccion-${s.clave}`} className="flex items-center gap-2.5 text-xl font-bold">
                  <span className="grid size-9 place-items-center rounded-xl bg-tinta text-white">
                    <Icono nombre={s.icono} className="size-5" />
                  </span>
                  {s[idioma]}
                </h2>
                <span className="text-sm text-gris">{fmt(d.guias, { n: guias.length })}</span>
              </div>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {guias.map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={`/docs/${g.slug}`}
                      className="group flex h-full gap-3 rounded-2xl bg-superficie p-4 ring-1 ring-percha/70 transition hover:-translate-y-0.5 hover:shadow-ticket hover:ring-tinta/40"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tinta-suave text-tinta">
                        <Icono nombre={g.icono} className="size-5" />
                      </span>
                      <span>
                        <span className="block font-bold text-noche group-hover:text-tinta">
                          {g[idioma].titulo}
                        </span>
                        <span className="mt-1 block text-[15px] text-gris">{g[idioma].resumen}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
