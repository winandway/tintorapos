import { expect, test } from "@playwright/test";

test("cada idioma tiene su dirección, su lang, su canónica y sus hreflang", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://tintorapos.com/en");
  await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute(
    "href",
    "https://tintorapos.com/es",
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
    "href",
    "https://tintorapos.com",
  );
  await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();
  const titulo = await page.title();
  expect(titulo).toContain("Dry Cleaning");

  await page.goto("/es/docs/primeros-pasos");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    "href",
    "https://tintorapos.com/en/docs/getting-started",
  );
  // Los enlaces de la barra lateral se quedan en el mismo idioma.
  await expect(page.locator('a[href="/es/docs/caja"]').first()).toBeAttached();
});

test("el slug del otro idioma redirige a la dirección correcta", async ({ page }) => {
  const r = await page.goto("/en/docs/primeros-pasos");
  expect(r?.status()).toBe(200);
  await expect(page).toHaveURL(/\/en\/docs\/getting-started$/);
});

test("las banderas llevan a la misma página en el otro idioma", async ({ page }) => {
  await page.goto("/en/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy Policy");
  await page.getByRole("button", { name: "Switch language to Español" }).click();
  await expect(page).toHaveURL(/\/es\/privacidad$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Política de privacidad");
});
