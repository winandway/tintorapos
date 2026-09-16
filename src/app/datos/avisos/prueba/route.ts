import { z } from "zod";
import { nuevoId } from "@/lib/codigos";
import { procesarCola } from "@/server/avisos";
import { normalizarTelefono } from "@/server/cuentas/validaciones";
import { ErrorApp } from "@/server/errores";
import { ruta } from "@/server/ruta";

/** Manda un aviso de prueba a un celular o correo que escribe el dueño (el suyo). */
export const POST = ruta({
  acceso: "sesion",
  permiso: "ajustes.avisos",
  cuerpo: z.object({ canal: z.enum(["sms", "correo"]), destino: z.string().trim().min(3).max(120) }),
  limite: { clave: (c) => `aviso-prueba:${c.sesion?.tintoreria.id}`, max: 10, ventanaSeg: 3600 },
  manejar: async (c) => {
    const s = c.sesion!;
    let destino = c.cuerpo.destino;
    if (c.cuerpo.canal === "sms") {
      const t = normalizarTelefono(destino, s.tintoreria.pais);
      if (!t) throw new ErrorApp(400, "datos_invalidos", {}, { destino: "telefono" });
      destino = t.e164;
    } else if (!z.email().safeParse(destino).success) {
      throw new ErrorApp(400, "datos_invalidos", {}, { destino: "correo" });
    }
    const id = nuevoId();
    const texto =
      s.tintoreria.idioma === "en"
        ? `${s.tintoreria.nombre}: test message from Tintora POS.`
        : `${s.tintoreria.nombre}: mensaje de prueba de Tintora POS.`;
    await c.db
      .prepare(
        "insert into avisos (id, tintoreria_id, tipo, canal, destino, idioma, asunto, cuerpo, programado_en, creado_en) values (?, ?, 'prueba', ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        id,
        s.tintoreria.id,
        c.cuerpo.canal,
        destino,
        s.tintoreria.idioma,
        "Tintora POS",
        texto,
        c.ahora,
        c.ahora,
      )
      .run();
    await procesarCola(c.env, c.vars, { ids: [id] }, c.ahora);
    const f = await c.db
      .prepare("select estado, error from avisos where tintoreria_id = ? and id = ?")
      .bind(s.tintoreria.id, id)
      .first<{ estado: string; error: string | null }>();
    return { estado: f?.estado, error: f?.error };
  },
});
