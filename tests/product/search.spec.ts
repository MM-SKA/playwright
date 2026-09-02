import { expect, test } from "@playwright/test";

import { ProductPage } from "../pages/product.page";

test("should display search input", async ({ page }) => {
  const productPage = new ProductPage(page);
  await productPage.open();
  await expect(productPage.searchInput).toBeVisible();
});

test("should not search when less than 3 characters are entered (without trimming)", async ({
  page,
}) => {
  const productPage = new ProductPage(page);
  await productPage.open();
  await productPage.search("pl");
  await expect(productPage.searchInput).toHaveValue("pl");
});

test("should allow maximum 40 characters", async ({ page }) => {
  const productPage = new ProductPage(page);
  await productPage.open();
  await productPage.search("a".repeat(50));
  await expect(productPage.searchInput).toHaveValue("a".repeat(50));
});

test("valid search", async ({ page }) => {
  const productPage = new ProductPage(page);
  await productPage.open();
  await productPage.search("pliers");
  await expect(page.getByText("Searched for: pliers")).toBeVisible();
  await expect(page.locator(".card")).toHaveCount(4);
  await expect(productPage.searchInput).toHaveValue("");
});

test("should reset filters when search is performed", async ({ page }) => {
  const productPage = new ProductPage(page);
  await productPage.open();
  await page.getByLabel("Pliers").check();
  await productPage.search("hammer");
  await expect(page.getByLabel("Pliers")).not.toBeChecked();
});

test("should show no results", async ({ page }) => {
  const productPage = new ProductPage(page);
  await productPage.open();
  await productPage.search("abcdefghxyz");
  await expect(page.getByText("There are no products found.")).toBeVisible();
  await expect(productPage.searchInput).toHaveValue("");
});

test("should search irrespective of case", async ({ page }) => {
  const productPage = new ProductPage(page);
  await productPage.open();
  await productPage.search("PLIERS");
  await expect(page.getByText("Combination Pliers")).toBeVisible();
  await productPage.search("pliers");
  await expect(page.getByText("Combination Pliers")).toBeVisible();
  await expect(productPage.searchInput).toHaveValue("");
});

test("should trim search text", async ({ page }) => {
  const productPage = new ProductPage(page);
  await productPage.open();
  await productPage.search("  p");
  await expect(page.getByText("Combination Pliers")).toBeVisible();
  await expect(productPage.searchInput).toHaveValue("");
});

test("should search using substring", async ({ page }) => {
  const productPage = new ProductPage(page);
  await productPage.open();
  await productPage.search("lie");
  await expect(productPage.productCards).toHaveCount(4);
  await expect(page.getByText("Combination Pliers")).toBeVisible();
  await expect(productPage.searchInput).toHaveValue("");
});

test("should clear search", async ({ page }) => {
  const productPage = new ProductPage(page);
  await productPage.open();
  await productPage.search("pliers");
  await productPage.clearSearch();
  await expect(productPage.searchInput).toHaveValue("");
});

test("should search when enter key is pressed", async ({ page }) => {
  const productPage = new ProductPage(page);
  await productPage.open();
  await productPage.searchInput.fill("pliers");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Searched for: pliers")).toBeVisible();
  await expect(page.locator(".card")).toHaveCount(4);
  await expect(productPage.searchInput).toHaveValue("");
});
