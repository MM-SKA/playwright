import { expect, Page, Response, test } from "@playwright/test";

import { ProductPage } from "../pages/product.page";

interface ProductDetailResponse {
  id: string;
  name: string;
  description: string;
  price: number;

  in_stock: boolean;

  category: {
    name: string;
    slug: string;
  };

  brand: {
    name: string;
  };

  product_image: {
    title: string;
    file_name: string;
  };
}

interface ProductListItem {
  id: string;
  name: string;
  price: number;
  in_stock: boolean;
  is_rental: boolean;
}

interface ProductsListResponse {
  data: ProductListItem[];
}

interface SelectedCartProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
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
  cart_id: string;
  product_id: string;

  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    in_stock: boolean;
    is_rental: boolean;
  };
}

interface CartResponse {
  id: string;
  cart_items: CartItem[];
}

const baseUrl = "https://practicesoftwaretesting.com";

const apiHost = "api.practicesoftwaretesting.com";

function isProductsListResponse(response: Response): boolean {
  const url = new URL(response.url());

  const method = response.request().method();

  return (
    response.ok() &&
    url.hostname === apiHost &&
    url.pathname === "/products" &&
    (method === "QUERY" || method === "GET")
  );
}

function isCartPostResponse(response: Response): boolean {
  const url = new URL(response.url());

  return (
    response.ok() &&
    response.request().method() === "POST" &&
    url.hostname === apiHost &&
    /^\/carts\/[^/]+$/.test(url.pathname)
  );
}

function isCartGetResponse(response: Response): boolean {
  const url = new URL(response.url());

  return (
    response.ok() &&
    response.request().method() === "GET" &&
    url.hostname === apiHost &&
    /^\/carts\/[^/]+$/.test(url.pathname)
  );
}

function getCartIdFromResponse(response: Response): string {
  const url = new URL(response.url());

  const cartId = url.pathname.split("/").filter(Boolean).at(-1);

  if (!cartId) {
    throw new Error(`Cart ID was not found in response URL: ${response.url()}`);
  }

  return cartId;
}

function parseMoney(text: string): number {
  return Number(text.replace(/[^0-9.-]/g, ""));
}

async function addProductThroughUi(
  page: Page,
  product: SelectedCartProduct,
): Promise<string> {
  await page.goto(`${baseUrl}/product/${product.id}`, {
    waitUntil: "domcontentloaded",
  });

  const productName = page.locator('[data-test="product-name"]');

  const quantityInput = page.locator('[data-test="quantity"]');

  const addToCartButton = page.locator('[data-test="add-to-cart"]');

  await expect(productName).toHaveText(product.name);

  await expect(quantityInput).toBeEnabled();

  await expect(addToCartButton).toBeEnabled();

  await quantityInput.fill(String(product.quantity));

  await expect(quantityInput).toHaveValue(String(product.quantity));

  const postResponsePromise = page.waitForResponse((response) =>
    isCartPostResponse(response),
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

  return getCartIdFromResponse(postResponse);
}

test.describe("Product Detail", () => {
  test("1. should display product information", async ({ page }) => {
    await page.goto("https://practicesoftwaretesting.com");

    const detailResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());

      const isDetailEndpoint = /^\/products\/[^/]+$/.test(url.pathname);

      return (
        response.status() === 200 &&
        url.hostname === "api.practicesoftwaretesting.com" &&
        isDetailEndpoint
      );
    });

    //
    // Open first product card
    //
    await page.locator('[data-test^="product-"]').first().click();

    const detailResponse = await detailResponsePromise;

    console.log(detailResponse.url());

    const body = (await detailResponse.json()) as ProductDetailResponse;

    //
    // Verify Name
    //
    await expect(page.locator('[data-test="product-name"]')).toHaveText(
      body.name,
    );

    //
    // Verify Description
    //
    await expect(
      page.locator('[data-test="product-description"]'),
    ).toContainText(body.description);

    //
    // Verify Price
    //
    await expect(page.locator('[data-test="unit-price"]')).toHaveText(
      body.price.toFixed(2),
    );

    //
    // Verify Category Badge
    //
    await expect(page.locator('[aria-label="category"]')).toHaveText(
      body.category.name,
    );

    //
    // Verify Brand Badge
    //
    await expect(page.locator('[aria-label="brand"]')).toContainText(
      body.brand.name,
    );

    //
    // Verify Image
    //
    const image = page.locator("figure img");

    await expect(image).toBeVisible();

    const imageSrc = await image.getAttribute("src");

    expect(imageSrc).toContain(body.product_image.file_name);
  });

  test("2. should display related products", async ({ page }) => {
    const productPage = new ProductPage(page);

    await productPage.open();

    const relatedResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());

      return (
        response.status() === 200 &&
        url.hostname === "api.practicesoftwaretesting.com" &&
        url.pathname.endsWith("/related")
      );
    });

    //
    // Open first product
    //
    await page.locator('[data-test^="product-"]').first().click();

    const relatedResponse = await relatedResponsePromise;

    const apiProducts = await relatedResponse.json();

    //
    // Verify heading
    //
    await expect(page.getByText("Related products")).toBeVisible();

    //
    // Extract IDs from API
    //
    const apiIds = apiProducts.map((product: { id: string }) => product.id);

    //
    // Extract IDs from UI
    //
    const relatedCards = page.locator('a[href^="/product/"]');

    const uiIds = await relatedCards.evaluateAll((elements) =>
      elements.map((element) =>
        element.getAttribute("href")?.replace("/product/", ""),
      ),
    );

    expect(uiIds).toEqual(apiIds);

    expect(apiIds.length).toBeGreaterThan(0);
  });

  test("3. should handle quantity selector correctly", async ({ page }) => {
    const productPage = new ProductPage(page);

    await productPage.open();

    //
    // Open first product
    //
    await page.locator('[data-test^="product-"]').first().click();

    const quantityInput = page.locator('[data-test="quantity"]');

    const increaseButton = page.locator('[data-test="increase-quantity"]');

    const decreaseButton = page.locator('[data-test="decrease-quantity"]');

    //
    // AC2
    // Default quantity = 1
    //
    await expect(quantityInput).toHaveValue("1");

    //
    // AC3
    // Increase quantity
    //
    await increaseButton.click();

    await expect(quantityInput).toHaveValue("2");

    await increaseButton.click();

    await expect(quantityInput).toHaveValue("3");

    //
    // AC4
    // Decrease quantity
    //
    await decreaseButton.click();

    await expect(quantityInput).toHaveValue("2");

    await decreaseButton.click();

    await expect(quantityInput).toHaveValue("1");

    //
    // AC5
    // Cannot go below 1
    //
    await decreaseButton.click();

    await expect(quantityInput).toHaveValue("1");

    await decreaseButton.click();

    await expect(quantityInput).toHaveValue("1");

    //
    // Verify plus has no practical limit
    //
    for (let i = 0; i < 10; i++) {
      await increaseButton.click();
    }

    await expect(quantityInput).toHaveValue("11");
  });

  test("4. should allow manual quantity entry", async ({ page }) => {
    const productPage = new ProductPage(page);

    await productPage.open();

    await page.locator('[data-test^="product-"]').first().click();

    const quantityInput = page.locator('[data-test="quantity"]');

    await quantityInput.fill("25");

    await expect(quantityInput).toHaveValue("25");
  });

  test("5. should add product to cart with selected quantity", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);

    await productPage.open();

    //
    // Open first product
    //
    await page.locator('[data-test^="product-"]').first().click();

    const productId = page.url().split("/product/")[1];

    //
    // Set quantity = 4
    //
    const quantityInput = page.locator('[data-test="quantity"]');

    await quantityInput.fill("4");

    await expect(quantityInput).toHaveValue("4");

    //
    // Capture POST request
    //
    const addToCartPostPromise = page.waitForResponse((response) => {
      const request = response.request();

      return request.method() === "POST" && response.url().includes("/carts/");
    });

    await page.locator('[data-test="add-to-cart"]').click();

    //
    // Validate POST
    //
    const postResponse = await addToCartPostPromise;

    const postRequestBody = postResponse.request().postDataJSON();

    expect(postRequestBody.product_id).toBe(productId);

    expect(postRequestBody.quantity).toBe(4);

    const postBody = await postResponse.json();

    expect(postBody.result).toBe("item added or updated");

    //
    // Verify success notification
    //
    // await expect(
    //   page.getByText("Product added to shopping cart."),
    // ).toBeVisible();

    // Success toast
    const toast = page.locator(".toast-success");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Product added to shopping cart.");
  });

  test("6. should disable purchase controls for out of stock product", async ({
    page,
  }) => {
    await page.goto(
      "https://practicesoftwaretesting.com/product/01M1JT7AB2CCJZ5QTXSAVSZHZ3",
    );

    //
    // Quantity input disabled
    //
    await expect(page.locator('[data-test="quantity"]')).toBeDisabled();

    //
    // Minus disabled
    //
    await expect(
      page.locator('[data-test="decrease-quantity"]'),
    ).toBeDisabled();

    //
    // Plus disabled
    //
    await expect(
      page.locator('[data-test="increase-quantity"]'),
    ).toBeDisabled();

    //
    // Add to cart disabled
    //
    await expect(page.locator('[data-test="add-to-cart"]')).toBeDisabled();
  });

  test("7. should add three in-stock products, verify cart and remove all items", async ({
    page,
  }) => {
    /*
     * Start waiting before navigating so
     * the initial products response is not missed.
     */
    const productsResponsePromise = page.waitForResponse(
      (response) => isProductsListResponse(response),
      {
        timeout: 15_000,
      },
    );

    await page.goto(baseUrl, {
      waitUntil: "domcontentloaded",
    });

    const productsResponse = await productsResponsePromise;

    console.log(
      "Products request:",
      productsResponse.request().method(),
      productsResponse.url(),
    );

    const productsBody =
      (await productsResponse.json()) as ProductsListResponse;

    /*
     * Dynamically select three products.
     * No product IDs or names are hardcoded.
     */
    const inStockProducts = productsBody.data
      .filter((product) => product.in_stock && !product.is_rental)
      .slice(0, 3);

    expect(
      inStockProducts,
      "Expected at least three in-stock, non-rental products",
    ).toHaveLength(3);

    /*
     * Give each product a different quantity.
     */
    const selectedProducts: SelectedCartProduct[] = inStockProducts.map(
      (product, index) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: index + 1,
      }),
    );

    const capturedCartIds: string[] = [];

    /*
     * Add each product through the
     * product-detail UI.
     */
    for (const product of selectedProducts) {
      const cartId = await addProductThroughUi(page, product);

      capturedCartIds.push(cartId);
    }

    /*
     * Ensure every POST was sent to
     * the same dynamically created cart.
     */
    expect(new Set(capturedCartIds).size).toBe(1);

    const dynamicCartId = capturedCartIds[0];

    expect(dynamicCartId).toBeTruthy();

    console.log("Dynamic cart ID:", dynamicCartId);

    /*
     * Listen before navigating because
     * checkout loads the cart immediately.
     */
    const cartResponsePromise = page.waitForResponse(
      (response) =>
        isCartGetResponse(response) &&
        getCartIdFromResponse(response) === dynamicCartId,
    );

    await page.goto(`${baseUrl}/checkout`, {
      waitUntil: "domcontentloaded",
    });

    const cartResponse = await cartResponsePromise;

    const cartBody = (await cartResponse.json()) as CartResponse;

    /*
     * Verify that the GET response belongs
     * to the same dynamic cart.
     */
    expect(cartBody.id).toBe(dynamicCartId);

    expect(cartBody.cart_items.length).toBe(3);

    /*
     * Verify selected products against
     * the cart API response.
     */
    for (const selectedProduct of selectedProducts) {
      const apiCartItem = cartBody.cart_items.find(
        (item) => item.product_id === selectedProduct.id,
      );

      expect(apiCartItem).toBeDefined();

      expect(apiCartItem?.product.id).toBe(selectedProduct.id);

      expect(apiCartItem?.product.name).toBe(selectedProduct.name);

      expect(apiCartItem?.quantity).toBe(selectedProduct.quantity);

      expect(apiCartItem?.product.price).toBe(selectedProduct.price);
    }

    /*
     * Verify the number of UI cart rows.
     */
    const cartRows = page.locator("app-cart table tbody tr");

    await expect(cartRows).toHaveCount(cartBody.cart_items.length);

    /*
     * Verify every API cart item against
     * its corresponding UI row.
     */
    for (const apiCartItem of cartBody.cart_items) {
      const productTitle = page.locator('[data-test="product-title"]').filter({
        hasText: new RegExp(`^${apiCartItem.product.name}$`),
      });

      await expect(
        page.getByText(apiCartItem.product.name, {
          exact: true,
        }),
      ).toBeVisible();

      const row = page
        .getByText(apiCartItem.product.name, {
          exact: true,
        })
        .locator("xpath=ancestor::tr");

      const quantity = row.locator('[data-test="product-quantity"]');

      const unitPrice = row.locator('[data-test="product-price"]');

      const linePrice = row.locator('[data-test="line-price"]');

      await expect(quantity).toHaveValue(String(apiCartItem.quantity));

      await expect(unitPrice).toHaveText(
        `$${apiCartItem.product.price.toFixed(2)}`,
      );

      const expectedLinePrice =
        apiCartItem.product.price * apiCartItem.quantity;

      await expect(linePrice).toHaveText(`$${expectedLinePrice.toFixed(2)}`);
    }

    /*
     * Verify full cart total.
     */
    const expectedCartTotal = cartBody.cart_items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );

    const cartTotal = page.locator('[data-test="cart-total"]');

    await expect(cartTotal).toBeVisible();

    const displayedCartTotal = parseMoney(await cartTotal.innerText());

    expect(displayedCartTotal).toBeCloseTo(expectedCartTotal, 2);

    console.table(
      cartBody.cart_items.map((item) => ({
        product: item.product.name,
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice: item.product.price,
        lineTotal: item.product.price * item.quantity,
      })),
    );

    console.log("Expected cart total:", expectedCartTotal.toFixed(2));

    console.log("Displayed cart total:", displayedCartTotal.toFixed(2));

    /*
     * Cleanup:
     * Delete all cart items through UI.
     */
    while ((await cartRows.count()) > 0) {
      const rowCountBefore = await cartRows.count();

      const firstRow = cartRows.first();

      const productBeingDeleted = (
        await firstRow.locator('[data-test="product-title"]').innerText()
      ).trim();

      const deleteButton = firstRow.locator("a.btn-danger");

      await expect(deleteButton).toBeVisible();

      await deleteButton.click();

      await expect(cartRows).toHaveCount(rowCountBefore - 1);

      console.log(`Deleted from cart: ${productBeingDeleted}`);
    }

    /*
     * Final cleanup verification.
     */
    await expect(page.locator('[data-test="product-title"]')).toHaveCount(0);

    await expect(cartRows).toHaveCount(0);

    console.log("Cart cleanup completed.");
  });
});
