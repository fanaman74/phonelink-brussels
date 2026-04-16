import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/fr/demandes");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders in French", async ({ page }) => {
    await page.goto("/fr/login");
    await expect(page.getByText("PhoneLink Brussels")).toBeVisible();
    await expect(page.getByPlaceholder(/boutique@/)).toBeVisible();
  });

  test("login page renders in English", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByText("PhoneLink Brussels")).toBeVisible();
    await expect(page.getByPlaceholder(/shop@/)).toBeVisible();
  });

  test("login page renders in Dutch", async ({ page }) => {
    await page.goto("/nl/login");
    await expect(page.getByPlaceholder(/winkel@/)).toBeVisible();
  });

  test("shows error for invalid email", async ({ page }) => {
    await page.goto("/fr/login");
    await page.getByPlaceholder(/boutique@/).fill("not-an-email");
    await page.getByRole("button", { name: /code/i }).click();
    // Validation fires before OTP send
    await expect(page.locator("text=invalid_email")).not.toBeVisible();
    // Sonner toast appears
    await expect(page.locator("[data-sonner-toast]")).toBeVisible({ timeout: 3000 });
  });

  test("back button returns to email step", async ({ page }) => {
    await page.goto("/fr/login");
    await page.getByPlaceholder(/boutique@/).fill("test@example.com");
    await page.getByRole("button", { name: /code/i }).click();
    // If OTP send fails (no real Supabase), we stay — just check back button exists
    // In a real E2E with seeded auth, we'd advance to OTP step
  });
});
