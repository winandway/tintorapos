import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Icono } from "@/components/marca/iconos-sitio";
import { Pie } from "@/components/pie";
import { EncabezadoSitio } from "@/components/sitio/encabezado-sitio";
import { HerramientasAgente } from "@/components/sitio/herramientas-agente";
import { clasesBoton } from "@/components/ui/boton";
import { Ticket } from "@/components/ui/ticket";
import { CONTENIDO_INICIO } from "@/lib/contenido/inicio";
import { diccionario, type Idioma } from "@/lib/i18n";
import { rutaPagina } from "@/lib/rutas-publicas";
import { alternatesDe, jsonLd, LOCALE_OG, urlAbsoluta } from "@/lib/seo";
import { DOMINIO_SITIO, URL_SITIO } from "@/lib/sitio";
import { COOKIE_SESION } from "@/server/cookies";

/** Metadatos de la portada. `enDireccion`: la página se pidió con /es o /en (canónica de ese idioma). */
export function metadataInicio(idioma: Idioma, enDireccion: boolean): Metadata {
  const c = CONTENIDO_INICIO[idioma];
  const alternates = alternatesDe("", idioma, enDireccion);
  return {
    title: { absolute: c.meta.titulo },
    description: c.meta.descripcion,
    alternates,
    openGraph: {
      type: "website",
      siteName: "Tintora POS",
      title: c.meta.titulo,
      description: c.meta.descripcion,
      url: alternates?.canonical as string,
      locale: LOCALE_OG[idioma],
      alternateLocale: [LOCALE_OG[idioma === "es" ? "en" : "es"]],
    },
    twitter: { card: "summary_large_image", title: c.meta.titulo, description: c.meta.descripcion },
  };
}

function Seccion({
  id,
  titulo,
  texto,
  children,
  className = "",
}: {
  id?: string;
  titulo: string;
  texto?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 py-16 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="titulo-ancho max-w-3xl text-[32px] leading-[1.05] sm:text-5xl">{titulo}</h2>
        {texto && <p className="mt-4 max-w-2xl text-lg text-gris">{texto}</p>}
        <div className="mt-10 sm:mt-14">{children}</div>
      </div>
    </section>
  );
}

/** Portada pública, en el idioma que se le pasa (la usan `/`, `/es` y `/en`). */
export async function PaginaInicio({ idioma }: { idioma: Idioma }) {
  const c = CONTENIDO_INICIO[idioma];
  const d = diccionario(idioma).comun;
  const haySesion = (await cookies()).has(COOKIE_SESION);
  const urlPagina = urlAbsoluta("", idioma);
  const datosEstructurados = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${URL_SITIO}/#organizacion`,
        name: "Tintora POS",
        url: URL_SITIO,
        logo: { "@type": "ImageObject", url: `${URL_SITIO}/icon.png`, width: 512, height: 512 },
      },
      {
        "@type": "WebSite",
        "@id": `${URL_SITIO}/#sitio`,
        name: "Tintora POS",
        url: URL_SITIO,
        inLanguage: ["en", "es"],
        publisher: { "@id": `${URL_SITIO}/#organizacion` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${URL_SITIO}/#software`,
        name: "Tintora POS",
        url: urlPagina,
        description: c.meta.descripcion,
        applicationCategory: "BusinessApplication",
        applicationSubCategory:
          idioma === "en"
            ? "Dry cleaning and laundry point of sale"
            : "Punto de venta para tintorerías y lavanderías",
        operatingSystem: "Web browser, iPadOS, Android, Windows, macOS",
        inLanguage: ["en", "es"],
        featureList: c.funciones.items.map((f) => f.titulo),
        publisher: { "@id": `${URL_SITIO}/#organizacion` },
      },
      {
        "@type": "FAQPage",
        "@id": `${urlPagina}#preguntas`,
        inLanguage: idioma,
        mainEntity: c.preguntas.items.map((q) => ({
          "@type": "Question",
          name: q.p,
          acceptedAnswer: { "@type": "Answer", text: q.r },
        })),
      },
    ],
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Para agentes: manifiesto de recursos y herramientas del navegador (WebMCP). */}
      <link rel="ai-catalog" href="/.well-known/ai-catalog.json" />
      <link rel="api-catalog" href="/.well-known/api-catalog" />
      <link rel="alternate" type="text/markdown" href="/md" />
      <HerramientasAgente />
      <script
        type="application/ld+json"
        // Datos estáticos propios, sin nada que venga del usuario.
        dangerouslySetInnerHTML={{ __html: jsonLd(datosEstructurados) }}
      />
      <EncabezadoSitio
        idioma={idioma}
        haySesion={haySesion}
        enlaces={[
          { href: "#funciones", texto: c.nav.funciones },
          { href: "#seguridad", texto: c.nav.seguridad },
          { href: "#preguntas", texto: c.nav.preguntas },
          { href: rutaPagina(idioma, "docs"), texto: d.docs },
        ]}
      />
      <main id="contenido" className="flex-1">
        {/* Portada: el riel de tickets de colores, como el de cualquier tintorería. */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-6 sm:pt-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-tinta-suave px-3 py-1 text-sm font-semibold text-tinta">
                <Icono nombre="etiqueta" className="size-4" />
                {c.hero.etiqueta}
              </p>
              <h1 className="titulo-ancho mt-6 text-[42px] leading-[0.98] sm:text-6xl lg:text-[76px]">
                {c.hero.titulo}
                <span className="block text-tinta">{c.hero.tituloResaltado}</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-gris sm:text-xl">{c.hero.texto}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={rutaPagina(idioma, "registro")} className={clasesBoton("primario", "grande")}>
                  {c.hero.cta}
                </Link>
                <a href="#como-funciona" className={clasesBoton("secundario", "grande")}>
                  {c.hero.ctaSecundario}
                </a>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-gris">
                {c.hero.sellos.map((s) => (
                  <li key={s} className="flex items-center gap-1.5">
                    <svg viewBox="0 0 16 16" className="size-4 text-ok" aria-hidden="true">
                      <path
                        d="m3.5 8.5 3 3 6-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <figure className="relative mx-auto w-full max-w-sm rounded-3xl bg-superficie p-4 shadow-ticket ring-1 ring-percha/60 lg:mb-4">
              <div className="flex items-center gap-2.5 border-b border-percha/60 pb-3">
                <span className="grid size-9 place-items-center rounded-full bg-tinta text-white">
                  <Icono nombre="mensaje" className="size-4" />
                </span>
                <span className="text-sm font-semibold">{c.hero.smsDe}</span>
                <span className="ml-auto text-xs text-gris-claro">SMS</span>
              </div>
              <blockquote className="mt-3 rounded-2xl rounded-tl-md bg-papel px-4 py-3 text-[15px] leading-snug">
                {c.hero.sms}{" "}
                <span className="font-semibold break-all text-tinta underline underline-offset-2">
                  {DOMINIO_SITIO}/t/…
                </span>
              </blockquote>
            </figure>
          </div>

          <figure className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
            <div className="relative pt-2">
              <div
                className="h-2 rounded-full bg-noche/85 shadow-[0_2px_0_rgb(0_0_0/0.08)]"
                aria-hidden="true"
              />
              <div className="flex justify-around gap-3 sm:justify-between sm:px-6" aria-hidden="true">
                {c.hero.dias.map((dia, i) => (
                  <div
                    key={dia}
                    className={`balanceo flex-col items-center ${i < 3 ? "flex" : i < 5 ? "hidden sm:flex" : "hidden lg:flex"}`}
                    style={{ animationDelay: `${i * 90}ms` }}
                  >
                    <svg viewBox="0 0 24 30" className="-mt-2 h-8 w-6 text-noche/85">
                      <path
                        d="M12 2v10M12 12 3 26h18L12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <Ticket
                      numero={String(1041 + i)}
                      dia={i + 1}
                      arriba={dia}
                      abajo={i % 2 === 0 ? c.hero.lista : undefined}
                      className={i % 2 === 0 ? "rotate-2" : "-rotate-2"}
                    />
                  </div>
                ))}
              </div>
            </div>
            <figcaption className="mt-6 text-center text-sm text-gris">{c.hero.riel}</figcaption>
          </figure>
        </section>

        <Seccion titulo={c.dolores.titulo} className="bg-superficie">
          <div className="hidden grid-cols-2 gap-8 border-b border-percha pb-3 text-xs font-bold tracking-widest text-gris-claro uppercase md:grid">
            <span>{c.dolores.antes}</span>
            <span className="text-tinta">{c.dolores.ahora}</span>
          </div>
          <ul className="divide-y divide-percha/70">
            {c.dolores.items.map((it) => (
              <li key={it.antes} className="grid gap-3 py-6 md:grid-cols-2 md:gap-8">
                <p className="flex gap-3 text-gris">
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-peligro/70" aria-hidden="true" />
                  <span>
                    <span className="sr-only md:hidden">{c.dolores.antes}: </span>
                    {it.antes}
                  </span>
                </p>
                <p className="flex gap-3 text-lg font-semibold text-noche">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-tinta text-white">
                    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
                      <path
                        d="m3.5 8.5 3 3 6-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>
                    <span className="sr-only">{c.dolores.ahora}: </span>
                    {it.ahora}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </Seccion>

        <Seccion id="como-funciona" titulo={c.flujo.titulo} texto={c.flujo.texto}>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {c.flujo.pasos.map((p, i) => (
              <li
                key={p.titulo}
                className="relative rounded-[var(--radius-ticket)] bg-superficie p-5 ring-1 ring-percha/60"
              >
                <Ticket numero={i + 1} dia={i + 1} tamano="chico" />
                <h3 className="titulo-ancho mt-4 text-xl">{p.titulo}</h3>
                <p className="mt-2 text-[15px] text-gris">{p.texto}</p>
              </li>
            ))}
          </ol>
        </Seccion>

        <Seccion id="funciones" titulo={c.funciones.titulo} className="bg-superficie">
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {c.funciones.items.map((f) => (
              <li key={f.titulo} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-tinta-suave text-tinta">
                  <Icono nombre={f.icono} className="size-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold">{f.titulo}</h3>
                  <p className="mt-1 text-[15px] text-gris">{f.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </Seccion>

        <section className="bg-tinta text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="grid size-12 place-items-center rounded-2xl bg-white/10">
                <Icono nombre="sinConexion" className="size-6" />
              </span>
              <h2 className="titulo-ancho mt-6 text-[32px] leading-[1.05] sm:text-5xl">
                {c.sinConexion.titulo}
              </h2>
              <p className="mt-5 text-lg text-white/85">{c.sinConexion.texto}</p>
              <p className="mt-4 text-sm text-white/65">{c.sinConexion.nota}</p>
            </div>
            <ol className="relative mx-auto flex w-full max-w-sm flex-col gap-5" aria-hidden="true">
              <span className="absolute top-6 bottom-6 left-6 border-l-2 border-dashed border-white/30" />
              {c.sinConexion.estados.map((e, i) => (
                <li
                  key={e}
                  className={`relative flex items-center gap-3 rounded-full py-3 pr-5 pl-3 font-semibold shadow-ticket ${
                    i === 0
                      ? "bg-alerta-suave text-alerta"
                      : i === 1
                        ? "bg-white text-tinta"
                        : "bg-ok-suave text-ok"
                  }`}
                >
                  <span
                    className={`size-6 rounded-full ${i === 0 ? "bg-alerta" : i === 1 ? "bg-tinta" : "bg-ok"} ring-4 ring-white/60`}
                  />
                  {e}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Seccion id="seguridad" titulo={c.seguridad.titulo} texto={c.seguridad.texto}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.seguridad.items.map((s) => (
              <li key={s.titulo} className="rounded-2xl bg-superficie p-5 ring-1 ring-percha/60">
                <Icono nombre={s.icono} className="size-6 text-tinta" />
                <h3 className="mt-3 font-bold">{s.titulo}</h3>
                <p className="mt-1.5 text-[15px] text-gris">{s.texto}</p>
              </li>
            ))}
          </ul>
        </Seccion>

        <Seccion titulo={c.empezar.titulo} className="bg-superficie">
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {c.empezar.pasos.map((p, i) => (
              <li key={p.titulo} className="border-t-2 border-noche pt-4">
                <span className="numero-ticket text-4xl text-tinta">{i + 1}</span>
                <h3 className="mt-2 text-lg font-bold">{p.titulo}</h3>
                <p className="mt-1 text-[15px] text-gris">{p.texto}</p>
              </li>
            ))}
          </ol>
          <div className="relative mt-14 overflow-hidden rounded-[28px] bg-dia-3 px-6 py-10 sm:px-12 sm:py-14">
            <span
              className="absolute top-5 left-1/2 size-5 -translate-x-1/2 rounded-full bg-superficie shadow-[inset_0_1px_3px_rgb(0_0_0/0.2)]"
              aria-hidden="true"
            />
            <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="titulo-ancho text-3xl leading-[1.05] sm:text-4xl">{c.empezar.banda}</h2>
                <p className="mt-3 text-lg text-noche/75">{c.empezar.bandaTexto}</p>
              </div>
              <Link
                href={rutaPagina(idioma, "registro")}
                className={`${clasesBoton("primario", "grande")} w-full sm:w-auto`}
              >
                {c.hero.cta}
              </Link>
            </div>
          </div>
        </Seccion>

        <Seccion id="preguntas" titulo={c.preguntas.titulo}>
          <div className="max-w-3xl divide-y divide-percha rounded-2xl bg-superficie ring-1 ring-percha/60">
            {c.preguntas.items.map((q) => (
              <details key={q.p} className="group px-5 py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {q.p}
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-full bg-tinta-suave text-tinta transition group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 text-gris">{q.r}</p>
              </details>
            ))}
          </div>
        </Seccion>
      </main>
      <Pie idioma={idioma} />
    </div>
  );
}
