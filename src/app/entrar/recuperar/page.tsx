import type { Metadata } from "next";
import { FormRecuperar } from "@/components/acceso/form-claves";
import { MarcoAcceso } from "@/components/acceso/marco-acceso";
import { obtenerContexto } from "@/server/entorno";

export const metadata: Metadata = {
  title: "Recuperar contraseña · Reset password",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default function PaginaRecuperar() {
  const { vars } = obtenerContexto();
  return (
    <MarcoAcceso>
      <FormRecuperar siteKey={vars.TURNSTILE_SITE_KEY ?? null} />
    </MarcoAcceso>
  );
}
