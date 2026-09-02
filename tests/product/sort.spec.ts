import { expect, Page, Request, Response, test } from "@playwright/test";

import { ProductPage, ProductSortOption } from "../pages/product.page";

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface ProductApiItem {
  id: string;
  name: string;
  price: number;
  co2_rating: string;

  category: Category;
  brand: Brand;
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
  by_category?: string;
  by_brand?: string;
}

function readRequestData(request: Request): ProductsRequestData {
  const requestUrl = new URL(request.url());

  const queryData: ProductsRequestData = {
    page: requestUrl.searchParams.get("page") ?? undefined,

    q: requestUrl.searchParams.get("q") ?? undefined,

    sort: requestUrl.searchParams.get("sort") ?? undefined,

    between: requestUrl.searchParams.get("between") ?? undefined,

    is_rental: requestUrl.searchParams.get("is_rental") ?? undefined,

    by_category: requestUrl.searchParams.get("by_category") ?? undefined,

    by_brand: requestUrl.searchParams.get("by_brand") ?? undefined,
  };

  try {
    const jsonData = request.postDataJSON() as ProductsRequestData;

    return {
      ...queryData,
      ...jsonData,
    };
  } catch {
    // Request may not use JSON.
  }

  const rawData = request.postData();

  if (!rawData) {
    return queryData;
  }

  const formData = new URLSearchParams(rawData);

  return {
    page: formData.get("page") ?? queryData.page,

    q: formData.get("q") ?? queryData.q,

    sort: formData.get("sort") ?? queryData.sort,

    between: formData.get("between") ?? queryData.between,

    is_rental: formData.get("is_rental") ?? queryData.is_rental,

    by_category: formData.get("by_category") ?? queryData.by_category,

    by_brand: formData.get("by_brand") ?? queryData.by_brand,
  };
}

function isProductsRequest(request: Request): boolean {
  const url = new URL(request.url());

  return (
    url.hostname === "api.practicesoftwaretesting.com" &&
    url.pathname === "/products"
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

function requestContainsSearchAndSort(
  request: Request,
  expectedQuery: string,
  expectedSort: ProductSortOption,
): boolean {
  if (!isProductsRequest(request)) {
    return false;
  }

  const requestData = readRequestData(request);

  return requestData.q === expectedQuery && requestData.sort === expectedSort;
}

async function waitForSearchAndSortResponse(
  page: Page,
  expectedQuery: string,
  expectedSort: ProductSortOption,
): Promise<Response> {
  return page.waitForResponse(
    (response) =>
      response.status() === 200 &&
      requestContainsSearchAndSort(
        response.request(),
        expectedQuery,
        expectedSort,
      ),
  );
}

async function verifyApiProductsMatchUi(
  productPage: ProductPage,
  response: Response,
): Promise<ProductsApiResponse> {
  const body = (await response.json()) as ProductsApiResponse;

  const apiProductIds = body.data.map((product: ProductApiItem) => product.id);

  const apiProductNames = body.data.map((product: ProductApiItem) =>
    product.name.trim(),
  );

  await expect
    .poll(async () => productPage.getRenderedProductIds())
    .toEqual(apiProductIds);

  const uiProductIds = await productPage.getRenderedProductIds();

  const uiProductNames = await productPage.getProductNames();

  expect(uiProductIds).toEqual(apiProductIds);

  expect(uiProductNames).toEqual(apiProductNames);

  return body;
}

function printComparison(
  testNumber: string,
  testName: string,
  apiData: unknown[],
  uiData: unknown[],
): void {
  console.log(`\n${"=".repeat(80)}`);

  console.log(`TEST ${testNumber}: ${testName}`);

  console.log(`${"=".repeat(80)}`);

  console.table(
    apiData.map((apiValue, index) => ({
      Index: index,
      API: apiValue,
      UI: uiData[index],
      Match: JSON.stringify(apiValue) === JSON.stringify(uiData[index]),
    })),
  );

  console.log(`${"=".repeat(80)}\n`);
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

  test("should render API products in the same order for CO2 rating A-E", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    await productPage.open();

    const responsePromise = waitForSortedResponse(page, "co2_rating,asc");

    await productPage.selectSort("co2_rating,asc");

    const response = await responsePromise;

    const body = (await response.json()) as ProductsApiResponse;

    const apiIds = body.data.map((product) => product.id);

    const apiRatings = body.data.map((product) => product.co2_rating);

    const uiIds = await productPage.getRenderedProductIds();

    const uiRatings = await productPage.getRenderedCo2Ratings();

    expect(uiIds).toEqual(apiIds);

    expect(uiRatings).toEqual(apiRatings);

    expect(apiRatings).toEqual(sortCo2Ascending(apiRatings));
  });

  test("should render API products in the same order for CO2 rating E-A", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    await productPage.open();

    const responsePromise = waitForSortedResponse(page, "co2_rating,desc");

    await productPage.selectSort("co2_rating,desc");

    const response = await responsePromise;

    const body = (await response.json()) as ProductsApiResponse;

    const apiIds = body.data.map((product) => product.id);

    const apiRatings = body.data.map((product) => product.co2_rating);

    const uiIds = await productPage.getRenderedProductIds();

    const uiRatings = await productPage.getRenderedCo2Ratings();

    expect(uiIds).toEqual(apiIds);

    expect(uiRatings).toEqual(apiRatings);

    expect(apiRatings).toEqual(sortCo2Descending(apiRatings));
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
    const parentCategory = page.locator(
      '[data-test="category-01M1GB8GFJH70BEA8ZX71GQ591"]',
    );

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
    const pliers = page.locator(
      '[data-test="category-01M1GB8GG81HPWNBG3NT691TBW"]',
    );

    const forgeFlex = page.locator(
      '[data-test="brand-01M1GB8G39RV1GZ4B67KCPMCP0"]',
    );

    await pliers.check();

    await forgeFlex.check();

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

    const requestData = readRequestData(response.request());

    console.log(requestData);

    expect(requestData.by_brand).toBeDefined();

    body.data.forEach((product) => {
      expect(product.category.name).toBe("Pliers");

      expect(product.brand.name).toBe("ForgeFlex Tools");
    });

    const apiIds = body.data.map((product) => product.id);

    const uiIds = await new ProductPage(page).getRenderedProductIds();

    expect(uiIds).toEqual(apiIds);
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
