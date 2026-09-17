import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormEntrar } from "@/components/acceso/form-entrar";
import { MarcoAcceso } from "@/components/acceso/marco-acceso";
import { Aviso } from "@/components/ui/aviso";
import { diccionario } from "@/lib/i18n";
import { obtenerIdioma } from "@/lib/i18n/servidor";
import { siguientePaso } from "@/server/auth/cookies-sesion";
import { necesitaDosPasos } from "@/server/auth/sesiones";
import { contextoPagina } from "@/server/pagina";

export const metadata: Metadata = { title: "Entrar · Sign in", robots: { index: false } };

export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ vinculo?: string }>;
}) {
  const c = await contextoPagina();
  const { vinculo } = await searchParams;
  if (
    c.sesion &&
    siguientePaso(c.sesion.usuario, !necesitaDosPasos(c.sesion) || c.sesion.segundoFactorOk) === "app"
  ) {
    redirect("/app");
  }
  return (
    <MarcoAcceso>
      {vinculo === "vencido" && (
        <Aviso tono="alerta" className="mb-4">
          {diccionario(await obtenerIdioma()).ajustes.dispositivos.enlaceVencido}
        </Aviso>
      )}
      <FormEntrar siteKey={c.vars.TURNSTILE_SITE_KEY ?? null} hayDispositivo={Boolean(c.dispositivo)} />
    </MarcoAcceso>
  );
}
