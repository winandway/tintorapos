import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bloques } from "@/components/docs/bloques";
import { Icono } from "@/components/marca/iconos-sitio";
import { GUIAS, guiaPorSlug, SECCIONES } from "@/lib/docs";
import { diccionario, type Idioma } from "@/lib/i18n";
import { rutaGuia, rutaPagina } from "@/lib/rutas-publicas";
import { alternatesDe, jsonLd, LOCALE_OG, urlAbsoluta } from "@/lib/seo";
import { CONTENIDO_ACTUALIZADO, URL_SITIO } from "@/lib/sitio";

export function metadataGuia(idioma: Idioma, slug: string, enDireccion: boolean): Metadata {
  const g = guiaPorSlug(slug);
  if (!g) return {};
  const t = g[idioma];
  const alternates = alternatesDe(`/docs/${g.slug}`, idioma, enDireccion);
  return {
    title: { absolute: `${t.titulo} | Tintora POS Docs` },
    description: t.resumen,
    alternates,
    openGraph: {
      title: t.titulo,
      description: t.resumen,
      type: "article",
      url: alternates?.canonical as string,
      locale: LOCALE_OG[idioma],
    },
  };
}

export function PaginaGuia({ idioma, slug }: { idioma: Idioma; slug: string }) {
  const g = guiaPorSlug(slug);
  if (!g) notFound();
  const d = diccionario(idioma).docs;
  const t = g[idioma];
  const seccion = SECCIONES.find((s) => s.clave === g.seccion);
  const i = GUIAS.indexOf(g);
  const anterior = GUIAS[i - 1];
  const siguiente = GUIAS[i + 1];
  const url = urlAbsoluta(`/docs/${g.slug}`, idioma);
  const estructura = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: t.titulo,
        description: t.resumen,
        url,
        inLanguage: idioma,
        datePublished: "2026-09-16",
        dateModified: CONTENIDO_ACTUALIZADO,
        about: { "@type": "SoftwareApplication", name: "Tintora POS", url: URL_SITIO },
        author: { "@type": "Organization", name: "Tintora POS", url: URL_SITIO },
        publisher: {
          "@type": "Organization",
          name: "Tintora POS",
          url: URL_SITIO,
          logo: { "@type": "ImageObject", url: `${URL_SITIO}/icon.png` },
        },
        mainEntityOfPage: url,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Tintora POS", item: urlAbsoluta("", idioma) },
          { "@type": "ListItem", position: 2, name: d.titulo, item: urlAbsoluta("/docs", idioma) },
          { "@type": "ListItem", position: 3, name: t.titulo, item: url },
        ],
      },
    ],
  };
  return (
    <article className="max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(estructura) }} />
      <Link
        href={rutaPagina(idioma, "docs")}
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
            href={rutaGuia(idioma, anterior.slug)}
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
            href={rutaGuia(idioma, siguiente.slug)}
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
