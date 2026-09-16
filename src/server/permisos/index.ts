/**
 * Roles y permisos. Una sola matriz para todo el sistema.
 * Candado: tests/unit/permisos.test.ts recorre la matriz completa.
 */
export const ROLES = ["dueno", "gerente", "cajero", "planta", "repartidor"] as const;
export type Rol = (typeof ROLES)[number];

export const PERMISOS = [
  "ordenes.crear",
  "ordenes.ver",
  "ordenes.ver_montos",
  "ordenes.cambiar_estado",
  "ordenes.entregar",
  "ordenes.anular",
  "ordenes.descuento_mayor",
  "ordenes.precio_manual",
  "ordenes.abandonar",
  "pagos.cobrar",
  "pagos.anular",
  "caja.abrir",
  "caja.cerrar",
  "caja.movimientos",
  "caja.sin_venta",
  "caja.ver_diferencias",
  "clientes.ver",
  "clientes.editar",
  "clientes.eliminar",
  "recibos.reimprimir",
  "reportes.ver",
  "ajustes.tienda",
  "ajustes.catalogo",
  "ajustes.avisos",
  "empleados.gestionar",
  "dispositivos.gestionar",
  "datos.exportar",
  "auditoria.ver",
] as const;
export type Permiso = (typeof PERMISOS)[number];

const SOLO_DUENO: Permiso[] = ["datos.exportar"];

const MATRIZ: Record<Rol, ReadonlySet<Permiso>> = {
  dueno: new Set(PERMISOS),
  gerente: new Set(PERMISOS.filter((p) => !SOLO_DUENO.includes(p))),
  cajero: new Set<Permiso>([
    "ordenes.crear",
    "ordenes.ver",
    "ordenes.ver_montos",
    "ordenes.cambiar_estado",
    "ordenes.entregar",
    "pagos.cobrar",
    "caja.abrir",
    "caja.cerrar",
    "clientes.ver",
    "clientes.editar",
  ]),
  planta: new Set<Permiso>(["ordenes.ver", "ordenes.cambiar_estado"]),
  repartidor: new Set<Permiso>([
    "ordenes.ver",
    "ordenes.ver_montos",
    "ordenes.entregar",
    "pagos.cobrar",
    "clientes.ver",
  ]),
};

export function esRol(v: unknown): v is Rol {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

export function tienePermiso(rol: Rol, permiso: Permiso): boolean {
  return MATRIZ[rol].has(permiso);
}

export function permisosDe(rol: Rol): Permiso[] {
  return PERMISOS.filter((p) => MATRIZ[rol].has(p));
}

/** Quién puede crear o editar a quién: nadie toca a alguien de rango igual o mayor, salvo el dueño. */
export function puedeGestionarRol(actor: Rol, objetivo: Rol): boolean {
  if (actor === "dueno") return true;
  if (actor === "gerente") return objetivo !== "dueno" && objetivo !== "gerente";
  return false;
}

/** Roles que pueden autorizar con su PIN lo que otro no puede hacer. */
export function puedeAutorizar(rol: Rol, permiso: Permiso): boolean {
  return (rol === "dueno" || rol === "gerente") && tienePermiso(rol, permiso);
}
