import type { Metadata } from "next";
import { cookies } from "next/headers";
import { EncabezadoSitio } from "@/components/sitio/encabezado-sitio";
import { FormContacto } from "@/components/sitio/form-contacto";
import { Pie } from "@/components/pie";
import { diccionario, type Idioma } from "@/lib/i18n";
import { alternatesDe, LOCALE_OG } from "@/lib/seo";
import { COOKIE_SESION } from "@/server/cookies";

export function metadataContacto(idioma: Idioma, enDireccion: boolean): Metadata {
  const c = diccionario(idioma).contacto;
  return {
    title: { absolute: c.meta.titulo },
    description: c.meta.descripcion,
    alternates: alternatesDe("/contacto", idioma, enDireccion),
    openGraph: {
      type: "website",
      title: c.meta.titulo,
      description: c.meta.descripcion,
      locale: LOCALE_OG[idioma],
    },
  };
}

/** Página pública de contacto: el camino de soporte que piden privacidad y términos. */
export async function PaginaContacto({ idioma }: { idioma: Idioma }) {
  const d = diccionario(idioma);
  const haySesion = Boolean((await cookies()).get(COOKIE_SESION));
  return (
    <div className="flex min-h-dvh flex-col">
      <EncabezadoSitio idioma={idioma} haySesion={haySesion} enlaces={[]} />
      <main id="contenido" className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:py-16">
        <h1 className="titulo-ancho text-4xl leading-tight sm:text-5xl">{d.contacto.titulo}</h1>
        <p className="mt-4 text-lg text-gris">{d.contacto.texto}</p>
        <div className="mt-8 rounded-3xl bg-superficie p-5 ring-1 ring-percha/70 sm:p-7">
          <FormContacto />
        </div>
        <p className="mt-4 text-[13px] text-gris">{d.contacto.privacidad}</p>
      </main>
      <Pie idioma={idioma} />
    </div>
  );
}
