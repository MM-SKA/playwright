import { Page, expect, test } from "@playwright/test";

export class CheckoutPage {
  constructor(private page: Page) {}

  async openCheckout() {
    await this.page.goto("https://practicesoftwaretesting.com/checkout");
  }

  async proceedFromCart() {
    await this.page.locator('[data-test="proceed-1"]').click();
  }

  async continueAsGuest(email: string, firstName: string, lastName: string) {
    await this.page
      .getByRole("tab", {
        name: "Continue as Guest",
      })
      .click();

    await this.page.locator('[data-test="guest-email"]').fill(email);

    await this.page.locator('[data-test="guest-first-name"]').fill(firstName);

    await this.page.locator('[data-test="guest-last-name"]').fill(lastName);

    await this.page.locator('[data-test="guest-submit"]').click();

    await this.page.locator('[data-test="proceed-2-guest"]').click();
  }

  async continueAsLoggedInUser() {
    await this.page.locator('[data-test="proceed-2"]').click();
  }
}