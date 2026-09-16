import { cookies } from "next/headers";
import { Pie } from "@/components/pie";
import { EncabezadoSitio } from "@/components/sitio/encabezado-sitio";
import type { DocumentoLegal } from "@/lib/contenido/legal";
import { diccionario, type Idioma } from "@/lib/i18n";
import { COOKIE_SESION } from "@/server/cookies";

/** Página legal: una columna legible con índice arriba. */
export async function PaginaLegal({
  idioma,
  doc,
  correoSoporte,
}: {
  idioma: Idioma;
  doc: DocumentoLegal;
  correoSoporte: string | undefined;
}) {
  const haySesion = (await cookies()).has(COOKIE_SESION);
  const d = diccionario(idioma).comun;
  return (
    <div className="flex min-h-dvh flex-col">
      <EncabezadoSitio idioma={idioma} haySesion={haySesion} enlaces={[{ href: "/docs", texto: d.docs }]} />
      <main id="contenido" className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <h1 className="titulo-ancho text-4xl leading-[1.05] sm:text-5xl">{doc.titulo}</h1>
          <p className="mt-3 text-sm text-gris">{doc.actualizado}</p>
          <nav aria-label={doc.titulo} className="mt-8 rounded-2xl bg-superficie p-5 ring-1 ring-percha/60">
            <ol className="grid gap-x-6 gap-y-1.5 text-[15px] sm:grid-cols-2">
              {doc.secciones.map((s, i) => (
                <li key={s.titulo}>
                  <a href={`#s${i + 1}`} className="text-tinta hover:underline">
                    {s.titulo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="mt-10 space-y-10">
            {doc.secciones.map((s, i) => (
              <section key={s.titulo} id={`s${i + 1}`} className="scroll-mt-20">
                <h2 className="text-xl font-bold">{s.titulo}</h2>
                {s.parrafos.map((p) => (
                  <p key={p} className="mt-3 text-[17px] leading-relaxed text-noche/90">
                    {p}
                  </p>
                ))}
                {s.lista && (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-[17px] leading-relaxed text-noche/90 marker:text-tinta">
                    {s.lista.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
            <section className="rounded-2xl bg-tinta-suave p-6">
              <h2 className="text-xl font-bold">{doc.contacto.titulo}</h2>
              <p className="mt-2 text-[17px]">
                {correoSoporte ? (
                  <>
                    {doc.contacto.con}{" "}
                    <a href={`mailto:${correoSoporte}`} className="font-semibold text-tinta underline">
                      {correoSoporte}
                    </a>
                    .
                  </>
                ) : (
                  doc.contacto.sin
                )}
              </p>
            </section>
          </div>
        </article>
      </main>
      <Pie idioma={idioma} />
    </div>
  );
}
