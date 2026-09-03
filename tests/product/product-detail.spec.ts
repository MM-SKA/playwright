import { expect, test } from "@playwright/test";
import { ProductPage, ProductSortOption } from "../pages/product.page";

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
});
