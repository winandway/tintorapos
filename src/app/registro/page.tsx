import type { Metadata } from "next";
import { FormRegistro } from "@/components/acceso/form-registro";
import { MarcoAcceso } from "@/components/acceso/marco-acceso";
import { metadataRegistro } from "@/components/sitio/metadatos-publicos";
import { obtenerIdioma } from "@/lib/i18n/servidor";
import { obtenerContexto } from "@/server/entorno";

export async function generateMetadata(): Promise<Metadata> {
  return metadataRegistro(await obtenerIdioma(), false);
}

export const dynamic = "force-dynamic";

export default function PaginaRegistro() {
  const { vars } = obtenerContexto();
  return (
    <MarcoAcceso>
      <FormRegistro siteKey={vars.TURNSTILE_SITE_KEY ?? null} />
    </MarcoAcceso>
  );
}
