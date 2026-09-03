import { expect, Locator, Page } from "@playwright/test";

import { CartItem, CartResponse } from "../models/cart.model";

import { calculateLineTotal, parseMoney } from "../helpers/price.helper";

import { baseUrl } from "../helpers/api-matchers";
export class CartPage {
  readonly cartRows: Locator;
  readonly cartTotal: Locator;
  readonly productTitles: Locator;

  constructor(private readonly page: Page) {
    this.cartRows = page.locator("app-cart table tbody tr");

    this.cartTotal = page.locator('[data-test="cart-total"]');

    this.productTitles = page.locator('[data-test="product-title"]');
  }

  async open(): Promise<void> {
    await this.page.goto(`${baseUrl}/checkout`, {
      waitUntil: "domcontentloaded",
    });
  }

  getRowByCartItem(cartItem: CartItem): Locator {
    const quantityInput = this.page.locator(`[id="quantity-${cartItem.id}"]`);

    return quantityInput.locator("xpath=ancestor::tr");
  }

  async verifyRow(cartItem: CartItem): Promise<void> {
    const row = this.getRowByCartItem(cartItem);

    const title = row.locator('[data-test="product-title"]');

    const quantity = row.locator('[data-test="product-quantity"]');

    const unitPrice = row.locator('[data-test="product-price"]');

    const linePrice = row.locator('[data-test="line-price"]');

    await expect(title).toHaveText(cartItem.product.name);

    await expect(quantity).toHaveValue(String(cartItem.quantity));

    await expect(unitPrice).toHaveText(`$${cartItem.product.price.toFixed(2)}`);

    const expectedLineTotal = calculateLineTotal(
      cartItem.product.price,
      cartItem.quantity,
    );

    await expect(linePrice).toHaveText(`$${expectedLineTotal.toFixed(2)}`);
  }

  async verifyCart(cart: CartResponse): Promise<void> {
    await expect(this.cartRows).toHaveCount(cart.cart_items.length);

    for (const cartItem of cart.cart_items) {
      await this.verifyRow(cartItem);
    }

    const expectedTotal = cart.cart_items.reduce(
      (total, item) =>
        total + calculateLineTotal(item.product.price, item.quantity),
      0,
    );

    const displayedTotal = parseMoney(await this.cartTotal.innerText());

    expect(displayedTotal).toBeCloseTo(expectedTotal, 2);
  }

  async removeAllItems(): Promise<void> {
    while ((await this.cartRows.count()) > 0) {
      const countBefore = await this.cartRows.count();

      const firstRow = this.cartRows.first();

      const deleteButton = firstRow.locator("a.btn-danger");

      await expect(deleteButton).toBeVisible();

      await deleteButton.click();

      await expect(this.cartRows).toHaveCount(countBefore - 1);
    }

    await expect(this.productTitles).toHaveCount(0);
  }
}
