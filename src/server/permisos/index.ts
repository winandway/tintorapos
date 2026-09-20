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

/** Para la pantalla de empleados: los permisos agrupados como los ve una persona. */
export const AREAS = [
  {
    clave: "ordenes",
    permisos: [
      "ordenes.crear",
      "ordenes.ver",
      "ordenes.ver_montos",
      "ordenes.cambiar_estado",
      "ordenes.entregar",
      "ordenes.anular",
      "ordenes.descuento_mayor",
      "ordenes.precio_manual",
      "ordenes.abandonar",
      "recibos.reimprimir",
    ],
  },
  {
    clave: "dinero",
    permisos: [
      "pagos.cobrar",
      "pagos.anular",
      "caja.abrir",
      "caja.cerrar",
      "caja.movimientos",
      "caja.sin_venta",
      "caja.ver_diferencias",
      "reportes.ver",
    ],
  },
  { clave: "clientes", permisos: ["clientes.ver", "clientes.editar", "clientes.eliminar"] },
  {
    clave: "tienda",
    permisos: [
      "ajustes.tienda",
      "ajustes.catalogo",
      "ajustes.avisos",
      "empleados.gestionar",
      "dispositivos.gestionar",
      "datos.exportar",
      "auditoria.ver",
    ],
  },
] as const satisfies readonly { clave: string; permisos: readonly Permiso[] }[];

export function esPermiso(v: unknown): v is Permiso {
  return typeof v === "string" && (PERMISOS as readonly string[]).includes(v);
}

export interface UsuarioConPermisos {
  rol: Rol;
  /** Palomitas a la medida. Si es null, manda el rol. */
  permisos?: Permiso[] | null;
}

/** Lo que de verdad puede hacer una persona: sus palomitas, o las de su rol. */
export function permisosEfectivos(u: UsuarioConPermisos): Permiso[] {
  if (!u.permisos) return permisosDe(u.rol);
  const propios = new Set(u.permisos);
  return PERMISOS.filter((p) => propios.has(p));
}

export function usuarioPuede(u: UsuarioConPermisos, permiso: Permiso): boolean {
  return u.permisos ? u.permisos.includes(permiso) : tienePermiso(u.rol, permiso);
}

/**
 * Nadie reparte lo que no tiene: a un empleado se le puede marcar cualquier
 * permiso que tenga quien lo está editando, ni uno más. El rol solo decide qué
 * palomitas vienen marcadas de entrada.
 */
export function permisosQueSePuedenDar(actor: UsuarioConPermisos): Permiso[] {
  return permisosEfectivos(actor);
}

/** Recorta lo pedido a lo que el actor puede dar. Devuelve null si son los del rol. */
export function permisosAGuardar(
  actor: UsuarioConPermisos,
  rolObjetivo: Rol,
  pedidos: string[] | null | undefined,
): Permiso[] | null {
  if (!pedidos) return null;
  const permitidos = new Set(permisosQueSePuedenDar(actor));
  const limpios = PERMISOS.filter((p) => pedidos.includes(p) && permitidos.has(p));
  const delRol = permisosDe(rolObjetivo);
  // Si quedó exactamente lo del rol, no se guarda nada: manda el rol.
  const igual = limpios.length === delRol.length && limpios.every((p) => delRol.includes(p));
  return igual ? null : limpios;
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
