import type { Metadata } from "next";
import { FormRegistro } from "@/components/acceso/form-registro";
import { MarcoAcceso } from "@/components/acceso/marco-acceso";
import { obtenerContexto } from "@/server/entorno";

export const metadata: Metadata = {
  title: "Prueba gratis · Free trial",
  description: "Crea tu cuenta de Tintora POS y pruébalo 14 días gratis, sin tarjeta.",
};

export const dynamic = "force-dynamic";

export default function PaginaRegistro() {
  const { vars } = obtenerContexto();
  return (
    <MarcoAcceso>
      <FormRegistro siteKey={vars.TURNSTILE_SITE_KEY ?? null} />
    </MarcoAcceso>
  );
}
