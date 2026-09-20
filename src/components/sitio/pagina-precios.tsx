import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Pie } from "@/components/pie";
import { EncabezadoSitio } from "@/components/sitio/encabezado-sitio";
import { clasesBoton } from "@/components/ui/boton";
import { PLANES, textoPlan } from "@/lib/contenido/precios";
import { diccionario, formatoDinero, type Idioma } from "@/lib/i18n";
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

        <ul className="mt-10 grid gap-5 lg:grid-cols-3">
          {PLANES.map((plan) => {
            const t = textoPlan(plan, idioma);
            return (
              <li
                key={plan.clave}
                className={`flex flex-col rounded-3xl bg-superficie p-6 ${plan.destacado ? "ring-2 ring-tinta" : "ring-1 ring-percha/70"}`}
              >
                {plan.destacado && (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-tinta-suave px-3 py-1 text-[13px] font-bold text-tinta">
                    {c.destacado}
                  </span>
                )}
                <h2 className="titulo-ancho text-2xl">{t.nombre}</h2>
                <p className="mt-2 text-[15px] text-gris">{t.para}</p>
                <p className="mt-5">
                  {plan.precioMensualCents === null ? (
                    <span className="text-2xl font-bold">{c.aConsultar}</span>
                  ) : (
                    <>
                      <span className="numero-ticket text-4xl">
                        {formatoDinero(plan.precioMensualCents, "USD", idioma)}
                      </span>{" "}
                      <span className="text-[15px] text-gris">{c.mensual}</span>
                    </>
                  )}
                </p>
                {plan.precioMensualCents === null && (
                  <p className="mt-1 text-[14px] text-gris">{c.aConsultarTexto}</p>
                )}
                <p className="mt-6 text-[12px] font-bold tracking-wide text-gris uppercase">{c.incluye}</p>
                <ul className="mt-2 space-y-1.5 text-[15px]">
                  {t.incluye.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="mt-0.5 text-tinta" aria-hidden="true">
                        ✓
                      </span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    href={rutaPagina(idioma, "registro")}
                    className={clasesBoton(plan.destacado ? "primario" : "secundario", "normal", true)}
                  >
                    {c.empezar}
                  </Link>
                  <Link
                    href={rutaPagina(idioma, "contacto")}
                    className="text-center text-[14px] font-semibold text-tinta underline"
                  >
                    {c.hablar}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

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
