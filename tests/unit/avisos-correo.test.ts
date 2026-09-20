import { describe, expect, it } from "vitest";
import { aceptaCorreoAlEscribir } from "@/components/clientes/modal-cliente";

/**
 * CANDADO: los avisos de esta tienda salen por correo. Si la palomita hay que
 * acordarse de marcarla, no se marca nunca y el cliente no recibe el «tu ropa
 * está lista».
 */
describe("avisos por correo del cliente", () => {
  it("se marca sola en cuanto el cliente escribe su correo", () => {
    expect(aceptaCorreoAlEscribir("", "ana@ejemplo.com", false)).toBe(true);
  });

  it("respeta que la hayan quitado a mano mientras siga habiendo correo", () => {
    expect(aceptaCorreoAlEscribir("ana@ejemplo.com", "ana2@ejemplo.com", false)).toBe(false);
    expect(aceptaCorreoAlEscribir("ana@ejemplo.com", "ana2@ejemplo.com", true)).toBe(true);
  });

  it("se apaga si borran el correo (no se avisa a una dirección que no existe)", () => {
    expect(aceptaCorreoAlEscribir("ana@ejemplo.com", "", true)).toBe(false);
    expect(aceptaCorreoAlEscribir("ana@ejemplo.com", "   ", true)).toBe(false);
  });
});
