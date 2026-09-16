import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormCambiarClave } from "@/components/acceso/form-claves";
import { MarcoAcceso } from "@/components/acceso/marco-acceso";
import { contextoPagina } from "@/server/pagina";

export const metadata: Metadata = { title: "Contraseña · Password", robots: { index: false } };

export default async function PaginaCambiarClave() {
  const { sesion } = await contextoPagina();
  if (!sesion || sesion.tipo !== "cuenta") redirect("/entrar");
  return (
    <MarcoAcceso>
      <FormCambiarClave />
    </MarcoAcceso>
  );
}
