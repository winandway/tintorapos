import { redirect } from "next/navigation";
import { PantallaPin } from "@/components/app/pantalla-pin";
import { contextoPagina } from "@/server/pagina";

export default async function PaginaPin() {
  const { dispositivo } = await contextoPagina();
  if (!dispositivo) redirect("/entrar");
  return <PantallaPin />;
}
