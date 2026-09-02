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
