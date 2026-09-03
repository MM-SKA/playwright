import { Page, expect, test } from "@playwright/test";

export class PaymentPage {
  constructor(private page: Page) {}

  get paymentMethod() {
    return this.page.locator('[data-test="payment-method"]');
  }

  async verifyPaymentOptions() {
    await expect(this.paymentMethod).toContainText("Bank Transfer");

    await expect(this.paymentMethod).toContainText("Cash on Delivery");

    await expect(this.paymentMethod).toContainText("Credit Card");

    await expect(this.paymentMethod).toContainText("Buy Now Pay Later");

    await expect(this.paymentMethod).toContainText("Gift Card");
  }
}
