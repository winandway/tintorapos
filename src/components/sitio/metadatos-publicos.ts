import type { Metadata } from "next";
import type { DocumentoLegal } from "@/lib/contenido/legal";
import type { Idioma } from "@/lib/i18n";
import { alternatesDe, LOCALE_OG } from "@/lib/seo";

export function metadataLegal(
  doc: DocumentoLegal,
  interna: string,
  idioma: Idioma,
  enDireccion: boolean,
): Metadata {
  const alternates = alternatesDe(interna, idioma, enDireccion);
  return {
    title: doc.titulo,
    description: doc.descripcion,
    alternates,
    openGraph: {
      title: doc.titulo,
      description: doc.descripcion,
      url: alternates?.canonical as string,
      locale: LOCALE_OG[idioma],
    },
  };
}

export function metadataRegistro(idioma: Idioma, enDireccion: boolean): Metadata {
  const titulo =
    idioma === "en"
      ? "Start your free trial of dry cleaning POS software | Tintora POS"
      : "Prueba gratis el software para tintorerías | Tintora POS";
  const descripcion =
    idioma === "en"
      ? "Create your Tintora POS account and try it free for 14 days. No credit card, nothing to install."
      : "Crea tu cuenta de Tintora POS y pruébalo 14 días gratis, sin tarjeta y sin instalar nada.";
  const alternates = alternatesDe("/registro", idioma, enDireccion);
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates,
    openGraph: {
      title: titulo,
      description: descripcion,
      url: alternates?.canonical as string,
      locale: LOCALE_OG[idioma],
    },
  };
}
