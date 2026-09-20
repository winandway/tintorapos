import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useBorrador } from "@/lib/use-borrador";
import {
  borrarBorrador,
  borrarTodosLosBorradores,
  claveBorrador,
  guardarBorrador,
  leerBorrador,
  PREFIJO,
  sinCamposSensibles,
  VIGENCIA_MS,
} from "@/lib/borradores";

/**
 * CANDADO: ningún formulario pierde lo escrito (regla de la casa del 20 de
 * septiembre de 2026), y NADA sensible se queda guardado en la computadora.
 */
describe("borradores de formularios", () => {
  beforeEach(() => localStorage.clear());

  it("guarda lo escrito y lo devuelve tal cual", () => {
    const clave = claveBorrador("cliente:nuevo", "u1");
    guardarBorrador(clave, { nombre: "Ana", telefono: "3055550111", notas: "Sin almidón" });
    expect(leerBorrador<{ nombre: string }>(clave)?.valor).toEqual({
      nombre: "Ana",
      telefono: "3055550111",
      notas: "Sin almidón",
    });
  });

  it("NUNCA guarda contraseñas, PIN, códigos ni tarjetas", () => {
    const clave = claveBorrador("registro");
    guardarBorrador(clave, {
      correo: "duena@ejemplo.com",
      clave: "Perchas-2026-seguras",
      pin: "4829",
      codigo: "123456",
      tarjeta: "4242424242424242",
      cvv: "123",
      contrasena: "otra",
      anidado: { claveTemporal: "x", nombre: "Ana" },
    });
    const guardado = JSON.stringify(leerBorrador(clave));
    for (const prohibido of ["Perchas-2026-seguras", "4829", "123456", "4242", "otra", '"x"'])
      expect(guardado).not.toContain(prohibido);
    expect(guardado).toContain("duena@ejemplo.com");
    expect(guardado).toContain("Ana");
  });

  it("cada persona y cada formulario tienen su propio borrador", () => {
    expect(claveBorrador("cliente:nuevo", "u1")).not.toBe(claveBorrador("cliente:nuevo", "u2"));
    expect(claveBorrador("cliente:nuevo")).toContain(PREFIJO);
  });

  it("un borrador viejo (más de 7 días) no reaparece encima de nada", () => {
    const clave = claveBorrador("contacto");
    guardarBorrador(clave, { mensaje: "hola" }, Date.now() - VIGENCIA_MS - 1000);
    expect(leerBorrador(clave)).toBeNull();
    expect(localStorage.getItem(clave)).toBeNull();
  });

  it("se borra al guardar y al cerrar sesión", () => {
    const uno = claveBorrador("gasto");
    const dos = claveBorrador("compra");
    guardarBorrador(uno, { monto: "10" });
    guardarBorrador(dos, { factura: "A-1" });
    localStorage.setItem("otra-cosa", "no se toca");
    borrarBorrador(uno);
    expect(leerBorrador(uno)).toBeNull();
    borrarTodosLosBorradores();
    expect(leerBorrador(dos)).toBeNull();
    expect(localStorage.getItem("otra-cosa")).toBe("no se toca");
  });

  it("si el navegador no deja guardar, no rompe nada", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("modo privado");
    };
    expect(() => guardarBorrador(claveBorrador("x"), { a: 1 })).not.toThrow();
    Storage.prototype.setItem = original;
  });

  it("no toca lo que no es un objeto", () => {
    expect(sinCamposSensibles(["a", 1, true])).toEqual(["a", 1, true]);
  });
});

/**
 * El candado que de verdad importa: un formulario que se cierra a mitad y se
 * vuelve a abrir tiene que traer lo escrito. Es el fallo que reportó Richard el
 * 20 de septiembre de 2026 creando un cliente desde la computadora.
 */
function FormularioDePrueba() {
  const [v, setV] = useState({ nombre: "", clave: "" });
  const b = useBorrador("prueba-formulario", v, { alRecuperar: (g) => setV((x) => ({ ...x, ...g })) });
  return (
    <form>
      {b.recuperado && <p>recuperado</p>}
      <label>
        Nombre
        <input value={v.nombre} onChange={(e) => setV({ ...v, nombre: e.target.value })} />
      </label>
      <label>
        Clave
        <input value={v.clave} onChange={(e) => setV({ ...v, clave: e.target.value })} />
      </label>
      <button type="button" onClick={b.olvidar}>
        guardar
      </button>
    </form>
  );
}

describe("un formulario que se cierra y se vuelve a abrir", () => {
  beforeEach(() => localStorage.clear());

  it("trae de vuelta lo escrito, sin la clave, y lo olvida al guardar", async () => {
    const usuario = userEvent.setup();
    const primera = render(<FormularioDePrueba />);
    await usuario.type(screen.getByLabelText("Nombre"), "Ana Martínez");
    await usuario.type(screen.getByLabelText("Clave"), "Secreta-2026");
    // Medio segundo de respiro antes de guardar el borrador.
    await new Promise((r) => setTimeout(r, 700));
    primera.unmount(); // se cerró la ventana

    render(<FormularioDePrueba />);
    expect(await screen.findByText("recuperado")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Ana Martínez");
    expect(screen.getByLabelText("Clave")).toHaveValue("");

    await usuario.click(screen.getByText("guardar"));
    expect(Object.keys(localStorage).filter((k) => k.startsWith("tintora:borrador:"))).toHaveLength(0);
  });
});
