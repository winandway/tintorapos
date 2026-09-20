import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Pie } from "@/components/pie";
import { EncabezadoSitio } from "@/components/sitio/encabezado-sitio";
import { clasesBoton } from "@/components/ui/boton";
import { PLAN, textoPlan } from "@/lib/contenido/precios";
import { diccionario, fmt, formatoDinero, type Idioma } from "@/lib/i18n";
import { rutaPagina } from "@/lib/rutas-publicas";
import { alternatesDe, jsonLd, LOCALE_OG, urlAbsoluta } from "@/lib/seo";
import { COOKIE_SESION } from "@/server/cookies";

export function metadataPrecios(idioma: Idioma, enDireccion: boolean): Metadata {
  const c = diccionario(idioma).precios;
  return {
    title: { absolute: c.meta.titulo },
    description: c.meta.descripcion,
    alternates: alternatesDe("/precios", idioma, enDireccion),
    openGraph: {
      type: "website",
      title: c.meta.titulo,
      description: c.meta.descripcion,
      locale: LOCALE_OG[idioma],
    },
  };
}

/** Planes y preguntas de dinero. Sin precio publicado, invita a escribir. */
export async function PaginaPrecios({ idioma }: { idioma: Idioma }) {
  const d = diccionario(idioma);
  const c = d.precios;
  const t = textoPlan(PLAN, idioma);
  const haySesion = Boolean((await cookies()).get(COOKIE_SESION));
  const datos = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${urlAbsoluta("/precios", idioma)}#preguntas`,
    mainEntity: c.faq.map((q) => ({
      "@type": "Question",
      name: q.p,
      acceptedAnswer: { "@type": "Answer", text: q.r },
    })),
  };
  return (
    <div className="flex min-h-dvh flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(datos) }} />
      <EncabezadoSitio idioma={idioma} haySesion={haySesion} enlaces={[]} />
      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:py-16">
        <h1 className="titulo-ancho text-4xl leading-tight sm:text-5xl">{c.titulo}</h1>
        <p className="mt-4 max-w-2xl text-lg text-gris">{c.texto}</p>

        <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
          <div className="rounded-3xl bg-superficie p-6 ring-2 ring-tinta">
            <span className="mb-3 inline-flex w-fit rounded-full bg-tinta-suave px-3 py-1 text-[13px] font-bold text-tinta">
              {c.unSoloPrecio}
            </span>
            <h2 className="titulo-ancho text-2xl">{t.nombre}</h2>
            <p className="mt-2 text-[15px] text-gris">{t.para}</p>
            <p className="mt-5">
              <span className="numero-ticket text-5xl">
                {formatoDinero(PLAN.precioAnualCents, "USD", idioma)}
              </span>{" "}
              <span className="text-[15px] text-gris">
                {c.anual} · {c.porTienda}
              </span>
            </p>
            <p className="mt-1 text-[14px] text-gris">
              {fmt(c.equivale, {
                precio: formatoDinero(PLAN.equivalenteMensualCents, "USD", idioma),
              })}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link href={rutaPagina(idioma, "registro")} className={clasesBoton("primario", "grande", true)}>
                {c.empezar}
              </Link>
              <Link
                href={rutaPagina(idioma, "contacto")}
                className="text-center text-[14px] font-semibold text-tinta underline"
              >
                {c.hablar}
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-gris">{c.aConsultarTexto}</p>
          </div>

          <div className="rounded-3xl bg-papel p-6 ring-1 ring-percha/70">
            <p className="text-[12px] font-bold tracking-wide text-gris uppercase">{c.incluye}</p>
            <ul className="mt-3 grid gap-2 text-[16px] sm:grid-cols-2">
              {t.incluye.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-0.5 text-ok" aria-hidden="true">
                    ✓
                  </span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="mt-14">
          <h2 className="titulo-ancho text-3xl">{c.preguntas}</h2>
          <dl className="mt-6 space-y-6">
            {c.faq.map((q) => (
              <div key={q.p}>
                <dt className="text-lg font-bold">{q.p}</dt>
                <dd className="mt-1 text-[16px] text-gris">{q.r}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <Pie idioma={idioma} />
    </div>
  );
}
