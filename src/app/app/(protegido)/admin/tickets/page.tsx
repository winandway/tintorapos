import { redirect } from "next/navigation";
import { PantallaTickets } from "@/components/admin/pantalla-tickets";
import { esAdmin } from "@/lib/soporte";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaTickets() {
  const { sesion, vars } = await exigirSesion();
  if (!esAdmin(vars, sesion.usuario.correo)) redirect("/app");
  return <PantallaTickets />;
}
