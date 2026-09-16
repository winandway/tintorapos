import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bloques } from "@/components/docs/bloques";
import { Icono } from "@/components/marca/iconos-sitio";
import { GUIAS, guiaPorSlug, SECCIONES } from "@/lib/docs";
import { diccionario } from "@/lib/i18n";
import { obtenerIdioma } from "@/lib/i18n/servidor";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = guiaPorSlug(slug);
  if (!g) return {};
  const t = g[await obtenerIdioma()];
  return {
    title: `${t.titulo} · Docs`,
    description: t.resumen,
    alternates: { canonical: `/docs/${g.slug}` },
    openGraph: { title: t.titulo, description: t.resumen, type: "article" },
  };
}

export default async function PaginaGuia({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = guiaPorSlug(slug);
  if (!g) notFound();
  const idioma = await obtenerIdioma();
  const d = diccionario(idioma).docs;
  const t = g[idioma];
  const seccion = SECCIONES.find((s) => s.clave === g.seccion);
  const i = GUIAS.indexOf(g);
  const anterior = GUIAS[i - 1];
  const siguiente = GUIAS[i + 1];
  return (
    <article className="max-w-3xl">
      <Link
        href="/docs"
        className="inline-flex items-center rounded-lg text-sm font-semibold text-tinta hover:underline"
      >
        {d.volver}
      </Link>
      <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-gris">
        {seccion && <Icono nombre={seccion.icono} className="size-4 text-tinta" />}
        {seccion?.[idioma]}
      </p>
      <h1 className="titulo-ancho mt-2 text-4xl leading-[1.05] sm:text-5xl">{t.titulo}</h1>
      <p className="mt-4 text-xl text-gris">{t.resumen}</p>
      <div className="mt-6 border-t border-percha pt-2">
        <Bloques bloques={t.bloques} idioma={idioma} />
      </div>
      <nav className="mt-14 grid gap-3 border-t border-percha pt-6 sm:grid-cols-2" aria-label={d.navegacion}>
        {anterior ? (
          <Link
            href={`/docs/${anterior.slug}`}
            className="rounded-2xl bg-superficie p-4 ring-1 ring-percha/70 hover:ring-tinta/40"
          >
            <span className="block text-xs font-semibold text-gris">← {d.anterior}</span>
            <span className="mt-1 block font-bold">{anterior[idioma].titulo}</span>
          </Link>
        ) : (
          <span />
        )}
        {siguiente && (
          <Link
            href={`/docs/${siguiente.slug}`}
            className="rounded-2xl bg-superficie p-4 text-right ring-1 ring-percha/70 hover:ring-tinta/40"
          >
            <span className="block text-xs font-semibold text-gris">{d.siguiente} →</span>
            <span className="mt-1 block font-bold">{siguiente[idioma].titulo}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
