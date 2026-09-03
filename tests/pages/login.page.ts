import { Locator, Page } from "@playwright/test";

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly passwordToggle: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.locator('[data-test="email"]');

    this.passwordInput = page.locator('[data-test="password"]');

    this.loginButton = page.locator('[data-test="login-submit"]');

    this.passwordToggle = page
      .locator("#password")
      .locator("..")
      .locator("..")
      .locator("button");
  }

  async open(): Promise<void> {
    await this.page.goto("https://practicesoftwaretesting.com/auth/login");
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);

    await this.passwordInput.fill(password);

    await Promise.all([
      this.page.waitForURL(/account/),

      this.loginButton.click(),
    ]);
  }
}
