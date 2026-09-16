import { notFound, redirect } from "next/navigation";
import { obtenerContexto } from "@/server/entorno";
import { codigoDeEtiqueta } from "@/server/publico/orden";

/** QR de la etiqueta de una prenda escaneado por el cliente → página de su orden. */
export default async function PaginaEtiqueta({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const { env } = obtenerContexto();
  const publico = await codigoDeEtiqueta(env.DB, codigo);
  if (!publico) notFound();
  redirect(`/t/${publico}`);
}
