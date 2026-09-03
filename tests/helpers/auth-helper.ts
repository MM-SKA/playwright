import { Page } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

export async function login(
  page: Page,
  email: string,
  password: string,
) {
  const loginPage = new LoginPage(page);

  await loginPage.open();

  await loginPage.login(
    email,
    password,
  );
}