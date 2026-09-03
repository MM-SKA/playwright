import { expect, Page, Response, test } from "@playwright/test";

interface Product {
  id: string;
  name: string;
  price: number;
  in_stock: boolean;
  is_rental: boolean;
}

interface ProductsResponse {
  data: Product[];
}

interface AddToCartRequest {
  product_id: string;
  quantity: number;
}

interface AddToCartResponse {
  result: string;
}

interface CartItem {
  id: string;
  quantity: number;
  product_id: string;

  product: {
    id: string;
    name: string;
    price: number;
  };
}

interface CartResponse {
  id: string;
  cart_items: CartItem[];
}

interface SelectedProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const baseUrl = "https://practicesoftwaretesting.com";

const apiHost = "api.practicesoftwaretesting.com";

function isProductsListingResponse(response: Response): boolean {
  const url = new URL(response.url());

  return (
    response.status() === 200 &&
    response.request().method() === "GET" &&
    url.hostname === apiHost &&
    url.pathname === "/products"
  );
}

function isAddToCartResponse(response: Response): boolean {
  const url = new URL(response.url());

  return (
    response.status() === 200 &&
    response.request().method() === "POST" &&
    url.hostname === apiHost &&
    /^\/carts\/[^/]+$/.test(url.pathname)
  );
}

function isGetCartResponse(response: Response): boolean {
  const url = new URL(response.url());

  return (
    response.status() === 200 &&
    response.request().method() === "GET" &&
    url.hostname === apiHost &&
    /^\/carts\/[^/]+$/.test(url.pathname)
  );
}

function parseMoney(value: string): number {
  return Number(value.replace(/[^0-9.-]/g, ""));
}

async function openProduct(page: Page, productId: string): Promise<void> {
  await page.goto(`${baseUrl}/product/${productId}`, {
    waitUntil: "domcontentloaded",
  });

  await expect(page.locator('[data-test="product-name"]')).toBeVisible();

  await expect(page.locator('[data-test="add-to-cart"]')).toBeVisible();
}

async function addProductToCart(
  page: Page,
  product: SelectedProduct,
): Promise<void> {
  await openProduct(page, product.id);

  const quantityInput = page.locator('[data-test="quantity"]');

  const addToCartButton = page.locator('[data-test="add-to-cart"]');

  await expect(quantityInput).toBeEnabled();

  await expect(addToCartButton).toBeEnabled();

  await quantityInput.fill(String(product.quantity));

  await expect(quantityInput).toHaveValue(String(product.quantity));

  const postResponsePromise = page.waitForResponse((response) =>
    isAddToCartResponse(response),
  );

  await addToCartButton.click();

  const postResponse = await postResponsePromise;

  const requestBody = postResponse.request().postDataJSON() as AddToCartRequest;

  expect(requestBody.product_id).toBe(product.id);

  expect(requestBody.quantity).toBe(product.quantity);

  const responseBody = (await postResponse.json()) as AddToCartResponse;

  expect(responseBody.result).toBe("item added or updated");

  const successToast = page.locator(".toast-success");

  await expect(successToast).toBeVisible();

  await expect(successToast).toContainText("Product added to shopping cart.");
}

test.describe("Shopping cart", () => {
  test("should add three in-stock products, verify cart and delete all items", async ({
    page,
  }) => {
    /*
     * Set up the listener before opening
     * the home page so the initial
     * products response is not missed.
     */
    const productsResponsePromise = page.waitForResponse((response) =>
      isProductsListingResponse(response),
    );

    await page.goto(baseUrl, {
      waitUntil: "domcontentloaded",
    });

    const productsResponse = await productsResponsePromise;

    const productsBody = (await productsResponse.json()) as ProductsResponse;

    /*
     * Dynamically select the first three
     * normal products that are in stock.
     *
     * No product IDs or names are
     * hardcoded.
     */
    const inStockProducts = productsBody.data
      .filter((product) => product.in_stock && !product.is_rental)
      .slice(0, 3);

    expect(inStockProducts.length).toBe(3);

    /*
     * Use different quantities so we can
     * verify each cart row independently.
     */
    const selectedProducts: SelectedProduct[] = inStockProducts.map(
      (product, index) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: index + 1,
      }),
    );

    /*
     * Add all three products through
     * the real product-detail UI.
     */
    for (const product of selectedProducts) {
      await addProductToCart(page, product);
    }

    /*
     * Open the checkout/cart page and
     * capture its GET cart response.
     */
    const cartResponsePromise = page.waitForResponse((response) =>
      isGetCartResponse(response),
    );

    await page.goto(`${baseUrl}/checkout`, {
      waitUntil: "domcontentloaded",
    });

    const cartResponse = await cartResponsePromise;

    const cartBody = (await cartResponse.json()) as CartResponse;

    expect(cartBody.id).toBeTruthy();

    expect(cartBody.cart_items.length).toBe(3);

    /*
     * Verify each selected product
     * exists in the cart API response
     * with the correct quantity.
     */
    for (const selectedProduct of selectedProducts) {
      const apiCartItem = cartBody.cart_items.find(
        (item) => item.product_id === selectedProduct.id,
      );

      expect(apiCartItem).toBeDefined();

      expect(apiCartItem?.product.name).toBe(selectedProduct.name);

      expect(apiCartItem?.quantity).toBe(selectedProduct.quantity);

      expect(apiCartItem?.product.price).toBe(selectedProduct.price);
    }

    /*
     * Verify all cart rows are rendered.
     */
    const productTitles = page.locator('[data-test="product-title"]');

    await expect(productTitles).toHaveCount(cartBody.cart_items.length);

    /*
     * Verify the UI row values against
     * the cart API response.
     */
    for (const apiCartItem of cartBody.cart_items) {
      const title = page.getByText(apiCartItem.product.name, {
        exact: true,
      });

      await expect(title).toBeVisible();

      const row = title.locator("xpath=ancestor::tr");

      const quantityInput = row.locator('[data-test="product-quantity"]');

      const unitPrice = row.locator('[data-test="product-price"]');

      const linePrice = row.locator('[data-test="line-price"]');

      await expect(quantityInput).toHaveValue(String(apiCartItem.quantity));

      await expect(unitPrice).toHaveText(
        `$${apiCartItem.product.price.toFixed(2)}`,
      );

      const expectedLinePrice =
        apiCartItem.product.price * apiCartItem.quantity;

      await expect(linePrice).toHaveText(`$${expectedLinePrice.toFixed(2)}`);
    }

    /*
     * Verify the displayed cart total.
     */
    const expectedCartTotal = cartBody.cart_items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );

    const displayedCartTotal = parseMoney(
      await page.locator('[data-test="cart-total"]').innerText(),
    );

    expect(displayedCartTotal).toBeCloseTo(expectedCartTotal, 2);

    /*
     * Cleanup:
     * Remove every cart row through UI.
     *
     * Delete buttons do not have a
     * data-test attribute, so they are
     * scoped to tbody product rows.
     */
    const cartRows = page.locator("table tbody tr");

    while ((await cartRows.count()) > 0) {
      const countBefore = await cartRows.count();

      const firstRow = cartRows.first();

      const deleteButton = firstRow.locator("a.btn-danger");

      await expect(deleteButton).toBeVisible();

      await deleteButton.click();

      /*
       * Wait until the UI removes the
       * deleted row.
       */
      await expect(cartRows).toHaveCount(countBefore - 1);
    }

    /*
     * Final cleanup verification.
     */
    await expect(productTitles).toHaveCount(0);

    await expect(page.locator("table tbody tr")).toHaveCount(0);
  });
});
