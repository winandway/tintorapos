import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/entorno", () => import("../ayuda/mock-entorno"));
const recargarEn = vi.hoisted(() => vi.fn());
vi.mock("@/lib/navegacion", () => ({ recargarEn }));

import { FormCambiarClave, FormRecuperar, FormRestablecer } from "@/components/acceso/form-claves";
import { FormActivarDosPasos, FormVerificarDosPasos } from "@/components/acceso/form-dos-pasos";
import { FormEntrar } from "@/components/acceso/form-entrar";
import { FormRegistro } from "@/components/acceso/form-registro";
import { sha256Hex, tokenSecreto } from "@/lib/codigos";
import { codigoTotp, pasoActual } from "@/server/auth/totp";
import { crearEntorno, type EntornoPrueba } from "../ayuda/entorno";
import { usarEntorno } from "../ayuda/mock-entorno";
import { d, montar } from "../ayuda/pantallas";
import { instalarPuente, type Puente } from "../ayuda/puente-ui";

const da = d.acceso;

describe("acceso: registro, dos pasos, entrar y contraseñas (contra el servidor real)", () => {
  let e: EntornoPrueba;
  let puente: Puente;
  const correo = `acceso-${Date.now()}@ejemplo.com`;
  const clave = "Clave-segura-2026";
  let respaldos: string[] = [];

  beforeAll(async () => {
    e = await crearEntorno();
    usarEntorno(e);
    puente = instalarPuente();
  }, 120_000);
  afterAll(async () => {
    puente.cerrar();
    await e.cerrar();
  });

  it("registro: valida la contraseña y crea la cuenta", async () => {
    const u = userEvent.setup();
    montar(<FormRegistro siteKey={null} />);
    await u.type(screen.getByLabelText(da.negocio), "Tintorería Acceso");
    await u.type(screen.getByLabelText(da.tuNombre), "Dueña Acceso");
    await u.type(screen.getByLabelText(da.correo), correo);
    await u.type(screen.getByLabelText(da.clave, { selector: "input" }), "corta");
    await u.click(screen.getByRole("checkbox"));
    await u.click(screen.getByRole("button", { name: da.crearCuenta }));
    expect(await screen.findByText((t) => /10 caracteres/.test(t))).toBeInTheDocument();
    expect(recargarEn).not.toHaveBeenCalled();

    await u.clear(screen.getByLabelText(da.clave, { selector: "input" }));
    await u.type(screen.getByLabelText(da.clave, { selector: "input" }), clave);
    await u.click(screen.getByRole("button", { name: da.crearCuenta }));
    await waitFor(() => expect(recargarEn).toHaveBeenCalledWith("/entrar/activar-dos-pasos"));
  });

  it("activar dos pasos: código incorrecto avisa; el correcto entrega 10 códigos de respaldo", async () => {
    const u = userEvent.setup();
    recargarEn.mockClear();
    montar(<FormActivarDosPasos />);
    await u.click(screen.getByRole("button", { name: da.empezar }));
    const secreto = ((await screen.findByTestId("secreto-totp")).textContent ?? "").replace(/\s/g, "");
    await u.type(screen.getByLabelText(da.codigo), "000000");
    await u.click(screen.getByRole("button", { name: da.confirmarCodigo }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await u.clear(screen.getByLabelText(da.codigo));
    await u.type(screen.getByLabelText(da.codigo), await codigoTotp(secreto, pasoActual(Date.now())));
    await u.click(screen.getByRole("button", { name: da.confirmarCodigo }));
    const lista = await screen.findByTestId("codigos-respaldo");
    respaldos = within(lista)
      .getAllByRole("listitem")
      .map((li) => li.textContent ?? "");
    expect(respaldos).toHaveLength(10);
    const ir = screen.getByRole("button", { name: da.irAlPanel });
    expect(ir).toBeDisabled();
    await u.click(screen.getByRole("checkbox", { name: da.yaGuarde }));
    await u.click(ir);
    expect(recargarEn).toHaveBeenCalledWith("/app");
  });

  it("entrar: contraseña mala avisa; la buena pide dos pasos y un código de respaldo sirve", async () => {
    const u = userEvent.setup();
    recargarEn.mockClear();
    puente.cookies.clear();
    puente.cookies.set("tp_csrf", "csrf-de-prueba-0123456789");
    montar(<FormEntrar siteKey={null} hayDispositivo={false} />);
    await u.type(screen.getByLabelText(da.correo), correo);
    await u.type(screen.getByLabelText(da.clave, { selector: "input" }), "no-es-la-clave-1");
    await u.click(screen.getByRole("button", { name: da.entrar }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await u.clear(screen.getByLabelText(da.clave, { selector: "input" }));
    await u.type(screen.getByLabelText(da.clave, { selector: "input" }), clave);
    await u.click(screen.getByRole("button", { name: da.entrar }));
    await waitFor(() => expect(recargarEn).toHaveBeenCalledWith("/entrar/dos-pasos"));

    recargarEn.mockClear();
    montar(<FormVerificarDosPasos />);
    await u.click(screen.getByRole("button", { name: da.usarRespaldo }));
    await u.type(screen.getByLabelText(da.codigoRespaldo), respaldos[0]!);
    await u.click(screen.getByRole("button", { name: da.verificar }));
    await waitFor(() => expect(recargarEn).toHaveBeenCalledWith("/app"));
  });

  it("cambiar la contraseña con la sesión abierta, pedir recuperación y restablecer con el enlace", async () => {
    const u = userEvent.setup();
    recargarEn.mockClear();
    const { unmount } = montar(<FormCambiarClave />);
    await u.type(screen.getByLabelText(da.claveActual, { selector: "input" }), clave);
    await u.type(screen.getByLabelText(da.claveNueva, { selector: "input" }), "Otra-clave-segura-99");
    await u.type(screen.getByLabelText(da.claveRepetir, { selector: "input" }), "Otra-clave-segura-99");
    await u.click(screen.getByRole("button", { name: da.guardarClave }));
    await waitFor(() => expect(recargarEn).toHaveBeenCalledWith("/app"));
    unmount();

    const r = montar(<FormRecuperar siteKey={null} />);
    await u.type(screen.getByLabelText(da.correo), correo);
    await u.click(screen.getByRole("button", { name: da.enviarEnlace }));
    expect(await screen.findByText(da.recuperarEnviado)).toBeInTheDocument();
    r.unmount();

    const usuario = await e.env.DB.prepare("select id, tintoreria_id from usuarios where correo = ?")
      .bind(correo)
      .first<{ id: string; tintoreria_id: string }>();
    const token = tokenSecreto();
    await e.env.DB.prepare(
      "insert into tokens_recuperacion (hash, tintoreria_id, usuario_id, creado_en, expira_en) values (?, ?, ?, ?, ?)",
    )
      .bind(await sha256Hex(token), usuario!.tintoreria_id, usuario!.id, Date.now(), Date.now() + 3_600_000)
      .run();
    montar(<FormRestablecer token={token} />);
    await u.type(screen.getByLabelText(da.claveNueva, { selector: "input" }), "Clave-nueva-final-7");
    await u.type(screen.getByLabelText(da.claveRepetir, { selector: "input" }), "Clave-nueva-final-7");
    await u.click(screen.getByRole("button", { name: da.guardarClave }));
    expect(await screen.findByText(da.restablecerListo)).toBeInTheDocument();
  });
});
