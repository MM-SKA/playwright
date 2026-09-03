import { expect, Page } from "@playwright/test";

export async function addProductToCart(page: Page) {
  await page.goto("https://practicesoftwaretesting.com", {
    waitUntil: "domcontentloaded",
  });

  await page.waitForResponse(
    (response) => response.url().includes("/products") && response.ok(),
  );

  const firstProduct = page.locator('[data-test^="product-"]').first();

  await expect(firstProduct).toBeVisible();

  await firstProduct.click();

  await page.locator('[data-test="add-to-cart"]').click();

  await expect(page.locator(".toast-success")).toBeVisible();
}
