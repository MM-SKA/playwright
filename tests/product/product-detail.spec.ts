import { expect, test } from "@playwright/test";

import { ProductPage } from "../pages/product.page";

import { ProductDetailPage } from "../pages/product-detail.page";

import {
  ProductDetailResponse,
  ProductListItem,
} from "../models/product.model";

import {
  isProductDetailResponse,
  isRelatedProductsResponse,
} from "../helpers/api-matchers";

test.describe("Product Detail", () => {
  test("AC1 should display product information", async ({ page }) => {
    const productsPage = new ProductPage(page);

    const detailPage = new ProductDetailPage(page);

    await productsPage.open();

    const responsePromise = page.waitForResponse((response) =>
      isProductDetailResponse(response),
    );

    await page.locator('[data-test^="product-"]').first().click();

    const response = await responsePromise;

    const product = (await response.json()) as ProductDetailResponse;

    await expect(detailPage.productName).toHaveText(product.name);

    await expect(detailPage.description).toHaveText(product.description);

    await expect(detailPage.unitPrice).toHaveText(product.price.toFixed(2));

    await expect(detailPage.categoryBadge).toHaveText(product.category.name);

    await expect(detailPage.brandBadge).toContainText(product.brand.name);

    await expect(detailPage.productImage).toHaveAttribute(
      "src",
      new RegExp(product.product_image.file_name),
    );
  });

  test("AC2-AC5 should handle quantity controls", async ({ page }) => {
    const productsPage = new ProductPage(page);

    const detailPage = new ProductDetailPage(page);

    await productsPage.open();

    await page.locator('[data-test^="product-"]').first().click();

    await expect(detailPage.quantityInput).toHaveValue("1");

    await detailPage.increaseQuantityButton.click();

    await expect(detailPage.quantityInput).toHaveValue("2");

    await detailPage.decreaseQuantityButton.click();

    await expect(detailPage.quantityInput).toHaveValue("1");

    await detailPage.decreaseQuantityButton.click();

    await expect(detailPage.quantityInput).toHaveValue("1");
  });

  test("AC6 should allow manual quantity entry", async ({ page }) => {
    const productsPage = new ProductPage(page);

    const detailPage = new ProductDetailPage(page);

    await productsPage.open();

    await page.locator('[data-test^="product-"]').first().click();

    await detailPage.setQuantity(25);

    await expect(detailPage.quantityInput).toHaveValue("25");
  });

  test("AC9 should display related products", async ({ page }) => {
    const productsPage = new ProductPage(page);

    await productsPage.open();

    const relatedResponsePromise = page.waitForResponse((response) =>
      isRelatedProductsResponse(response),
    );

    await page.locator('[data-test^="product-"]').first().click();

    const response = await relatedResponsePromise;

    const relatedProducts = (await response.json()) as ProductListItem[];

    const expectedIds = relatedProducts.map((product) => product.id);

    const relatedSection = page
      .getByRole("heading", {
        name: "Related products",
      })
      .locator("..");

    await expect(relatedSection).toBeVisible();

    const renderedIds = await relatedSection
      .locator('a[href^="/product/"]')
      .evaluateAll((elements) =>
        elements.map((element) =>
          element.getAttribute("href")?.replace("/product/", ""),
        ),
      );

    expect(renderedIds).toEqual(expectedIds);
  });
});
