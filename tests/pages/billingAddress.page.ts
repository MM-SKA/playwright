import { Page, expect, test } from "@playwright/test";

export class BillingAddressPage {
  constructor(private page: Page) {}

  async fillAddress() {
    await this.page.locator('[data-test="country"]').selectOption("IN");

    await this.page.locator('[data-test="postal_code"]').fill("390001");

    await this.page.locator('[data-test="house_number"]').fill("42");

    await this.page.locator('[data-test="street"]').fill("Alkapuri Road");

    await this.page.locator('[data-test="city"]').fill("Vadodara");

    await this.page.locator('[data-test="state"]').fill("Gujarat");
  }

  async proceedToPayment() {
    await this.page.locator('[data-test="proceed-3"]').click();
  }
}
