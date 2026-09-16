import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormEntrar } from "@/components/acceso/form-entrar";
import { MarcoAcceso } from "@/components/acceso/marco-acceso";
import { siguientePaso } from "@/server/auth/cookies-sesion";
import { necesitaDosPasos } from "@/server/auth/sesiones";
import { contextoPagina } from "@/server/pagina";

export const metadata: Metadata = { title: "Entrar · Sign in", robots: { index: false } };

export default async function PaginaEntrar() {
  const c = await contextoPagina();
  if (
    c.sesion &&
    siguientePaso(c.sesion.usuario, !necesitaDosPasos(c.sesion) || c.sesion.segundoFactorOk) === "app"
  ) {
    redirect("/app");
  }
  return (
    <MarcoAcceso>
      <FormEntrar siteKey={c.vars.TURNSTILE_SITE_KEY ?? null} hayDispositivo={Boolean(c.dispositivo)} />
    </MarcoAcceso>
  );
}
