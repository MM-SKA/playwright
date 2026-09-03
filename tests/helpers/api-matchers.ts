import { Response } from "@playwright/test";

export const baseUrl = "https://practicesoftwaretesting.com";

export const apiHost = "api.practicesoftwaretesting.com";

export function isProductsListResponse(response: Response): boolean {
  const url = new URL(response.url());
  const method = response.request().method();

  return (
    response.ok() &&
    url.hostname === apiHost &&
    url.pathname === "/products" &&
    (method === "QUERY" || method === "GET")
  );
}

export function isProductDetailResponse(response: Response): boolean {
  const url = new URL(response.url());

  return (
    response.ok() &&
    response.request().method() === "GET" &&
    url.hostname === apiHost &&
    /^\/products\/[^/]+$/.test(url.pathname)
  );
}

export function isRelatedProductsResponse(response: Response): boolean {
  const url = new URL(response.url());

  return (
    response.ok() &&
    response.request().method() === "GET" &&
    url.hostname === apiHost &&
    /^\/products\/[^/]+\/related$/.test(url.pathname)
  );
}

export function isCartPostResponse(response: Response): boolean {
  const url = new URL(response.url());

  return (
    response.ok() &&
    response.request().method() === "POST" &&
    url.hostname === apiHost &&
    /^\/carts\/[^/]+$/.test(url.pathname)
  );
}

export function isCartGetResponse(response: Response): boolean {
  const url = new URL(response.url());

  return (
    response.ok() &&
    response.request().method() === "GET" &&
    url.hostname === apiHost &&
    /^\/carts\/[^/]+$/.test(url.pathname)
  );
}

export function getCartIdFromResponse(response: Response): string {
  const url = new URL(response.url());

  const cartId = url.pathname.split("/").filter(Boolean).at(-1);

  if (!cartId) {
    throw new Error(`Cart ID was not found in response URL: ${response.url()}`);
  }

  return cartId;
}
