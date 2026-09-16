import { expect, test } from "@playwright/test";
import { en } from "../src/lib/i18n/diccionarios/en";
import { es } from "../src/lib/i18n/diccionarios/es";

test("las banderas cambian el idioma de todo el sitio y se recuerda", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page.getByRole("button", { name: "Cambiar el idioma a English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every garment tracked.");
  await page.goto("/docs");
  await expect(page.getByRole("heading", { level: 1, name: en.docs.titulo })).toBeVisible();
  await expect(page.getByText(en.docs.subtitulo)).toBeVisible();
  await page.getByRole("button", { name: "Switch language to Español" }).click();
  await expect(page.getByText(es.docs.subtitulo)).toBeVisible();
});

test("Docs: el buscador filtra mientras se escribe y la barra no se pierde al abrir una guía", async ({
  page,
}) => {
  await page.goto("/docs");
  await page.getByRole("combobox").first().fill("cierre");
  await page.getByRole("option", { name: /Caja y cierre/ }).click();
  await expect(page).toHaveURL(/\/docs\/caja$/);
  await expect(page.getByRole("link", { name: es.docs.volver })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Caja y cierre" })).toBeVisible();
  const boton = page.getByRole("button", { name: es.docs.verGuias });
  if (await boton.isVisible()) {
    await expect(async () => {
      if ((await boton.getAttribute("aria-expanded")) !== "true") await boton.click();
      await expect(page.getByRole("button", { name: es.docs.cerrarGuias })).toBeVisible({ timeout: 1_000 });
    }).toPass();
  }
  await expect(page.locator('a[aria-current="page"]:visible', { hasText: "Caja y cierre" })).toHaveCount(1);
  await page
    .locator("a:visible", { hasText: /^Reportes$/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/docs\/reportes$/);
  await expect(page.getByRole("link", { name: es.docs.volver })).toBeVisible();
});
