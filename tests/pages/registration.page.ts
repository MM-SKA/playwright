import { Locator, Page } from "@playwright/test";
import { RegistrationData } from "../helpers/registration-data";
export class RegistrationPage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly dobInput: Locator;
  readonly countrySelect: Locator;
  readonly postalCodeInput: Locator;
  readonly houseNumberInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly registerButton: Locator;
  readonly passwordToggleButton: Locator;
  readonly firstNameError: Locator;
  readonly lastNameError: Locator;
  readonly dobError: Locator;
  readonly countryError: Locator;
  readonly postalCodeError: Locator;
  readonly houseNumberError: Locator;
  readonly streetError: Locator;
  readonly cityError: Locator;
  readonly stateError: Locator;
  readonly phoneError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly passwordHelp: Locator;
  readonly passwordStrengthBar: Locator;
  readonly registerError: Locator;

  constructor(private readonly page: Page) {
    this.firstNameInput = page.locator('[data-test="first-name"]');
    this.lastNameInput = page.locator('[data-test="last-name"]');
    this.dobInput = page.locator('[data-test="dob"]');
    this.countrySelect = page.locator('[data-test="country"]');
    this.postalCodeInput = page.locator('[data-test="postal_code"]');
    this.houseNumberInput = page.locator('[data-test="house_number"]');
    this.streetInput = page.locator('[data-test="street"]');
    this.cityInput = page.locator('[data-test="city"]');
    this.stateInput = page.locator('[data-test="state"]');
    this.phoneInput = page.locator('[data-test="phone"]');
    this.emailInput = page.locator('[data-test="email"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.registerButton = page.locator('[data-test="register-submit"]');
    this.passwordToggleButton = this.passwordInput
      .locator("xpath=..")
      .locator("button");
    this.firstNameError = page.locator('[data-test="first-name-error"]');
    this.lastNameError = page.locator('[data-test="last-name-error"]');
    this.dobError = page.locator('[data-test="dob-error"]');
    this.countryError = page.locator('[data-test="country-error"]');
    this.postalCodeError = page.locator('[data-test="postal_code-error"]');
    this.houseNumberError = page.locator('[data-test="house_number-error"]');
    this.streetError = page.locator('[data-test="street-error"]');
    this.cityError = page.locator('[data-test="city-error"]');
    this.stateError = page.locator('[data-test="state-error"]');
    this.phoneError = page.locator('[data-test="phone-error"]');
    this.emailError = page.locator('[data-test="email-error"]');
    this.passwordError = page.locator('[data-test="password-error"]');
    this.passwordHelp = page.locator("#passwordHelp");
    this.passwordStrengthBar = page.locator(
      ".password-strength .strength-bar .fill",
    );
    this.registerError = page.locator('[data-test="register-error"]');
  }

  async open(): Promise<void> {
    await this.page.goto("https://practicesoftwaretesting.com/auth/register", {
      waitUntil: "domcontentloaded",
    });
    await this.firstNameInput.waitFor({
      state: "visible",
    });
  }

  async selectCountry(countryCode: string): Promise<void> {
    await this.countrySelect.selectOption(countryCode);
  }

  async fillPersonalDetails(data: RegistrationData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.dobInput.fill(data.dob);
  }

  async fillAddress(data: RegistrationData): Promise<void> {
    await this.selectCountry(data.country);
    await this.postalCodeInput.fill(data.postalCode);
    await this.houseNumberInput.fill(data.houseNumber);

    /*
     * The application may perform an address lookup
     * after country, postcode and house number are entered.
     *
     * fill() still works if these fields remain editable.
     */
    await this.streetInput.fill(data.street);
    await this.cityInput.fill(data.city);
    await this.stateInput.fill(data.state);
  }

  async fillContactDetails(data: RegistrationData): Promise<void> {
    await this.phoneInput.fill(data.phone);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
  }

  async fillRegistrationForm(data: RegistrationData): Promise<void> {
    await this.fillPersonalDetails(data);
    await this.fillAddress(data);
    await this.fillContactDetails(data);
  }

  async submit(): Promise<void> {
    await this.registerButton.click();
  }

  async register(data: RegistrationData): Promise<void> {
    await this.fillRegistrationForm(data);
    await this.submit();
  }
}
