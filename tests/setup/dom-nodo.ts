/**
 * DOM para las pruebas de PANTALLAS que hablan con el servidor real.
 * El entorno «jsdom» de vitest cambia Uint8Array/TextEncoder globales y rompe el
 * motor local de la base (miniflare). Aquí el entorno es Node y solo se agregan
 * las piezas del navegador que Node no tiene; las de Node (fetch, Request,
 * AbortController, Blob…) se quedan, igual que en el servidor.
 */
// IndexedDB de memoria: se importa ANTES de crear window para que quede en globalThis.
import "fake-indexeddb/auto";
import { JSDOM } from "jsdom";
import { afterEach } from "vitest";

const dom = new JSDOM("<!doctype html><html lang='es'><body></body></html>", {
  url: "https://tintora.prueba/app",
  pretendToBeVisual: true,
});
const w = dom.window as unknown as Record<string, unknown>;
const g = globalThis as unknown as Record<string, unknown>;
for (const clave of Object.getOwnPropertyNames(w)) {
  if (clave in g) continue;
  try {
    g[clave] = w[clave];
  } catch {
    // propiedades de solo lectura de jsdom: no hacen falta
  }
}
// Los eventos del DOM tienen que ser los de jsdom (dispatchEvent los valida).
for (const clave of [
  "Event",
  "CustomEvent",
  "EventTarget",
  "KeyboardEvent",
  "MouseEvent",
  "FocusEvent",
  "InputEvent",
  "UIEvent",
  "PointerEvent",
]) {
  if (w[clave]) g[clave] = w[clave];
}
g.window = dom.window;
g.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
g.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom todavía no trae <dialog> modal ni algunas APIs de medida.
const Dialogo = dom.window.HTMLDialogElement.prototype as HTMLDialogElement;
Dialogo.showModal = function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
Dialogo.show = Dialogo.showModal;
Dialogo.close = function (this: HTMLDialogElement) {
  this.removeAttribute("open");
  this.dispatchEvent(new dom.window.Event("close"));
};
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
g.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

await import("@testing-library/jest-dom/vitest");
const { cleanup, configure } = await import("@testing-library/react");
// Estas pruebas pasan por el servidor y la base reales: con cobertura activa van más lentas.
configure({ asyncUtilTimeout: 8_000 });
afterEach(() => cleanup());
