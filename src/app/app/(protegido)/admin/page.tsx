import { redirect } from "next/navigation";
import { PantallaAdmin } from "@/components/admin/pantalla-admin";
import { esAdmin } from "@/lib/soporte";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaAdmin() {
  const { sesion, vars } = await exigirSesion();
  if (!esAdmin(vars, sesion.usuario.correo)) redirect("/app");
  return <PantallaAdmin />;
}
