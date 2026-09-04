import { expect, Page, Request, Response, test } from "@playwright/test";
import { ProductPage, ProductSortOption } from "../pages/product.page";
import { ProductsApiResponse } from "../models/product.model";
import {
  readRequestData,
  isProductsRequest,
} from "../helpers/product-api-helper";

test.describe("Product name sorting", () => {
  test.beforeEach(async ({ page }) => {
    const productPage = new ProductPage(page);

    await productPage.open();
  });
  test("AC10 should display category filters", async ({ page }) => {
    await expect(
      page.locator('input[name="category_id"]').first(),
    ).toBeVisible();

    const categories = await page.locator('input[name="category_id"]').count();

    expect(categories).toBeGreaterThan(0);
  });

  test("AC11 should display hierarchical categories", async ({ page }) => {
    await expect(
      page.locator("#filters").getByText("Hand Tools"),
    ).toBeVisible();

    await expect(page.locator("#filters").getByText("Hammer")).toBeVisible();

    await expect(page.locator("#filters").getByText("Pliers")).toBeVisible();
  });

  test("AC12 should select all child categories when parent selected", async ({
    page,
  }) => {
    const parentCategory = page
      .locator("#filters label")
      .filter({ hasText: "Hand Tools" })
      .locator("input");

    const requestPromise = page.waitForRequest((request) => {
      const data = readRequestData(request);

      return data.by_category !== undefined;
    });

    await parentCategory.check();

    const request = await requestPromise;

    const requestData = readRequestData(request);

    const categories = requestData.by_category!.split(",");

    expect(categories.length).toBeGreaterThan(1);
  });

  test("AC14 should display brand filters", async ({ page }) => {
    await expect(page.locator('input[name="brand_id"]').first()).toBeVisible();

    const brands = await page.locator('input[name="brand_id"]').count();

    expect(brands).toBeGreaterThan(0);
  });

  test("AC15 should filter products by brand", async ({ page }) => {
    const forgeFlex = page.locator('[data-test^="brand-"]').first();

    const responsePromise = page.waitForResponse((response) =>
      response.url().includes("/products"),
    );

    await forgeFlex.check();

    const response = await responsePromise;

    const body = (await response.json()) as ProductsApiResponse;

    body.data.forEach((product) => {
      expect(product.brand.name).toBe("ForgeFlex Tools");
    });

    const apiIds = body.data.map((p) => p.id);

    const uiIds = await new ProductPage(page).getRenderedProductIds();

    expect(uiIds).toEqual(apiIds);
  });

  test("AC16 should combine category and brand filters", async ({ page }) => {
    const pliers = page
      .locator("label")
      .filter({
        hasText: "Pliers",
      })
      .locator('input[type="checkbox"]');

    const forgeFlex = page
      .locator("label")
      .filter({
        hasText: "ForgeFlex Tools",
      })
      .locator('input[type="checkbox"]');

    await pliers.check();

    await forgeFlex.check();

    await expect(pliers).toBeChecked();

    await expect(forgeFlex).toBeChecked();

    const response = await page.waitForResponse((response) => {
      if (!isProductsRequest(response.request())) {
        return false;
      }

      const requestData = readRequestData(response.request());

      return (
        requestData.by_category !== undefined &&
        requestData.by_brand !== undefined
      );
    });

    const body = (await response.json()) as ProductsApiResponse;

    body.data.forEach((product) => {
      expect(product.category.name).toBe("Pliers");

      expect(product.brand.name).toBe("ForgeFlex Tools");
    });

    const apiIds = body.data.map((product) => product.id);

    const uiIds = await new ProductPage(page).getRenderedProductIds();

    expect(uiIds).toEqual(apiIds);
  });

  test("should navigate to Power Tools category from navbar", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    await productPage.open();

    const responsePromise = page.waitForResponse((response) => {
      if (!isProductsRequest(response.request())) {
        return false;
      }

      const requestData = readRequestData(response.request());

      return requestData.by_category_slug === "power-tools";
    });

    await page.locator('[data-test="nav-categories"]').click();

    await page.locator('[data-test="nav-power-tools"]').click();

    const response = await responsePromise;

    //
    // URL changed
    //
    await expect(page).toHaveURL(/category\/power-tools/);

    const body = (await response.json()) as ProductsApiResponse;

    //
    // API request contains slug
    //
    const requestData = readRequestData(response.request());

    expect(requestData.by_category_slug).toBe("power-tools");

    //
    // Only Power Tools family products returned
    //
    body.data.forEach((product) => {
      expect(["Drill", "Saw", "Sander", "Grinder"]).toContain(
        product.category.name,
      );
    });

    //
    // API IDs
    //
    const apiIds = body.data.map((product) => product.id);

    //
    // UI IDs
    //
    await expect
      .poll(async () => productPage.getRenderedProductIds())
      .toEqual(apiIds);

    const uiIds = await productPage.getRenderedProductIds();

    expect(uiIds).toEqual(apiIds);

    //
    // Verify category filter section visible
    //
    await expect(page.locator("#filters")).toBeVisible();

    //
    // Verify category hierarchy
    //
    await expect(page.locator("#filters")).toContainText("By category:");
    // await expect(page.locator("#filters").getByText("Power Tools"),).toBeVisible();
    // await expect(page.locator("#filters").getByText("Drill")).toBeVisible();
    // await expect(page.locator("#filters").getByText("Saw")).toBeVisible();
    // await expect(page.locator("#filters").getByText("Sander")).toBeVisible();
  });
});
