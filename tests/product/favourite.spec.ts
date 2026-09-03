import { expect, test } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { ProductPage } from "../pages/product.page";

test.describe("Favorites - Anonymous", () => {
  test("1. should show unauthorized toast when user is not logged in", async ({
    page,
  }) => {
    await page.goto("https://practicesoftwaretesting.com");

    await page.locator('[data-test^="product-"]').first().click();

    await page.locator('[data-test="add-to-favorites"]').click();

    const errorToast = page.locator(".toast-error").last();

    await expect(errorToast).toBeVisible();

    await expect(errorToast).toContainText("Unauthorized");
  });
});

test.describe("Favorites - Authenticated", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login("test@test.com", "Samarth3005@");
    console.log("URL after login:", page.url());
    await page.goto("https://practicesoftwaretesting.com");
  });
  test("2. should add product to favourites", async ({ page }) => {
    await page.locator('[data-test^="product-"]').first().click();

    const productId = page.url().split("/product/")[1];

    const favoritePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/favorites"),
    );

    await page.locator('[data-test="add-to-favorites"]').click();

    const response = await favoritePromise;

    expect(response.status()).toBe(201);

    const requestBody = response.request().postDataJSON();

    expect(requestBody.product_id).toBe(productId);

    const responseBody = await response.json();

    expect(responseBody.product_id).toBe(productId);

    expect(responseBody.id).toBeTruthy();

    const successToast = page.locator(".toast-success");

    await expect(successToast).toBeVisible();
  });

  test("3. should not allow duplicate favourites", async ({ page }) => {
    await page.locator('[data-test^="product-"]').first().click();

    //
    // First click
    //
    await page.locator('[data-test="add-to-favorites"]').click();

    //
    // Second click should return 409
    //
    const duplicatePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/favorites") &&
        response.status() === 409,
    );

    await page.locator('[data-test="add-to-favorites"]').click();

    const duplicateResponse = await duplicatePromise;

    expect(duplicateResponse.status()).toBe(409);

    const body = await duplicateResponse.json();

    expect(body.message).toBe("Duplicate Entry");

    //
    // Multiple toast-errors may exist in DOM.
    // Always validate the latest one.
    //
    const errorToast = page.locator(".toast-error").last();

    await expect(errorToast).toBeVisible();

    await expect(errorToast).toContainText(
      "Product already in your favorites list",
    );
  });

  test("4. should view and remove favourite", async ({ page }) => {
    //
    // Open account menu
    //
    await page.locator('[data-test="nav-menu"]').click();

    //
    // Open favorites page
    //
    await page.locator('[data-test="nav-my-favorites"]').click();

    await expect(page).toHaveURL(/account\/favorites/);
    await page.pause();

    //
    // Favorites page title
    //
    await expect(page.locator('[data-test="page-title"]')).toHaveText(
      "Favorites",
    );

    const favoriteCards = page.locator('[data-test^="favorite-"]');

    const favoriteCount = await favoriteCards.count();

    //
    // Empty state
    //
    if (favoriteCount === 0) {
      await expect(page.getByText("There are no favorites yet")).toBeVisible();

      return;
    }

    //
    // Capture first favorite card id
    //
    const firstCard = favoriteCards.first();

    const favoriteId = await firstCard.getAttribute("data-test");

    console.log("Removing:", favoriteId);

    //
    // DELETE favorite request
    //
    const deletePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        response.url().includes("/favorites/"),
    );

    //
    // Click remove button
    //
    await firstCard.locator('[data-test="delete"]').click();

    const deleteResponse = await deletePromise;

    expect(deleteResponse.ok()).toBeTruthy();

    //
    // Card count reduced
    //
    await expect(favoriteCards).toHaveCount(favoriteCount - 1);
    await page.pause();
  });
});
