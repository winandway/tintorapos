import { encolarAvisos, procesarCola } from "@/server/avisos";
import { crearOrden, esquemaNuevaOrden } from "@/server/ordenes/crear";
import { listarOrdenes, ESTADOS, type FiltroOrdenes } from "@/server/ordenes/consultas";
import { usuarioPuede } from "@/server/permisos";
import { ruta } from "@/server/ruta";

export const GET = ruta({
  acceso: "sesion",
  permiso: "ordenes.ver",
  manejar: async (c) => {
    const u = new URL(c.req.url).searchParams;
    const estado = u.get("estado") ?? "abiertas";
    const filtro: FiltroOrdenes = {
      estado: (["abiertas", "atrasadas", "todas", ...ESTADOS] as string[]).includes(estado)
        ? (estado as FiltroOrdenes["estado"])
        : "abiertas",
      q: u.get("q")?.slice(0, 60) ?? undefined,
      desde: /^\d{4}-\d{2}-\d{2}$/.test(u.get("desde") ?? "") ? u.get("desde")! : undefined,
      hasta: /^\d{4}-\d{2}-\d{2}$/.test(u.get("hasta") ?? "") ? u.get("hasta")! : undefined,
      antesDe: Number(u.get("antes") ?? "") || undefined,
      limite: 50,
    };
    const s = c.sesion!;
    const ordenes = await listarOrdenes(c.db, s.tintoreria.id, s.tintoreria.zonaHoraria, filtro, c.ahora);
    const montos = usuarioPuede(s.usuario, "ordenes.ver_montos");
    return { ordenes: montos ? ordenes : ordenes.map((o) => ({ ...o, totalCents: 0, saldoCents: 0 })) };
  },
});

export const POST = ruta({
  acceso: "sesion",
  permiso: "ordenes.crear",
  cuerpo: esquemaNuevaOrden,
  manejar: async (c) => {
    const r = await crearOrden(c.db, c.sesion!, c.cuerpo, c.ahora);
    if (!r.repetida) {
      const ids = await encolarAvisos(
        c.db,
        c.vars.APP_URL,
        { tintoreriaId: c.sesion!.tintoreria.id, ordenId: r.id, tipo: "recibida" },
        c.ahora,
      );
      if (ids.length) c.esperarLuego(procesarCola(c.env, c.vars, { ids }));
    }
    return r;
  },
});
