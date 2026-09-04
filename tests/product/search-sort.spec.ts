import { expect, Page, Request, Response, test } from "@playwright/test";

import { ProductPage, ProductSortOption } from "../pages/product.page";

import { ProductsApiResponse, ProductApiItem } from "../models/product.model";
import { waitForSortedResponse , requestContainsSort , readRequestData , waitForSearchAndSortResponse , verifyApiProductsMatchUi } from "../helpers/product-api-helper";

import { sortNamesAscending , sortNamesDescending , sortPricesAscending , sortPricesDescending , sortCo2Ascending , sortCo2Descending } from "../helpers/product-sort.helper";


test.describe("Product name sorting", () => {
  test.beforeEach(async ({ page }) => {
    const productPage = new ProductPage(page);

    await productPage.open();
  });
  
  test("should preserve search query when sorting", async ({ page }) => {
    const productPage = new ProductPage(page);

    await productPage.open();

    await productPage.search("plier");

    const requestPromise = page.waitForRequest((request) => {
      const data = readRequestData(request);

      return data.q === "plier" && data.sort === "name,asc";
    });

    await productPage.selectSort("name,asc");

    const request = await requestPromise;

    const data = readRequestData(request);

    expect(data.q).toBe("plier");

    expect(data.sort).toBe("name,asc");
  });

  test("should match API and UI after search and name A-Z sorting", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    const searchQuery = "plier";

    await productPage.search(searchQuery);

    await expect(productPage.searchInput).toHaveValue("");

    const responsePromise = waitForSearchAndSortResponse(
      page,
      searchQuery,
      "name,asc",
    );

    await productPage.selectSort("name,asc");

    const response = await responsePromise;

    const body = await verifyApiProductsMatchUi(productPage, response);

    const apiNames = body.data.map((product: ProductApiItem) =>
      product.name.trim(),
    );

    expect(apiNames).toEqual(sortNamesAscending(apiNames));

    await expect(productPage.sortSelect).toHaveValue("name,asc");
  });

  test("should match API and UI after search and name Z-A sorting", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    const searchQuery = "plier";

    await productPage.search(searchQuery);

    await expect(productPage.searchInput).toHaveValue("");

    const responsePromise = waitForSearchAndSortResponse(
      page,
      searchQuery,
      "name,desc",
    );

    await productPage.selectSort("name,desc");

    const response = await responsePromise;

    const body = await verifyApiProductsMatchUi(productPage, response);

    const apiNames = body.data.map((product: ProductApiItem) =>
      product.name.trim(),
    );

    expect(apiNames).toEqual(sortNamesDescending(apiNames));

    await expect(productPage.sortSelect).toHaveValue("name,desc");
  });

  test("should match API and UI after search and price low-high sorting", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    const searchQuery = "plier";

    await productPage.search(searchQuery);

    const responsePromise = waitForSearchAndSortResponse(
      page,
      searchQuery,
      "price,asc",
    );

    await productPage.selectSort("price,asc");

    const response = await responsePromise;

    const body = await verifyApiProductsMatchUi(productPage, response);

    const apiPrices = body.data.map((product: ProductApiItem) => product.price);

    const uiPrices = await productPage.getProductPrices();

    expect(uiPrices).toEqual(apiPrices);

    expect(apiPrices).toEqual(sortPricesAscending(apiPrices));

    await expect(productPage.sortSelect).toHaveValue("price,asc");
  });

  test("should match API and UI after search and price high-low sorting", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    const searchQuery = "plier";

    await productPage.search(searchQuery);

    const responsePromise = waitForSearchAndSortResponse(
      page,
      searchQuery,
      "price,desc",
    );

    await productPage.selectSort("price,desc");

    const response = await responsePromise;

    const body = await verifyApiProductsMatchUi(productPage, response);

    const apiPrices = body.data.map((product: ProductApiItem) => product.price);

    const uiPrices = await productPage.getProductPrices();

    expect(uiPrices).toEqual(apiPrices);

    expect(apiPrices).toEqual(sortPricesDescending(apiPrices));

    await expect(productPage.sortSelect).toHaveValue("price,desc");
  });

  test("should match API and UI after search and CO2 A-E sorting", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    const searchQuery = "plier";

    await productPage.search(searchQuery);

    const responsePromise = waitForSearchAndSortResponse(
      page,
      searchQuery,
      "co2_rating,asc",
    );

    await productPage.selectSort("co2_rating,asc");

    const response = await responsePromise;

    const body = await verifyApiProductsMatchUi(productPage, response);

    const apiRatings = body.data.map(
      (product: ProductApiItem) => product.co2_rating,
    );

    const uiRatings = await productPage.getRenderedCo2Ratings();

    expect(uiRatings).toEqual(apiRatings);

    expect(apiRatings).toEqual(sortCo2Ascending(apiRatings));

    await expect(productPage.sortSelect).toHaveValue("co2_rating,asc");
  });

  test("should match API and UI after search and CO2 E-A sorting", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    const searchQuery = "plier";

    await productPage.search(searchQuery);

    const responsePromise = waitForSearchAndSortResponse(
      page,
      searchQuery,
      "co2_rating,desc",
    );

    await productPage.selectSort("co2_rating,desc");

    const response = await responsePromise;

    const body = await verifyApiProductsMatchUi(productPage, response);

    const apiRatings = body.data.map(
      (product: ProductApiItem) => product.co2_rating,
    );

    const uiRatings = await productPage.getRenderedCo2Ratings();

    expect(uiRatings).toEqual(apiRatings);

    expect(apiRatings).toEqual(sortCo2Descending(apiRatings));

    await expect(productPage.sortSelect).toHaveValue("co2_rating,desc");
  });
});