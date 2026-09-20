import Link from "next/link";
import { MarcoAcceso } from "@/components/acceso/marco-acceso";
import { Aviso } from "@/components/ui/aviso";
import { clasesBoton } from "@/components/ui/boton";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { verificarCorreo } from "@/server/cuentas/verificacion";
import { obtenerContexto } from "@/server/entorno";

export const metadata = { title: "Confirmar el correo · Confirm your email", robots: { index: false } };

/** El enlace del correo de bienvenida: confirma que la dirección existe. */
export default async function PaginaVerificar({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const { d } = await obtenerTextos();
  const { env } = obtenerContexto();
  const ok = await verificarCorreo(env.DB, token ?? "");
  const t = d.acceso;
  return (
    <MarcoAcceso>
      <h1 className="titulo-ancho text-3xl leading-tight">
        {ok ? t.correoVerificado : t.correoNoVerificado}
      </h1>
      <Aviso tono={ok ? "ok" : "alerta"} className="mt-4">
        {ok ? t.correoVerificadoTexto : t.correoNoVerificadoTexto}
      </Aviso>
      <Link href="/app" className={`${clasesBoton("primario", "grande", true)} mt-6`}>
        {t.irAlPanel}
      </Link>
    </MarcoAcceso>
  );
}
