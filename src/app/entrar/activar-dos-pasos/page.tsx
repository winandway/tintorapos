import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormActivarDosPasos } from "@/components/acceso/form-dos-pasos";
import { MarcoAcceso } from "@/components/acceso/marco-acceso";
import { contextoPagina } from "@/server/pagina";

export const metadata: Metadata = { title: "Dos pasos · Two-step", robots: { index: false } };

export default async function PaginaActivar() {
  const { sesion } = await contextoPagina();
  if (!sesion || sesion.tipo !== "cuenta") redirect("/entrar");
  if (sesion.usuario.totpActivo) redirect(sesion.segundoFactorOk ? "/app" : "/entrar/dos-pasos");
  return (
    <MarcoAcceso>
      <FormActivarDosPasos />
    </MarcoAcceso>
  );
}
