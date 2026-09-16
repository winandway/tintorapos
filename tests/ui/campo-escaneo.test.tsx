import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CampoEscaneo } from "@/components/ui/campo-escaneo";
import { diccionario } from "@/lib/i18n";
import { ProveedorIdioma } from "@/lib/i18n/cliente";

function Pantalla({ ocupado }: { ocupado: boolean }) {
  return (
    <ProveedorIdioma idioma="es" d={diccionario("es")}>
      <CampoEscaneo alLeer={vi.fn()} placeholder="Escanear" ocupado={ocupado} />
      <input aria-label="Ubicación" />
      <input type="checkbox" aria-label="Rápido" />
    </ProveedorIdioma>
  );
}

describe("campo de escaneo: foco (candado)", () => {
  it("vuelve al escáner al terminar una operación, pero NO le roba el foco a quien escribe la ubicación (comprobado en rojo)", async () => {
    const u = userEvent.setup();
    const { rerender } = render(<Pantalla ocupado />);
    rerender(<Pantalla ocupado={false} />);
    expect(screen.getByLabelText("Escanear")).toHaveFocus();

    await u.click(screen.getByLabelText("Ubicación"));
    rerender(<Pantalla ocupado />);
    rerender(<Pantalla ocupado={false} />);
    expect(screen.getByLabelText("Ubicación")).toHaveFocus();

    // Una casilla no es «escribir»: el lector necesita el foco en el campo.
    await u.click(screen.getByLabelText("Rápido"));
    rerender(<Pantalla ocupado />);
    rerender(<Pantalla ocupado={false} />);
    expect(screen.getByLabelText("Escanear")).toHaveFocus();
  });
});
