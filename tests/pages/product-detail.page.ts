import { expect, Locator, Page } from "@playwright/test";

import { AddToCartRequest, AddToCartResponse } from "../models/cart.model";

import { SelectedCartProduct } from "../models/product.model";

import {
  baseUrl,
  getCartIdFromResponse,
  isCartPostResponse,
} from "../helpers/api-matchers";

export class ProductDetailPage {
  readonly productName: Locator;
  readonly description: Locator;
  readonly unitPrice: Locator;
  readonly categoryBadge: Locator;
  readonly brandBadge: Locator;
  readonly productImage: Locator;

  readonly quantityInput: Locator;
  readonly increaseQuantityButton: Locator;
  readonly decreaseQuantityButton: Locator;

  readonly addToCartButton: Locator;
  readonly successToast: Locator;

  constructor(private readonly page: Page) {
    this.productName = page.locator('[data-test="product-name"]');

    this.description = page.locator('[data-test="product-description"]');

    this.unitPrice = page.locator('[data-test="unit-price"]');

    this.categoryBadge = page.locator('[aria-label="category"]');

    this.brandBadge = page.locator('[aria-label="brand"]');

    this.productImage = page.locator("figure img");

    this.quantityInput = page.locator('[data-test="quantity"]');

    this.increaseQuantityButton = page.locator(
      '[data-test="increase-quantity"]',
    );

    this.decreaseQuantityButton = page.locator(
      '[data-test="decrease-quantity"]',
    );

    this.addToCartButton = page.locator('[data-test="add-to-cart"]');

    this.successToast = page.locator(".toast-success").last();
  }

  async open(productId: string): Promise<void> {
    await this.page.goto(`${baseUrl}/product/${productId}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(this.productName).toBeVisible();
  }

  async setQuantity(quantity: number): Promise<void> {
    if (!Number.isInteger(quantity)) {
      throw new Error(`Quantity must be an integer. Received: ${quantity}`);
    }

    if (quantity < 1) {
      throw new Error(`Quantity must be at least 1. Received: ${quantity}`);
    }

    await this.quantityInput.fill(String(quantity));

    await expect(this.quantityInput).toHaveValue(String(quantity));
  }

  async addToCart(product: SelectedCartProduct): Promise<string> {
    await expect(this.productName).toHaveText(product.name);

    await expect(this.quantityInput).toBeEnabled();

    await expect(this.addToCartButton).toBeEnabled();

    await this.setQuantity(product.quantity);

    const responsePromise = this.page.waitForResponse((response) =>
      isCartPostResponse(response),
    );

    await this.addToCartButton.click();

    const response = await responsePromise;

    const requestBody = response.request().postDataJSON() as AddToCartRequest;

    expect(requestBody.product_id).toBe(product.id);

    expect(requestBody.quantity).toBe(product.quantity);

    const responseBody = (await response.json()) as AddToCartResponse;

    expect(responseBody.result).toBe("item added or updated");

    await expect(this.successToast).toContainText(
      "Product added to shopping cart.",
    );

    return getCartIdFromResponse(response);
  }
}
