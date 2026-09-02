import { Locator, Page } from "@playwright/test";

export type ProductSortOption =
  | ""
  | "name,asc"
  | "name,desc"
  | "price,asc"
  | "price,desc"
  | "co2_rating,asc"
  | "co2_rating,desc";

export class ProductPage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;

  readonly sortSelect: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;

  readonly co2Ratings: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.locator('[data-test="search-query"]');

    this.searchButton = page.locator('[data-test="search-submit"]');

    this.resetButton = page.locator('[data-test="search-reset"]');

    this.sortSelect = page.locator('[data-test="sort"]');

    /*
     * Matches:
     * data-test="product-01M1..."
     *
     * Does not match:
     * data-test="product-name"
     * data-test="product-price"
     */
    this.productCards = page.locator('a.card[data-test^="product-"]');

    this.productNames = page.locator('[data-test="product-name"]');

    this.productPrices = page.locator('[data-test="product-price"]');

    this.co2Ratings = page.locator('[data-test="co2-rating-badge"]');
  }

  async open(): Promise<void> {
    await this.page.goto("https://practicesoftwaretesting.com", {
      waitUntil: "domcontentloaded",
    });

    await this.sortSelect.waitFor({
      state: "visible",
    });

    await this.productCards.first().waitFor({
      state: "visible",
    });
  }

  async search(keyword: string): Promise<void> {
    await this.searchInput.fill(keyword);

    await this.searchButton.click();
  }

  async searchUsingEnter(keyword: string): Promise<void> {
    await this.searchInput.fill(keyword);

    await this.searchInput.press("Enter");
  }

  async clearSearch(): Promise<void> {
    await this.resetButton.click();
  }

  async selectSort(sortOption: ProductSortOption): Promise<void> {
    await this.sortSelect.selectOption(sortOption);
  }

  async getProductNames(): Promise<string[]> {
    const names = await this.productNames.allTextContents();

    return names.map((name) => name.trim()).filter((name) => name.length > 0);
  }

  async getRenderedProductIds(): Promise<string[]> {
    const dataTestValues = await this.productCards.evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("data-test")),
    );

    return dataTestValues
      .filter(
        (value): value is string =>
          value !== null && value.startsWith("product-"),
      )
      .map((value) => value.substring("product-".length));
  }

  async getRenderedCo2Ratings(): Promise<string[]> {
    return this.co2Ratings.locator(".active").allTextContents();
  }

  async getProductPrices(): Promise<number[]> {
    const prices = await this.productPrices.allTextContents();

    return prices.map((price) =>
      Number.parseFloat(price.replace(/[^0-9.]/g, "")),
    );
  }
}
