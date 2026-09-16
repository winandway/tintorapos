import type { Metadata } from "next";
import { FormRestablecer } from "@/components/acceso/form-claves";
import { MarcoAcceso } from "@/components/acceso/marco-acceso";

export const metadata: Metadata = { title: "Nueva contraseña · New password", robots: { index: false } };

export default async function PaginaRestablecer({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <MarcoAcceso>
      <FormRestablecer token={typeof token === "string" ? token : ""} />
    </MarcoAcceso>
  );
}
