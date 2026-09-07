import { expect, test } from "@playwright/test";

import {  CartResponse } from "../models/cart.model";

import { baseUrl, getCartIdFromResponse, isCartGetResponse, isProductsListResponse} from "../helpers/api-matchers";

import { ProductDetailPage } from "../pages/product-detail.page";

import { SelectedCartProduct } from "../models/product.model";

import { ProductsListResponse } from "../models/product.model";

import { CartPage } from "../pages/cart.page";

test.describe("Shopping Cart", () => {
  test("should add three products, verify cart and remove all items", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const detailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    const productsResponsePromise = page.waitForResponse((response) =>
      isProductsListResponse(response),
    );
    await page.goto(baseUrl, {
      waitUntil: "domcontentloaded",
    });
    const productsResponse = await productsResponsePromise;
    const products = (await productsResponse.json()) as ProductsListResponse;
    const selectedProducts: SelectedCartProduct[] = products.data
      .filter((product) => product.in_stock && !product.is_rental)
      .slice(0, 3)
      .map((product, index) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: index + 1,
      }));
    expect(selectedProducts, "Expected three available products").toHaveLength(
      3,
    );
    const cartIds: string[] = [];
    try {
      for (const product of selectedProducts) {
        await detailPage.open(product.id);
        const cartId = await detailPage.addToCart(product);
        cartIds.push(cartId);
      }
      expect(new Set(cartIds).size).toBe(1);
      const cartId = cartIds[0];
      const cartResponsePromise = page.waitForResponse(
        (response) =>
          isCartGetResponse(response) &&
          getCartIdFromResponse(response) === cartId,
      );
      await cartPage.open();
      const cartResponse = await cartResponsePromise;
      const cart = (await cartResponse.json()) as CartResponse;
      expect(cart.id).toBe(cartId);
      expect(cart.cart_items).toHaveLength(3);
      await cartPage.verifyCart(cart);
    } finally {
      /*
       * Cleanup executes even if a cart
       * assertion above fails.
       */
      if (
        await cartPage.cartRows
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await cartPage.removeAllItems();
      }
    }
  });
});
