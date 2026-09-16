import { z } from "zod";
import { hashClave, necesitaRehash, verificarClave } from "@/server/auth/claves";
import { cookieSesion, siguientePaso } from "@/server/auth/cookies-sesion";
import { cerrarSesion, crearSesion } from "@/server/auth/sesiones";
import { verificarTurnstile } from "@/server/auth/turnstile";
import { sentenciaAuditoria } from "@/server/auditoria";
import { COOKIE_SESION } from "@/server/cookies";
import { esquemaCorreo } from "@/server/cuentas/validaciones";
import { ErrorApp } from "@/server/errores";
import { limitar, reiniciarLimite } from "@/server/limites";
import { ruta } from "@/server/ruta";

const cuerpo = z.object({ correo: esquemaCorreo, clave: z.string().min(1).max(200) });

interface FilaUsuario {
  id: string;
  tintoreria_id: string;
  rol: string;
  clave_hash: string | null;
  totp_activo: number;
  debe_cambiar_clave: number;
  activo: number;
  t_estado: string;
}

/** Entrar con correo y contraseña (dueños y gerentes). */
export const POST = ruta({
  acceso: "publico",
  cuerpo,
  limite: { clave: (c) => `entrar:ip:${c.ipHash}`, max: 30, ventanaSeg: 900 },
  manejar: async (c) => {
    // 1. Escudo anti-robots ANTES de mirar la contraseña.
    const t = await verificarTurnstile(c.vars.TURNSTILE_SECRET_KEY, c.req.headers.get("x-turnstile"), c.ip);
    if (t === "rechazado") throw new ErrorApp(400, "turnstile");

    // 2. Límite por correo (frena a quien prueba claves de una cuenta desde muchas IP).
    const claveLimite = `entrar:correo:${c.cuerpo.correo}`;
    const porCorreo = await limitar(c.db, claveLimite, 8, 900, c.ahora);
    if (!porCorreo.permitido) {
      throw new ErrorApp(429, "demasiados_intentos", {
        minutos: Math.max(1, Math.ceil((porCorreo.reiniciaEn - c.ahora) / 60_000)),
      });
    }

    const u = await c.db
      .prepare(
        `select u.id, u.tintoreria_id, u.rol, u.clave_hash, u.totp_activo, u.debe_cambiar_clave, u.activo, t.estado as t_estado
         from usuarios u join tintorerias t on t.id = u.tintoreria_id
         /* global: el correo de acceso es único */ where u.correo = ? and u.rol in ('dueno', 'gerente')`,
      )
      .bind(c.cuerpo.correo)
      .first<FilaUsuario>();

    const ok = await verificarClave(c.cuerpo.clave, u?.clave_hash);
    if (!u || !ok || !u.activo) throw new ErrorApp(401, "credenciales");
    if (u.t_estado !== "activa") throw new ErrorApp(403, "cuenta_suspendida");
    await reiniciarLimite(c.db, claveLimite);

    const extra: D1PreparedStatement[] = [
      c.db
        .prepare("update usuarios set ultimo_ingreso_en = ? where id = ? and tintoreria_id = ?")
        .bind(c.ahora, u.id, u.tintoreria_id),
      sentenciaAuditoria(
        c.db,
        {
          tintoreriaId: u.tintoreria_id,
          usuarioId: u.id,
          accion: "sesion.entrar",
          detalle: { tipo: "cuenta" },
        },
        c.ahora,
      ),
    ];
    if (u.clave_hash && necesitaRehash(u.clave_hash)) {
      extra.push(
        c.db
          .prepare("update usuarios set clave_hash = ? where id = ? and tintoreria_id = ?")
          .bind(await hashClave(c.cuerpo.clave), u.id, u.tintoreria_id),
      );
    }
    await c.db.batch(extra);

    // Sesión nueva siempre (la anterior de este navegador se cierra).
    await cerrarSesion(c.db, c.cookies[COOKIE_SESION]);
    const usuario = {
      rol: u.rol,
      totpActivo: u.totp_activo === 1,
      debeCambiarClave: u.debe_cambiar_clave === 1,
    };
    const necesita = u.rol === "dueno" || u.totp_activo === 1;
    const token = await crearSesion(
      c.db,
      {
        tintoreriaId: u.tintoreria_id,
        usuarioId: u.id,
        tipo: "cuenta",
        segundoFactorOk: !necesita,
        agente: c.req.headers.get("user-agent"),
      },
      c.ahora,
    );
    c.ponerCookie(cookieSesion(token, "cuenta"));
    return { ok: true, siguiente: siguientePaso(usuario, !necesita) };
  },
});
