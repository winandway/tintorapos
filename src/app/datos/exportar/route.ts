import { sentenciaAuditoria } from "@/server/auditoria";
import { ErrorApp } from "@/server/errores";
import { csvDeTabla, volcarTintoreria, type TablaCsv } from "@/server/respaldos";
import { ruta } from "@/server/ruta";

const SENSIBLES = new Set([
  "clave_hash",
  "pin_hash",
  "totp_secreto",
  "codigos_respaldo",
  "token_hash",
  "totp_ultimo_paso",
]);

/** Tus datos son tuyos: el dueño descarga todo en JSON o las tablas principales en CSV. */
export const GET = ruta({
  acceso: "cuenta",
  permiso: "datos.exportar",
  limite: { clave: (c) => `exportar:${c.sesion?.tintoreria.id}`, max: 20, ventanaSeg: 3600 },
  manejar: async (c) => {
    const u = new URL(c.req.url).searchParams;
    const formato = u.get("formato") ?? "json";
    const tabla = u.get("tabla") ?? "";
    if (formato === "csv" && !["clientes", "ordenes", "pagos"].includes(tabla))
      throw new ErrorApp(400, "datos_invalidos");
    const s = c.sesion!;
    const volcado = await volcarTintoreria(c.db, s.tintoreria.id, c.ahora);
    // Nunca salen secretos (contraseñas, PIN, dos pasos, tokens), ni siquiera al dueño.
    for (const filas of Object.values(volcado.tablas))
      for (const f of filas) for (const k of Object.keys(f)) if (SENSIBLES.has(k)) delete f[k];
    await sentenciaAuditoria(
      c.db,
      {
        tintoreriaId: s.tintoreria.id,
        usuarioId: s.usuario.id,
        accion: "datos.exportados",
        detalle: { formato, tabla },
      },
      c.ahora,
    ).run();
    const fecha = new Date(c.ahora).toISOString().slice(0, 10);
    if (formato === "csv") {
      return new Response(csvDeTabla(volcado, tabla as TablaCsv), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="tintora-${tabla}-${fecha}.csv"`,
          "cache-control": "no-store",
        },
      });
    }
    return new Response(JSON.stringify(volcado, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="tintora-datos-${fecha}.json"`,
        "cache-control": "no-store",
      },
    });
  },
});
