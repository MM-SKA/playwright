import { expect, test } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

test("should display login form", async ({ page }) => {
  await page.goto("https://practicesoftwaretesting.com/auth/login");
  await expect(page.locator('[data-test="email"]')).toBeVisible();
  await expect(page.locator('[data-test="password"]')).toBeVisible();
});

test("should require email and password", async ({ page }) => {
  await page.goto("https://practicesoftwaretesting.com/auth/login");
  await page.locator('[data-test="login-submit"]').click();
  await expect(page.locator('[data-test="email-error"]')).toBeVisible();
  await expect(page.locator('[data-test="password-error"]')).toBeVisible();
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
  await page
    .locator('[data-test="email"]')
    .fill("customer2@practicesoftwaretesting.com");
  await page.locator('[data-test="login-submit"]').click();
  const passwordError = page.locator('[data-test="password-error"]');
  await expect(passwordError).toBeVisible();
  await expect(passwordError).toContainText("Password is required");
});

test("should show password when eye icon is clicked", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.passwordInput.fill("welcome01");
  await expect(loginPage.passwordInput).toHaveAttribute("type", "password");
  await loginPage.passwordToggle.click();
  await expect(loginPage.passwordInput).toHaveAttribute("type", "text");
});

test("should hide password when eye icon is clicked again", async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.passwordInput.fill("welcome01");
  await loginPage.passwordToggle.click();
  await expect(loginPage.passwordInput).toHaveAttribute("type", "text");
  await loginPage.passwordToggle.click();
  await expect(loginPage.passwordInput).toHaveAttribute("type", "password");
});

test("should not alter password value when toggled", async ({ page }) => {
  const password = "welcome01";
  await page.goto("https://practicesoftwaretesting.com/auth/login");
  const passwordInput = page.locator('[data-test="password"]');
  await passwordInput.fill(password);
  await page.locator("#password + div button").click();
  await expect(passwordInput).toHaveValue(password);
});

test("should login successfully", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login("customer2@practicesoftwaretesting.com", "welcome01");
  await expect(page).toHaveURL(/account/);
  await expect(page.locator("#menu")).toContainText("Jack Howe");
});
test("should login using enter key", async ({ page }) => {
  await page.goto("https://practicesoftwaretesting.com/auth/login");
  await page.locator('[data-test="email"]').fill("customer2@practicesoftwaretesting.com");
  await page.locator('[data-test="password"]').fill("welcome01");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/account/);
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

test("should redirect unauthenticated user", async ({ page }) => {
  await page.goto("https://practicesoftwaretesting.com/account");
  await expect(page).toHaveURL(/login/);
});
