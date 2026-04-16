import { test, expect } from "@playwright/test";

/**
 * End-to-end request flow test.
 * Requires a running Supabase instance with seed data.
 * Uses two authenticated shop sessions (shop A and shop B).
 *
 * In CI: set PLAYWRIGHT_SHOP_A_TOKEN and PLAYWRIGHT_SHOP_B_TOKEN env vars
 * with valid Supabase session tokens.
 */

test.describe("Request blast flow", () => {
  test.skip(
    !process.env.PLAYWRIGHT_SHOP_A_TOKEN,
    "Requires PLAYWRIGHT_SHOP_A_TOKEN to be set"
  );

  test("Shop A sends a request, Shop B responds", async ({ browser }) => {
    const shopAContext = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: "http://localhost:3000",
            localStorage: [
              {
                name: `sb-ivzergvkfmqhxrkqjfyr-auth-token`,
                value: process.env.PLAYWRIGHT_SHOP_A_TOKEN!,
              },
            ],
          },
        ],
      },
    });

    const shopBContext = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: "http://localhost:3000",
            localStorage: [
              {
                name: `sb-ivzergvkfmqhxrkqjfyr-auth-token`,
                value: process.env.PLAYWRIGHT_SHOP_B_TOKEN!,
              },
            ],
          },
        ],
      },
    });

    const pageA = await shopAContext.newPage();
    const pageB = await shopBContext.newPage();

    // Shop A searches for iPhone 15 Pro
    await pageA.goto("/fr/chercher");
    await pageA.getByPlaceholder(/iPhone/).fill("iPhone 15");
    await pageA.waitForSelector("text=iPhone 15 Pro", { timeout: 3000 }).catch(() => {});

    // Shop A sends request
    await pageA.getByRole("button", { name: /demande/i }).click();
    await pageA.getByRole("button", { name: /confirmer/i }).click();
    await expect(pageA.locator("[data-sonner-toast]")).toBeVisible({ timeout: 5000 });

    // Shop B navigates to dashboard and sees the request
    await pageB.goto("/fr/demandes");
    await pageB.waitForSelector("text=iPhone 15", { timeout: 8000 });

    // Shop B responds "Je l'ai"
    await pageB.getByRole("button", { name: /je l.ai/i }).first().click();
    await pageB.getByRole("button", { name: /confirmer/i }).click();
    await expect(pageB.locator("[data-sonner-toast]")).toBeVisible({ timeout: 5000 });

    await shopAContext.close();
    await shopBContext.close();
  });
});

test.describe("Dashboard UI (unauthenticated)", () => {
  test("dashboard redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/fr/demandes");
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
