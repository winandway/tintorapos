import { leerSesion, type Sesion } from "@/server/auth/sesiones";

export async function sesionDe(db: D1Database, token: string): Promise<Sesion> {
  const s = await leerSesion(db, token);
  if (!s) throw new Error("Sesión de prueba inválida");
  return s;
}
