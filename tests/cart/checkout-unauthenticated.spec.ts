import { expect, test } from "@playwright/test";
import { BillingAddressPage } from "../pages/billingAddress.page";
import { PaymentPage } from "../pages/payment.page";
import { CheckoutPage } from "../pages/checkout.page";
import { addProductToCart } from "../helpers/checkout-helper";
import { login } from "../helpers/auth-helper";

test("guest checkout flow", async ({ page }) => {
  const checkout = new CheckoutPage(page);

  const billing = new BillingAddressPage(page);

  const payment = new PaymentPage(page);

  await addProductToCart(page);

  await checkout.openCheckout();

  await checkout.proceedFromCart();

  await checkout.continueAsGuest("guest@test.com", "Samarth", "Tester");

  await billing.fillAddress();

  await billing.proceedToPayment();

  await payment.verifyPaymentOptions();
});

test("logged in checkout flow", async ({ page }) => {
  const checkout = new CheckoutPage(page);

  const billing = new BillingAddressPage(page);

  await login(page,"test@test.com","Samarth3005@");

  await addProductToCart(page);

  await checkout.openCheckout();

  await checkout.proceedFromCart();

  await checkout.continueAsLoggedInUser();

  await billing.fillAddress();

  await billing.proceedToPayment();
});
