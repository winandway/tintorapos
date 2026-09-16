import { z } from "zod";
import { abrirTurno, resumenTurno, turnoAbierto } from "@/server/caja";
import { tienePermiso } from "@/server/permisos";
import { ruta } from "@/server/ruta";

/** Estado de la caja de esta tienda. El efectivo esperado solo lo ve quien puede ver diferencias. */
export const GET = ruta({
  acceso: "sesion",
  permiso: "caja.abrir",
  manejar: async (c) => {
    const s = c.sesion!;
    const turno = await turnoAbierto(c.db, s.tintoreria.id, s.sucursalId);
    if (!turno) return { turno: null };
    const r = await resumenTurno(c.db, s.tintoreria.id, turno.id);
    if (tienePermiso(s.usuario.rol, "caja.ver_diferencias")) return { turno: r };
    return {
      turno: {
        turno: r.turno,
        pagosCantidad: r.pagosCantidad,
        movimientos: r.movimientos.map((m) => ({
          ...m,
          montoCents: m.tipo === "sin_venta" ? 0 : m.montoCents,
        })),
      },
    };
  },
});

export const POST = ruta({
  acceso: "sesion",
  permiso: "caja.abrir",
  cuerpo: z.object({ fondoCents: z.number().int().min(0).max(10_000_000) }),
  manejar: async (c) => ({ id: await abrirTurno(c.db, c.sesion!, c.cuerpo.fondoCents, c.ahora) }),
});
