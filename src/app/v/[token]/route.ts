import { cookieDispositivo } from "@/server/auth/cookies-sesion";
import { usarEnlaceDispositivo } from "@/server/dispositivos";
import { obtenerContexto } from "@/server/entorno";

/**
 * El celular abre el QR que se mostró en la tablet: queda registrado como
 * dispositivo de la tienda y cae en la pantalla del PIN. El enlace sirve UNA
 * vez; si ya se usó o venció, manda a entrar con contraseña.
 */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { env } = obtenerContexto();
  const base = new URL(req.url).origin;
  const r = await usarEnlaceDispositivo(env.DB, token, req.headers.get("user-agent"));
  if (!r) return Response.redirect(`${base}/entrar?vinculo=vencido`, 303);
  return new Response(null, {
    status: 303,
    headers: { location: `${base}/app/pin`, "set-cookie": cookieDispositivo(r.tokenDispositivo) },
  });
}
