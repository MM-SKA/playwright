import { expect, test } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

test("should display login form", async ({ page }) => {
  await page.goto("https://practicesoftwaretesting.com/auth/login");
  await expect(page.locator('[data-test="email"]')).toBeVisible();
  await expect(page.locator('[data-test="password"]')).toBeVisible();
});

test("should require email", async ({ page }) => {
  await page.goto("https://practicesoftwaretesting.com/auth/login");
  await page.locator('[data-test="password"]').fill("welcome01");
  await page.locator('[data-test="login-submit"]').click();
  const emailError = page.locator('[data-test="email-error"]');
  await expect(emailError).toBeVisible();
  await expect(emailError).toContainText("Email is required");
});

test("should validate email format", async ({ page }) => {
  await page.goto("https://practicesoftwaretesting.com/auth/login");
  await page.locator('[data-test="email"]').fill("abcd");
  await page.locator('[data-test="password"]').fill("welcome01");
  await page.getByRole("button", { name: "Login" }).click();
  const emailError = page.locator('[data-test="email-error"]');
  await expect(emailError).toBeVisible();
  await expect(emailError).toContainText("Email format is invalid");
});

test("should require password", async ({ page }) => {
  await page.goto("https://practicesoftwaretesting.com/auth/login");
  await page.locator('[data-test="email"]').fill("customer2@practicesoftwaretesting.com");
  await page.locator('[data-test="login-submit"]').click();
  const passwordError = page.locator('[data-test="password-error"]');
  await expect(passwordError).toBeVisible();
  await expect(passwordError).toContainText("Password is required");
});

test("should login successfully", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login("customer2@practicesoftwaretesting.com", "welcome01");
  await expect(page).toHaveURL(/account/);
  await expect(page.locator("#menu")).toContainText("Jack Howe");
});

test("should show error for invalid credentials", async ({ page }) => {
  await page.goto("https://practicesoftwaretesting.com/auth/login");
  await page
    .locator('[data-test="email"]')
    .fill("customer@practicesoftwaretesting.com");
  await page.locator('[data-test="password"]').fill("wrongPassword");
  await page.getByRole("button", { name: "Login" }).click();
  const loginError = page.locator('[data-test="login-error"]');
  await expect(loginError).toBeVisible();
  await expect(loginError).toContainText("Invalid email or password");
});
