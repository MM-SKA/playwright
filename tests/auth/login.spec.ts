import { expect, test } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

test("should login successfully", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();

  await loginPage.login("customer2@practicesoftwaretesting.com", "welcome01");

  await expect(page).toHaveURL(/account/);

  await expect(page.locator("#menu")).toContainText("Jack Howe");
});
