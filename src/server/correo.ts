/**
 * Correo saliente con la binding de YaDominios Cloud (env.EMAIL, requiere dominio
 * propio y la variable EMAIL_FROM). Si no está configurado NO se finge el envío:
 * devuelve «no_configurado» y el canario /datos/salud lo marca.
 */
import type { Variables } from "@/env";

export interface Correo {
  para: string;
  asunto: string;
  texto: string;
  html?: string;
}

interface BindingCorreo {
  send(mensaje: {
    to: string;
    from: { email: string; name: string };
    subject: string;
    text: string;
    html?: string;
  }): Promise<unknown>;
}

export type ResultadoCorreo =
  { estado: "enviado" } | { estado: "no_configurado" } | { estado: "fallido"; error: string };

export function correoConfigurado(env: CloudflareEnv, vars: Variables): boolean {
  const binding = (env as unknown as { EMAIL?: Partial<BindingCorreo> }).EMAIL;
  return Boolean(binding && typeof binding.send === "function" && vars.EMAIL_FROM);
}

export async function enviarCorreo(env: CloudflareEnv, vars: Variables, c: Correo): Promise<ResultadoCorreo> {
  const binding = (env as unknown as { EMAIL?: BindingCorreo }).EMAIL;
  if (!binding || typeof binding.send !== "function" || !vars.EMAIL_FROM) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[correo sin configurar] Para: ${c.para}\nAsunto: ${c.asunto}\n${c.texto}`);
    }
    return { estado: "no_configurado" };
  }
  try {
    await binding.send({
      to: c.para,
      from: { email: vars.EMAIL_FROM, name: "Tintora POS" },
      subject: c.asunto,
      text: c.texto,
      ...(c.html ? { html: c.html } : {}),
    });
    return { estado: "enviado" };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("No se pudo enviar el correo:", error);
    return { estado: "fallido", error: error.slice(0, 300) };
  }
}
