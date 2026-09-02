import { expect, Page, Request, Response, test } from "@playwright/test";

import { ProductPage, ProductSortOption } from "../pages/product.page";

interface ProductApiItem {
  id: string;
  name: string;
  price: number;
  co2_rating: string;
}

interface ProductsApiResponse {
  current_page: number;
  data: ProductApiItem[];
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

interface ProductsRequestData {
  page?: string | number;
  q?: string;
  sort?: string;
  between?: string;
  is_rental?: string | boolean;
}

function readRequestData(request: Request): ProductsRequestData {
  /*
   * First try JSON request data.
   */
  try {
    return request.postDataJSON() as ProductsRequestData;
  } catch {
    // Continue to form-data parsing.
  }

  /*
   * Handle URL-encoded form data.
   */
  const rawData = request.postData();

  if (!rawData) {
    return {};
  }

  const parameters = new URLSearchParams(rawData);

  return {
    page: parameters.get("page") ?? undefined,

    sort: parameters.get("sort") ?? undefined,

    between: parameters.get("between") ?? undefined,

    is_rental: parameters.get("is_rental") ?? undefined,
  };
}

function isProductsRequest(request: Request): boolean {
  const requestUrl = new URL(request.url());

  return (
    requestUrl.hostname === "api.practicesoftwaretesting.com" &&
    requestUrl.pathname === "/products"
  );
}

function requestContainsSort(
  request: Request,
  expectedSort: ProductSortOption,
): boolean {
  if (!isProductsRequest(request)) {
    return false;
  }

  const requestUrl = new URL(request.url());

  /*
   * Support either implementation:
   *
   * Query parameter:
   * /products?sort=name,asc
   *
   * Request data:
   * { sort: "name,asc" }
   */
  const querySort = requestUrl.searchParams.get("sort");

  const bodySort = readRequestData(request).sort;

  return querySort === expectedSort || bodySort === expectedSort;
}

async function waitForSortedResponse(
  page: Page,
  expectedSort: ProductSortOption,
): Promise<Response> {
  return page.waitForResponse(
    (response) =>
      response.status() === 200 &&
      requestContainsSort(response.request(), expectedSort),
  );
}

function sortNamesAscending(names: string[]): string[] {
  return [...names].sort((first, second) =>
    first.localeCompare(second, "en", {
      sensitivity: "base",
    }),
  );
}

function sortNamesDescending(names: string[]): string[] {
  return [...names].sort((first, second) =>
    second.localeCompare(first, "en", {
      sensitivity: "base",
    }),
  );
}

function sortPricesAscending(prices: number[]): number[] {
  return [...prices].sort((a, b) => a - b);
}

function sortPricesDescending(prices: number[]): number[] {
  return [...prices].sort((a, b) => b - a);
}

function sortCo2Ascending(ratings: string[]): string[] {
  const order = ["A", "B", "C", "D", "E"];

  return [...ratings].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function sortCo2Descending(ratings: string[]): string[] {
  const order = ["A", "B", "C", "D", "E"];

  return [...ratings].sort((a, b) => order.indexOf(b) - order.indexOf(a));
}

test.describe("Product name sorting", () => {
  test.beforeEach(async ({ page }) => {
    const productPage = new ProductPage(page);

    await productPage.open();
  });

  test("should display sorting dropdown", async ({ page }) => {
    const productPage = new ProductPage(page);

    await expect(productPage.sortSelect).toBeVisible();

    await expect(productPage.sortSelect).toBeEnabled();
  });

  test("should display name sorting options", async ({ page }) => {
    const productPage = new ProductPage(page);

    await expect(
      productPage.sortSelect.locator('option[value="name,asc"]'),
    ).toHaveText("Name (A - Z)");

    await expect(
      productPage.sortSelect.locator('option[value="name,desc"]'),
    ).toHaveText("Name (Z - A)");
  });

  test("should have no sorting selected initially", async ({ page }) => {
    const productPage = new ProductPage(page);

    await expect(productPage.sortSelect).toHaveValue("");
  });

  test("should render API products in the same order for name A to Z", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    const responsePromise = waitForSortedResponse(page, "name,asc");

    await productPage.selectSort("name,asc");

    const response = await responsePromise;

    const responseBody = (await response.json()) as ProductsApiResponse;

    const apiProductIds = responseBody.data.map((product) => product.id);

    const apiProductNames = responseBody.data.map((product) =>
      product.name.trim(),
    );

    await expect(productPage.productCards).toHaveCount(apiProductIds.length);

    const renderedProductIds = await productPage.getRenderedProductIds();

    const renderedProductNames = await productPage.getProductNames();

    /*
     * Strongest mapping:
     * response.data[i].id
     * equals
     * data-test="product-{id}"
     */
    expect(renderedProductIds).toEqual(apiProductIds);

    /*
     * Also verify names rendered in
     * exactly the API response order.
     */
    expect(renderedProductNames).toEqual(apiProductNames);

    /*
     * Independently verify the response
     * itself is alphabetically sorted.
     */
    expect(apiProductNames).toEqual(sortNamesAscending(apiProductNames));

    await expect(productPage.sortSelect).toHaveValue("name,asc");
  });

  test("should render API products in the same order for name Z to A", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    const responsePromise = waitForSortedResponse(page, "name,desc");

    await productPage.selectSort("name,desc");

    const response = await responsePromise;

    const responseBody = (await response.json()) as ProductsApiResponse;

    const apiProductIds = responseBody.data.map((product) => product.id);

    const apiProductNames = responseBody.data.map((product) =>
      product.name.trim(),
    );

    await expect(productPage.productCards).toHaveCount(apiProductIds.length);

    const renderedProductIds = await productPage.getRenderedProductIds();

    const renderedProductNames = await productPage.getProductNames();

    expect(renderedProductIds).toEqual(apiProductIds);

    expect(renderedProductNames).toEqual(apiProductNames);

    expect(apiProductNames).toEqual(sortNamesDescending(apiProductNames));

    await expect(productPage.sortSelect).toHaveValue("name,desc");
  });

  test("should send the selected ascending sort value", async ({ page }) => {
    const productPage = new ProductPage(page);

    const requestPromise = page.waitForRequest((request) =>
      requestContainsSort(request, "name,asc"),
    );

    await productPage.selectSort("name,asc");

    const request = await requestPromise;

    const requestUrl = new URL(request.url());

    const requestData = readRequestData(request);

    const sortValue = requestUrl.searchParams.get("sort") ?? requestData.sort;

    expect(sortValue).toBe("name,asc");
  });

  test("should change API and UI order from ascending to descending", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    const ascendingResponsePromise = waitForSortedResponse(page, "name,asc");

    await productPage.selectSort("name,asc");

    const ascendingResponse = await ascendingResponsePromise;

    const ascendingBody =
      (await ascendingResponse.json()) as ProductsApiResponse;

    const ascendingApiIds = ascendingBody.data.map(
      (product: ProductApiItem) => product.id,
    );

    await expect(productPage.productCards).toHaveCount(ascendingApiIds.length);

    const ascendingUiIds = await productPage.getRenderedProductIds();

    expect(ascendingUiIds).toEqual(ascendingApiIds);

    const descendingResponsePromise = waitForSortedResponse(page, "name,desc");

    await productPage.selectSort("name,desc");

    const descendingResponse = await descendingResponsePromise;

    const descendingBody =
      (await descendingResponse.json()) as ProductsApiResponse;

    const descendingApiIds = descendingBody.data.map(
      (product: ProductApiItem) => product.id,
    );

    await expect
      .poll(async () => productPage.getRenderedProductIds())
      .toEqual(descendingApiIds);

    const descendingUiIds = await productPage.getRenderedProductIds();

    expect(descendingUiIds).toEqual(descendingApiIds);

    expect(descendingUiIds).not.toEqual(ascendingUiIds);
  });

  test("should render API products in the same order for price high to low", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    await productPage.open();

    const responsePromise = waitForSortedResponse(page, "price,desc");

    await productPage.selectSort("price,desc");

    const response = await responsePromise;

    const body = (await response.json()) as ProductsApiResponse;

    const apiIds = body.data.map((product) => product.id);

    const apiPrices = body.data.map((product) => product.price);

    const uiIds = await productPage.getRenderedProductIds();

    const uiPrices = await productPage.getProductPrices();

    expect(uiIds).toEqual(apiIds);

    expect(uiPrices).toEqual(apiPrices);

    expect(apiPrices).toEqual(sortPricesDescending(apiPrices));

    await expect(productPage.sortSelect).toHaveValue("price,desc");
  });

  test("should render API products in the same order for price low to high", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    await productPage.open();

    const responsePromise = waitForSortedResponse(page, "price,asc");

    await productPage.selectSort("price,asc");

    const response = await responsePromise;

    const body = (await response.json()) as ProductsApiResponse;

    const apiIds = body.data.map((product) => product.id);

    const apiPrices = body.data.map((product) => product.price);

    const uiIds = await productPage.getRenderedProductIds();

    const uiPrices = await productPage.getProductPrices();

    expect(uiIds).toEqual(apiIds);

    expect(uiPrices).toEqual(apiPrices);

    expect(apiPrices).toEqual(sortPricesAscending(apiPrices));

    await expect(productPage.sortSelect).toHaveValue("price,asc");
  });

  test("should change order from price low to high into price high to low", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    await productPage.open();

    const ascResponsePromise = waitForSortedResponse(page, "price,asc");

    await productPage.selectSort("price,asc");

    const ascResponse = await ascResponsePromise;

    const ascBody = (await ascResponse.json()) as ProductsApiResponse;

    const ascIds = ascBody.data.map((product) => product.id);

    const descResponsePromise = waitForSortedResponse(page, "price,desc");

    await productPage.selectSort("price,desc");

    const descResponse = await descResponsePromise;

    const descBody = (await descResponse.json()) as ProductsApiResponse;

    const descIds = descBody.data.map((product) => product.id);

    expect(descIds).not.toEqual(ascIds);
  });

  test(
  "should render API products in the same order for CO2 rating A-E",
  async ({ page }) => {

    const productPage =
      new ProductPage(page);

    await productPage.open();

    const responsePromise =
      waitForSortedResponse(
        page,
        "co2_rating,asc"
      );

    await productPage.selectSort(
      "co2_rating,asc"
    );

    const response =
      await responsePromise;

    const body =
      (await response.json())      as ProductsApiResponse;

    const apiIds =
      body.data.map(
        product =>
          product.id
      );

    const apiRatings =
      body.data.map(
        product =>
          product.co2_rating
      );

    const uiIds =
      await productPage
        .getRenderedProductIds();

    const uiRatings =
      await productPage
        .getRenderedCo2Ratings();

    expect(uiIds)
      .toEqual(apiIds);

    expect(uiRatings)
      .toEqual(apiRatings);

    expect(apiRatings)
      .toEqual(
        sortCo2Ascending(
          apiRatings
        )
      );

  }
);

test(
  "should render API products in the same order for CO2 rating E-A",
  async ({ page }) => {

    const productPage =
      new ProductPage(page);

    await productPage.open();

    const responsePromise =
      waitForSortedResponse(
        page,
        "co2_rating,desc"
      );

    await productPage.selectSort(
      "co2_rating,desc"
    );

    const response =
      await responsePromise;

    const body =
      (await response.json())      as ProductsApiResponse;

    const apiIds =
      body.data.map(
        product =>
          product.id
      );

    const apiRatings =
      body.data.map(
        product =>
          product.co2_rating
      );

    const uiIds =
      await productPage
        .getRenderedProductIds();

    const uiRatings =
      await productPage
        .getRenderedCo2Ratings();

    expect(uiIds)
      .toEqual(apiIds);

    expect(uiRatings)
      .toEqual(apiRatings);

    expect(apiRatings)
      .toEqual(
        sortCo2Descending(
          apiRatings
        )
      );

  }
);
});
