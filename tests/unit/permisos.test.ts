import { describe, expect, it } from "vitest";
import {
  esRol,
  permisosDe,
  puedeAutorizar,
  puedeGestionarRol,
  tienePermiso,
  PERMISOS,
  ROLES,
} from "@/server/permisos";

/**
 * Matriz completa escrita a mano: si alguien cambia un permiso en el código sin
 * cambiarlo aquí a propósito, esta prueba se pone en rojo.
 */
const ESPERADO = {
  dueno: [...PERMISOS],
  gerente: PERMISOS.filter((p) => p !== "datos.exportar"),
  cajero: [
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
  ],
  planta: ["ordenes.ver", "ordenes.cambiar_estado"],
  repartidor: ["ordenes.ver", "ordenes.ver_montos", "ordenes.entregar", "pagos.cobrar", "clientes.ver"],
} as const;

describe("matriz de permisos (candado)", () => {
  it.each(ROLES)("el rol %s tiene exactamente sus permisos", (rol) => {
    expect(permisosDe(rol).sort()).toEqual([...ESPERADO[rol]].sort());
    for (const p of PERMISOS)
      expect(tienePermiso(rol, p)).toBe((ESPERADO[rol] as readonly string[]).includes(p));
  });

  it("nadie más que el dueño exporta todos los datos", () => {
    expect(ROLES.filter((r) => tienePermiso(r, "datos.exportar"))).toEqual(["dueno"]);
  });

  it("un cajero no anula, no hace descuentos grandes, no reimprime ni abre el cajón sin venta", () => {
    for (const p of [
      "ordenes.anular",
      "ordenes.descuento_mayor",
      "recibos.reimprimir",
      "caja.sin_venta",
      "pagos.anular",
    ] as const) {
      expect(tienePermiso("cajero", p)).toBe(false);
      expect(puedeAutorizar("gerente", p)).toBe(true);
      expect(puedeAutorizar("cajero", p)).toBe(false);
    }
  });

  it("quién gestiona a quién", () => {
    expect(puedeGestionarRol("dueno", "dueno")).toBe(true);
    expect(puedeGestionarRol("gerente", "cajero")).toBe(true);
    expect(puedeGestionarRol("gerente", "gerente")).toBe(false);
    expect(puedeGestionarRol("gerente", "dueno")).toBe(false);
    expect(puedeGestionarRol("cajero", "planta")).toBe(false);
  });

  it("valida roles", () => {
    expect(esRol("planta")).toBe(true);
    expect(esRol("admin")).toBe(false);
  });
});
