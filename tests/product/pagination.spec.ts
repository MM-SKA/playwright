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

test.describe("Product Pagination", () => {
  test.beforeEach(async ({ page }) => {
    const productPage = new ProductPage(page);

    await productPage.open();
  });

  test("AC3 should display pagination controls", async ({ page }) => {
    const pagination = page.locator(".pagination");

    await expect(pagination).toBeVisible();

    await expect(page.locator('[data-test="pagination-prev"]')).toBeVisible();

    await expect(page.locator('[data-test="pagination-next"]')).toBeVisible();

    const pageNumbers = page.locator('.page-link[aria-label^="Page-"]');

    expect(await pageNumbers.count()).toBeGreaterThan(1);
  });

  test("AC4 should navigate to next page", async ({ page }) => {
    const productPage = new ProductPage(page);

    //
    // Capture initial UI state
    //
    const initialUiIds = await productPage.getRenderedProductIds();

    //
    // Verify pagination exists
    //
    const pageNumbers = page.locator('.page-link[aria-label^="Page-"]');

    const pageCount = await pageNumbers.count();

    expect(pageCount).toBeGreaterThan(1);

    //
    // Capture API response from NEXT click
    //
    const nextResponsePromise = page.waitForResponse((response) => {
      const request = response.request();

      return response.status() === 200 && isProductsRequest(request);
    });

    //
    // Move to next page
    //
    await page.locator('[data-test="pagination-next"]').click();

    const nextResponse = await nextResponsePromise;

    const nextBody = (await nextResponse.json()) as ProductsApiResponse;

    //
    // Verify page changed
    //
    expect(nextBody.current_page).toBeGreaterThan(1);

    //
    // Verify pagination metadata changed
    //
    expect(nextBody.from).toBeGreaterThan(1);

    expect(nextBody.to).toBeGreaterThan(nextBody.from);

    //
    // Verify products changed
    //
    const nextIds = nextBody.data.map((product) => product.id);

    expect(nextIds).not.toEqual(initialUiIds);

    //
    // Verify UI rendered API response
    //
    await expect
      .poll(async () => productPage.getRenderedProductIds())
      .toEqual(nextIds);

    const uiIds = await productPage.getRenderedProductIds();

    expect(uiIds).toEqual(nextIds);

    //
    // Verify active page changed
    //
    await expect(page.locator(".page-item.active .page-link")).toHaveText(
      String(nextBody.current_page),
    );
  });
  test("should navigate using next button", async ({ page }) => {
    const nextButton = page.locator('[data-test="pagination-next"]');

    await nextButton.click();

    const activePage = page.locator(".page-item.active");

    await expect(activePage).toContainText("2");
  });
  test("should navigate using previous button", async ({ page }) => {
    await page.locator('[aria-label="Page-2"]').click();

    await page.locator('[data-test="pagination-prev"]').click();

    const activePage = page.locator(".page-item.active");

    await expect(activePage).toContainText("1");
  });
});
