import { expect, Page, Request, Response } from "@playwright/test";

import { ProductPage, ProductSortOption } from "../pages/product.page";

import { ProductApiItem , ProductsApiResponse } from "../models/product.model";

export interface ProductsRequestData {
  page?: string | number;
  q?: string;
  sort?: string;
  between?: string;
  is_rental?: string | boolean;
  by_category?: string;
  by_brand?: string;
  by_category_slug?: string;
}

export function readRequestData(request: Request): ProductsRequestData {
  const requestUrl = new URL(request.url());

  const queryData: ProductsRequestData = {
    page: requestUrl.searchParams.get("page") ?? undefined,

    q: requestUrl.searchParams.get("q") ?? undefined,

    sort: requestUrl.searchParams.get("sort") ?? undefined,

    between: requestUrl.searchParams.get("between") ?? undefined,

    is_rental: requestUrl.searchParams.get("is_rental") ?? undefined,

    by_category: requestUrl.searchParams.get("by_category") ?? undefined,

    by_brand: requestUrl.searchParams.get("by_brand") ?? undefined,

    by_category_slug:
      requestUrl.searchParams.get("by_category_slug") ?? undefined,
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

    by_category_slug:
      formData.get("by_category_slug") ?? queryData.by_category_slug,
  };
}

export function isProductsRequest(request: Request): boolean {
  const url = new URL(request.url());

  return (
    url.hostname === "api.practicesoftwaretesting.com" &&
    url.pathname === "/products"
  );
}

export function requestContainsSort(
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

export async function waitForSortedResponse(
  page: Page,
  expectedSort: ProductSortOption,
): Promise<Response> {
  return page.waitForResponse(
    (response) =>
      response.status() === 200 &&
      requestContainsSort(response.request(), expectedSort),
  );
}

export function requestContainsSearchAndSort(
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

export async function waitForSearchAndSortResponse(
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

export async function verifyApiProductsMatchUi(
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
