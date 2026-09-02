import { expect , Locator, Page } from "@playwright/test";

export class ProductPage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly productCards: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.locator('[data-test="search-query"]');
    this.searchButton = page.locator('[data-test="search-submit"]');
    this.resetButton = page.locator('[data-test="search-reset"]');

    this.productCards = page.locator(".card");
  }

  async open(): Promise<void> {
    await this.page.goto("https://practicesoftwaretesting.com");
  }

  async search(keyword: string): Promise<void> {
    await this.searchInput.fill(keyword);

    await this.searchButton.click();
  }

  async clearSearch(): Promise<void> {
    await this.resetButton.click();
  }

  async expectSearchExecuted(): Promise<void> {
    await expect(this.searchInput).toHaveValue("");
  }
}
