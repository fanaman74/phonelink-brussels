import { test, expect } from "@playwright/test";

test.describe("i18n routing", () => {
  test("root redirects to /fr/demandes", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/fr\//);
  });

  test("/fr/login has French UI", async ({ page }) => {
    await page.goto("/fr/login");
    await expect(page.getByText("Connectez votre boutique au réseau")).toBeVisible();
  });

  test("/en/login has English UI", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByText("Connect your shop to the network")).toBeVisible();
  });

  test("/nl/login has Dutch UI", async ({ page }) => {
    await page.goto("/nl/login");
    await expect(page.getByText("Verbind uw winkel met het netwerk")).toBeVisible();
  });

  test("unknown locale returns 404", async ({ page }) => {
    const response = await page.goto("/de/login");
    expect(response?.status()).toBe(404);
  });

  test("bottom nav shows French labels on /fr/*", async ({ page, context }) => {
    // Set a mock session cookie to bypass auth guard
    await context.addCookies([
      {
        name: "sb-ivzergvkfmqhxrkqjfyr-auth-token",
        value: "mock",
        domain: "localhost",
        path: "/",
      },
    ]);
    await page.goto("/fr/demandes");
    // Nav labels should be French
    const nav = page.locator("nav");
    await expect(nav.getByText("Demandes")).toBeVisible({ timeout: 5000 });
    await expect(nav.getByText("Mon stock")).toBeVisible();
    await expect(nav.getByText("Chercher")).toBeVisible();
  });
});
