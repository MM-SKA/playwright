# 🚀 Practice Software Testing - Playwright Automation Framework

A comprehensive End-to-End (E2E) Automation Testing Framework built using **Playwright + TypeScript** for the **Practice Software Testing Toolshop** application.

This framework follows industry-standard testing practices including:

- Page Object Model (POM)
- API + UI Validation
- Type-safe Models
- Reusable Helpers
- Dynamic Data Validation
- Scalable Test Architecture

---

# 📚 Tech Stack

- Playwright
- TypeScript
- Node.js
- Page Object Model (POM)
- API Assertions
- HTML Reporting

---

# 📂 Project Structure

```text
.
├── node_modules
├── playwright-report
├── test-results
│
└── tests
    │
    ├── auth
    │   ├── login.spec.ts
    │   └── registration.spec.ts
    │
    ├── cart
    │   ├── add-to-cart.spec.ts
    │   ├── cart.spec.ts
    │   ├── checkout-unauthenticated.spec.ts
    │   └── favourites.spec.ts
    │
    ├── helpers
    │   ├── api-matchers.ts
    │   ├── auth-helper.ts
    │   ├── checkout-helper.ts
    │   ├── price.helper.ts
    │   ├── product-api-helper.ts
    │   ├── product-sort-helper.ts
    │   └── registration-data.ts
    │
    ├── models
    │   ├── cart.model.ts
    │   ├── product-filter.model.ts
    │   └── product.model.ts
    │
    ├── pages
    │   ├── billingAddress.page.ts
    │   ├── cart.page.ts
    │   ├── checkout.page.ts
    │   ├── login.page.ts
    │   ├── payment.page.ts
    │   ├── product-detail.page.ts
    │   ├── product.page.ts
    │   └── registration.page.ts
    │
    ├── product
    │   ├── favourite.spec.ts
    │   ├── filter.spec.ts
    │   ├── pagination.spec.ts
    │   ├── price-range-filter.spec.ts
    │   ├── product-detail.spec.ts
    │   ├── search-sort.spec.ts
    │   ├── search.spec.ts
    │   └── sort.spec.ts
    │
    └── example.spec.ts
```

---

# 🏗 Framework Architecture

The framework follows a layered architecture:

```text
Spec Files
     │
     ▼
Page Objects
     │
     ▼
Helpers / Utilities
     │
     ▼
Models / API Contracts
```

### Benefits

✅ Reusable code

✅ Easy maintenance

✅ Better scalability

✅ Strong TypeScript typing

✅ Separation of concerns

---

# 📄 Page Object Model (POM)

All UI interactions are encapsulated inside Page Objects.

Example:

```ts
const productPage = new ProductPage(page);

await productPage.open();

await productPage.selectSort("name,asc");
```

Benefits:

- Cleaner tests
- Reduced duplication
- Improved maintainability

---

# 🧩 Models

API response contracts are stored in:

```text
tests/models
```

Examples:

### Product Models

```ts
ProductDetailResponse;

ProductsListResponse;

SelectedCartProduct;
```

### Cart Models

```ts
CartResponse;

CartItem;

AddToCartRequest;

AddToCartResponse;
```

Benefits:

- Compile-time validation
- Type safety
- Better IntelliSense

---

# 🔧 Helpers

Reusable logic is centralized under:

```text
tests/helpers
```

### Examples

#### API Helpers

```ts
readRequestData();

waitForSortedResponse();

waitForSearchAndSortResponse();
```

#### Sorting Helpers

```ts
sortNamesAscending();

sortPricesDescending();

sortCo2Ascending();
```

#### Price Helpers

```ts
parseMoney();

calculateLineTotal();
```

Benefits:

- Avoid duplicated code
- Easier maintenance
- Better readability

---

# ✅ Test Coverage

---

## Authentication

### Login

- Successful login
- Invalid login validation
- Required field validation

### Registration

- Successful registration
- Form validation
- Required field testing

---

## Product Search

### Search

- Search by keyword
- Search with Enter key
- Search reset
- Search validation

---

## Product Sorting

### Name

- A-Z
- Z-A

### Price

- Low → High
- High → Low

### CO₂ Rating

- A → E
- E → A

Validation includes:

- UI order
- API order
- Request parameters

---

## Product Filters

### Category Filters

- Category visibility
- Hierarchical categories
- Parent-child category selection

### Brand Filters

- Brand visibility
- Brand filtering validation

### Combined Filters

- Category + Brand filters

---

## Price Range Filters

- Slider interaction
- API validation
- UI validation

---

## Product Details

### Product Information

- Name
- Description
- Price
- Category
- Brand
- Product Image

### Quantity Controls

- Increment quantity
- Decrement quantity
- Manual entry
- Boundary validation

### Related Products

- API response validation
- UI rendering validation

---

## Cart

### Add To Cart

- Quantity validation
- Request payload validation
- Success notification validation

### Shopping Cart

- Multiple products
- Quantity verification
- Price calculations
- Total validation
- Item removal

---

## Checkout

### Guest Checkout

- Continue as guest
- Billing address
- Payment methods

### Authenticated Checkout

- Skip login step
- Proceed directly to checkout
- Billing address validation
- Payment validation

---

# 🔍 API + UI Validation Strategy

The framework validates both:

- Backend API Response
- Frontend UI Rendering

Example:

```ts
const apiIds = body.data.map((product) => product.id);

const uiIds = await productPage.getRenderedProductIds();

expect(uiIds).toEqual(apiIds);
```

Benefits:

✅ Strong assertions

✅ Detect UI/API mismatches

✅ Higher confidence in test results

---

# 🧪 Running Tests

### Run Entire Suite

```bash
npx playwright test
```

### Run Product Tests

```bash
npx playwright test tests/product
```

### Run Cart Tests

```bash
npx playwright test tests/cart
```

### Run Authentication Tests

```bash
npx playwright test tests/auth
```

### Run Single Test File

```bash
npx playwright test tests/product/product-detail.spec.ts
```

### Run Specific Test

```bash
npx playwright test -g "should display product information"
```

### Run in Headed Mode

```bash
npx playwright test --headed
```

### Debug Mode

```bash
npx playwright test --debug
```

### View Available Tests

```bash
npx playwright test --list
```

---

# 📊 Reports

Generate and open the Playwright HTML report:

```bash
npx playwright show-report
```

Report Location:

```text
playwright-report/
```

---

# ✅ Best Practices Implemented

- Page Object Model (POM)
- Strong TypeScript Typing
- API + UI Validation
- Reusable Utility Functions
- Dynamic Product Selection
- Polling-Based Synchronization
- Cleanup After Test Execution
- Meaningful Assertions
- Scalable Folder Structure
- Separation of Concerns

---

# 📈 Future Enhancements

- Cross Browser Matrix Execution
- Custom Playwright Fixtures
- GitHub Actions CI/CD Pipeline
- Docker Execution
- Environment Configuration
- Visual Regression Testing
- API Test Layer
- Test Data Factories
- Reporting Dashboard Integration

---

# 👨‍💻 Author

**Samarth Kachhadiya**

Built using **Playwright + TypeScript**
