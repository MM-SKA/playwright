import { expect, test } from "@playwright/test";

import { RegistrationPage } from "../pages/registration.page";

import {
  createUniqueEmail,
  createValidRegistrationData,
  getExactly18YearsAgo,
  getOneDayOver18,
  getOneDayUnder18,
} from "../helpers/registration-data";

test.describe("Customer registration", () => {
  test.beforeEach(async ({ page }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.open();
  });

  test("should display all required registration fields", async ({ page }) => {
    const registrationPage = new RegistrationPage(page);

    await expect(registrationPage.firstNameInput).toBeVisible();

    await expect(registrationPage.lastNameInput).toBeVisible();

    await expect(registrationPage.dobInput).toBeVisible();

    await expect(registrationPage.countrySelect).toBeVisible();

    await expect(registrationPage.postalCodeInput).toBeVisible();

    await expect(registrationPage.houseNumberInput).toBeVisible();

    await expect(registrationPage.streetInput).toBeVisible();

    await expect(registrationPage.cityInput).toBeVisible();

    await expect(registrationPage.stateInput).toBeVisible();

    await expect(registrationPage.phoneInput).toBeVisible();

    await expect(registrationPage.emailInput).toBeVisible();

    await expect(registrationPage.passwordInput).toBeVisible();

    await expect(registrationPage.registerButton).toBeVisible();
  });

  test("should render country as a dropdown", async ({ page }) => {
    const registrationPage = new RegistrationPage(page);

    await expect(registrationPage.countrySelect).toHaveJSProperty(
      "tagName",
      "SELECT",
    );

    const options = registrationPage.countrySelect.locator("option");

    expect(await options.count()).toBeGreaterThan(1);
  });

  test("should allow country selection", async ({ page }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.selectCountry("IN");

    await expect(registrationPage.countrySelect).toHaveValue("IN");
  });

  test("should display validation errors when all fields are empty", async ({
    page,
  }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.submit();

    await expect(registrationPage.firstNameError).toContainText(
      "First name is required",
    );

    await expect(registrationPage.lastNameError).toContainText(
      "Last name is required",
    );

    await expect(registrationPage.dobError).toContainText(
      "Date of Birth is required",
    );

    await expect(registrationPage.countryError).toContainText(
      "Country is required",
    );

    await expect(registrationPage.postalCodeError).toContainText(
      "Postcode is required",
    );

    await expect(registrationPage.houseNumberError).toContainText(
      "House number is required",
    );

    await expect(registrationPage.streetError).toContainText(
      "Street is required",
    );

    await expect(registrationPage.cityError).toContainText("City is required");

    await expect(registrationPage.stateError).toContainText(
      "State is required",
    );

    await expect(registrationPage.phoneError).toContainText(
      "Phone is required",
    );

    await expect(registrationPage.emailError).toContainText(
      "Email is required",
    );

    await expect(registrationPage.passwordError).toContainText(
      "Password is required",
    );
  });

  const requiredFieldCases = [
    {
      name: "first name",
      field: "firstNameInput",
      error: "firstNameError",
      expectedMessage: "First name is required",
    },
    {
      name: "last name",
      field: "lastNameInput",
      error: "lastNameError",
      expectedMessage: "Last name is required",
    },
    {
      name: "date of birth",
      field: "dobInput",
      error: "dobError",
      expectedMessage: "Date of Birth is required",
    },
    {
      name: "postal code",
      field: "postalCodeInput",
      error: "postalCodeError",
      expectedMessage: "Postcode is required",
    },
    {
      name: "house number",
      field: "houseNumberInput",
      error: "houseNumberError",
      expectedMessage: "House number is required",
    },
    {
      name: "street",
      field: "streetInput",
      error: "streetError",
      expectedMessage: "Street is required",
    },
    {
      name: "city",
      field: "cityInput",
      error: "cityError",
      expectedMessage: "City is required",
    },
    {
      name: "state",
      field: "stateInput",
      error: "stateError",
      expectedMessage: "State is required",
    },
    {
      name: "phone",
      field: "phoneInput",
      error: "phoneError",
      expectedMessage: "Phone is required",
    },
    {
      name: "email",
      field: "emailInput",
      error: "emailError",
      expectedMessage: "Email is required",
    },
    {
      name: "password",
      field: "passwordInput",
      error: "passwordError",
      expectedMessage: "Password is required",
    },
  ] as const;

  for (const requiredFieldCase of requiredFieldCases) {
    test(`should require ${requiredFieldCase.name}`, async ({ page }) => {
      const registrationPage = new RegistrationPage(page);

      const data = createValidRegistrationData();

      await registrationPage.fillRegistrationForm(data);

      await registrationPage[requiredFieldCase.field].fill("");

      await registrationPage.submit();

      await expect(registrationPage[requiredFieldCase.error]).toBeVisible();

      await expect(registrationPage[requiredFieldCase.error]).toContainText(
        requiredFieldCase.expectedMessage,
      );
    });
  }

  test("should require country selection", async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    await registrationPage.open();
    await registrationPage.submit();
    await expect(registrationPage.countryError).toContainText(
      "Country is required",
    );
  });

  test("should reject invalid date format", async ({ page }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.dobInput.fill("18-08-2000");

    await registrationPage.submit();

    await expect(registrationPage.dobError).toContainText(
      "Please enter a valid date in YYYY-MM-DD format.",
    );
  });

  test("should reject customer younger than 18", async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    await registrationPage.open();
    const data = createValidRegistrationData({
      dob: "2010-01-01",
      password: "Unique@Test123!",
    });
    await registrationPage.register(data);
    await expect(registrationPage.registerError).toBeVisible();
    await expect(registrationPage.registerError).toContainText(
      "Customer must be 18 years old",
    );
  });

  test("should accept a customer older than 18", async ({ page }) => {
    const registrationPage = new RegistrationPage(page);

    const data = createValidRegistrationData({
      dob: getOneDayOver18(),
      email: createUniqueEmail(),
    });

    await registrationPage.register(data);

    await expect(page).toHaveURL(/auth\/login/);
  });

  test("should display password requirements", async ({ page }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.passwordInput.focus();

    await expect(registrationPage.passwordHelp).toBeVisible();

    await expect(registrationPage.passwordHelp).toContainText(
      "Be at least 8 characters long",
    );

    await expect(registrationPage.passwordHelp).toContainText(
      "Contain both uppercase and lowercase letters",
    );

    await expect(registrationPage.passwordHelp).toContainText(
      "Include at least one number",
    );

    await expect(registrationPage.passwordHelp).toContainText(
      "Have at least one special symbol",
    );
  });

  test("should reject a password shorter than 8 characters", async ({
    page,
  }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.passwordInput.fill("Ab1@");

    await registrationPage.submit();

    await expect(registrationPage.passwordError).toBeVisible();
  });

  test("should reject a password without uppercase letters", async ({
    page,
  }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.passwordInput.fill("password@123");

    await registrationPage.submit();

    await expect(registrationPage.passwordError).toBeVisible();
  });

  test("should reject a password without lowercase letters", async ({
    page,
  }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.passwordInput.fill("PASSWORD@123");

    await registrationPage.submit();

    await expect(registrationPage.passwordError).toBeVisible();
  });

  test("should reject a password without a number", async ({ page }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.passwordInput.fill("Password@Test");

    await registrationPage.submit();

    await expect(registrationPage.passwordError).toBeVisible();
  });

  test("should reject a password without a special character", async ({
    page,
  }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.passwordInput.fill("Password123");

    await registrationPage.submit();

    await expect(registrationPage.passwordError).toBeVisible();
  });

  test("should show and hide password", async ({ page }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.passwordInput.fill("Strong@Test123");

    await expect(registrationPage.passwordInput).toHaveAttribute(
      "type",
      "password",
    );

    await registrationPage.passwordToggleButton.click();

    await expect(registrationPage.passwordInput).toHaveAttribute(
      "type",
      "text",
    );

    await expect(registrationPage.passwordInput).toHaveValue("Strong@Test123");

    await registrationPage.passwordToggleButton.click();

    await expect(registrationPage.passwordInput).toHaveAttribute(
      "type",
      "password",
    );
  });

  test("should reject non-numeric phone input", async ({ page }) => {
    const registrationPage = new RegistrationPage(page);

    const data = createValidRegistrationData({
      phone: "98abc76543",
    });

    await registrationPage.fillRegistrationForm(data);

    await registrationPage.submit();

    await expect(registrationPage.phoneError).toBeVisible();

    await expect(page).toHaveURL(/auth\/register/);
  });

  test("should reject an invalid email format", async ({ page }) => {
    const registrationPage = new RegistrationPage(page);

    const data = createValidRegistrationData({
      email: "invalid-email",
    });

    await registrationPage.fillRegistrationForm(data);

    await registrationPage.submit();

    await expect(registrationPage.emailError).toBeVisible();

    await expect(page).toHaveURL(/auth\/register/);
  });

  test("should reject an email longer than 256 characters", async ({
    page,
  }) => {
    const registrationPage = new RegistrationPage(page);

    const longLocalPart = "a".repeat(250);

    const data = createValidRegistrationData({
      email: `${longLocalPart}@test.com`,
    });

    await registrationPage.fillRegistrationForm(data);

    await registrationPage.submit();

    await expect(registrationPage.emailError).toBeVisible();

    await expect(page).toHaveURL(/auth\/register/);
  });

  test("should reject duplicate email", async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    await registrationPage.open();
    const data = createValidRegistrationData({
      email: "customer2@practicesoftwaretesting.com",
      password: "Unique@987654Strong",
    });
    await registrationPage.register(data);
    await expect(registrationPage.registerError).toBeVisible();
    await expect(registrationPage.registerError).toContainText(
      "A customer with this email address already exists.",
    );
  });

  test("should register a valid adult customer and redirect to login", async ({
    page,
  }) => {
    const registrationPage = new RegistrationPage(page);

    const data = createValidRegistrationData({
      email: createUniqueEmail(),
    });

    await registrationPage.register(data);

    await expect(page).toHaveURL(/auth\/login/);
  });

  test("should detect duplicate email with leading and trailing spaces", async ({
    page,
  }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.open();

    const data = createValidRegistrationData({
      email: "  customer2@practicesoftwaretesting.com  ",
      password: "Unique@987654321Strong",
    });

    await registrationPage.register(data);

    await expect(registrationPage.emailError).toContainText(
      "Email format is invalid",
    );
  });

  test("should treat email comparison as case insensitive", async ({
    page,
  }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.open();

    const data = createValidRegistrationData({
      email: "CUSTOMER2@PRACTICESOFTWARETESTING.COM",
      password: "Unique@987654321Strong",
    });

    await registrationPage.register(data);

    await expect(registrationPage.registerError).toContainText(
      "A customer with this email address already exists.",
    );
  });
});
