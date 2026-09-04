import { expect, test } from "@playwright/test";

import { ProductPage } from "../pages/product.page";

import { ProductsApiResponse } from "../models/product.model";
import {
  readRequestData,
  isProductsRequest,
} from "../helpers/product-api-helper";

test.describe("Price range filtering", () => {
  test.beforeEach(async ({ page }) => {
    const productPage = new ProductPage(page);

    await productPage.open();
  });
  test("should filter products by selected price range", async ({ page }) => {
    const productPage = new ProductPage(page);

    await productPage.open();

    const minSlider = page.locator(".ngx-slider-pointer-min");

    const maxSlider = page.locator(".ngx-slider-pointer-max");

    const initialMin = Number(await minSlider.getAttribute("aria-valuenow"));

    const initialMax = Number(await maxSlider.getAttribute("aria-valuenow"));

    await minSlider.focus();

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("ArrowRight");
    }

    await maxSlider.focus();

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("ArrowLeft");
    }

    const minValue = Number(await minSlider.getAttribute("aria-valuenow"));

    const maxValue = Number(await maxSlider.getAttribute("aria-valuenow"));

    const expectedBetween = `price,${minValue},${maxValue}`;

    const response = await page.waitForResponse((response) => {
      if (!isProductsRequest(response.request())) {
        return false;
      }

      const requestData = readRequestData(response.request());

      return requestData.between === expectedBetween;
    });

    const requestData = readRequestData(response.request());

    expect(requestData.between).toBe(expectedBetween);

    const body = (await response.json()) as ProductsApiResponse;

    const apiIds = body.data.map((product) => product.id);

    await expect
      .poll(async () => productPage.getRenderedProductIds())
      .toEqual(apiIds);

    const uiIds = await productPage.getRenderedProductIds();

    expect(uiIds).toEqual(apiIds);

    expect(minValue).toBeGreaterThan(initialMin);

    expect(maxValue).toBeLessThan(initialMax);

    expect(body.data.length).toBeGreaterThan(0);
  });
});
