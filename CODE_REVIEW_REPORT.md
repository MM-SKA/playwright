# Playwright Code Review Report

**Project:** Intern Playwright Learning Project  
**Review date:** 2026-09-03  
**Reviewer:** Senior QA Automation Engineer / Playwright Mentor

## 1. Executive Summary

This is a promising Playwright learning project with meaningful coverage of authentication, registration, products, filtering, sorting, pagination, favorites, and cart behavior.

The interns demonstrate a good understanding of basic Playwright actions, assertions, Page Objects, API response validation, and auto-waiting. However, the project is not yet reliable as a regression suite. The most important problems are shared external test data, response listeners registered too late, committed credentials, empty cart Page Objects/specs, missing CI/README files, duplicated helper code, and tests that validate implementation details more than user behavior.

**Classification:** Acceptable for Intern Learning Project  
**Overall score:** 5.5/10

## 2. What They Did Well

- Used Playwright Test fixtures such as `{ page }`.
- Tests are generally independent at browser-context level.
- Used Page Objects for login, registration, and product interactions.
- Good use of `getByRole`, `getByLabel`, and `data-test` attributes.
- Used web-first assertions such as `toBeVisible`, `toHaveText`, `toHaveValue`, `toHaveURL`, and `toBeChecked`.
- No `waitForTimeout()` calls were found.
- Network listeners are correctly registered before the triggering action in several tests.
- Registration data is generated dynamically with `createUniqueEmail()`.
- Registration uses typed `RegistrationData`.
- Product tests validate both API responses and rendered UI data.
- Product sorting tests verify ordering rather than only checking that a request occurred.
- The cart flow dynamically discovers products instead of relying entirely on fixed product IDs.
- The tests correctly use `expect.poll()` when waiting for UI/API synchronization.
- Negative validation scenarios are well represented in registration and login tests.

## 3. Critical Issues

### 3.1 Authenticated favorites tests share mutable backend state

- **File:** `tests/product/favourite.spec.ts`, authenticated favorites setup
- **Problem:** All authenticated tests use the same hard-coded account. The add-favorite test creates persistent state but does not remove it.
- **Why it matters:** The duplicate-favorite test can fail depending on whether the previous test already created that favorite. The tests are browser-isolated but not backend-data-isolated.
- **Recommendation:** Create or provision isolated test data per test, or clean up the favorite in `afterEach`. Better still, use an API fixture or dedicated test account per worker.

### 3.2 Hard-coded credentials are committed in test code

- **Files:** `tests/product/favourite.spec.ts`, `tests/auth/login.spec.ts`
- **Problem:** Real-looking email addresses and passwords are directly embedded in source code.
- **Why it matters:** Credentials can leak through source control, logs, pull requests, or CI artifacts.
- **Recommendation:** Store credentials in environment variables or Playwright project configuration, validate that required secrets exist, and use clearly dedicated test accounts.

### 3.3 `page.pause()` blocks automated execution

- **File:** `tests/product/favourite.spec.ts`
- **Problem:** `page.pause()` is present in a normal test and occurs twice.
- **Why it matters:** The test hangs waiting for manual interaction and cannot run unattended in CI.
- **Recommendation:** Remove it before committing. Use `PWDEBUG=1`, trace recordings, screenshots, or headed execution when debugging.

### 3.4 Network response listeners are registered after the action

- **File:** `tests/product/filter.spec.ts`
- **Problem:** The test performs two filter clicks and only then starts waiting for the product response.
- **Why it matters:** The response may already have occurred, causing a timeout or causing the test to observe the wrong request.
- **Recommendation:** Register the listener immediately before the specific click and combine the action/wait with `Promise.all` where appropriate.

A similar issue exists in `tests/product/price-range-filter.spec.ts`, where the slider changes occur before the response listener is created.

### 3.5 Cart and checkout scenarios are effectively missing

- **Files:** `tests/cart/add-to-cart.spec.ts`, `tests/cart/favourites.spec.ts`
- **Problem:** Both files are empty. The cart flow is implemented inside the product-detail spec instead.
- **Why it matters:** The requested cart structure exists, but the intended test area has no tests. Checkout functionality is not independently covered.
- **Recommendation:** Move cart behavior into focused cart specs and add dedicated checkout tests.

### 3.6 The project cannot currently execute from the installed workspace

- **File:** `package.json`
- **Problem:** There are no npm scripts, and `@playwright/test` was not installed in the workspace. Test discovery could not run because the project dependency could not be resolved.
- **Why it matters:** A learning project should have a clear, repeatable command that another developer or CI system can execute.
- **Recommendation:** Install dependencies from `package-lock.json` and add scripts such as `test`, `test:headed`, `test:debug`, and `report`.

## 4. High Priority Improvements

### 4.1 Missing project documentation and CI workflow

- **Files:** Missing `README.md`; missing `.github/workflows/playwright.yml`
- **Problem:** Installation, execution, debugging, reporting, and CI behavior are undocumented and no workflow exists.
- **Why it matters:** Another developer cannot reliably reproduce or automate the suite.
- **Recommendation:** Add a concise README and GitHub Actions workflow with dependency installation, browser installation, test execution, HTML report upload, and trace/artifact upload on failure.

### 4.2 Tests depend on live third-party application data

- **Files:** Most specs, for example `tests/product/search.spec.ts`
- **Problem:** Tests call `practicesoftwaretesting.com` and its API directly.
- **Why it matters:** Tests can fail because of network outages, API changes, rate limits, data changes, or service maintenance.
- **Recommendation:** Use the live site for exploratory learning, but introduce controlled test environments or API mocking for deterministic regression tests.

### 4.3 Some tests verify requests rather than user-visible behavior

- **Files:** `tests/product/filter.spec.ts`, `tests/product/sort.spec.ts`
- **Problem:** Several tests assert only that a query parameter was sent.
- **Why it matters:** A request can be correct while the UI displays incorrect results.
- **Recommendation:** Keep request assertions as contract checks, but pair them with visible result assertions and empty/error-state assertions.

### 4.4 The maximum-length search test contradicts its name

- **File:** `tests/product/search.spec.ts`
- **Problem:** The test is named “should allow maximum 40 characters,” enters 50 characters, and expects all 50 characters to remain.
- **Why it matters:** The test does not validate the stated requirement and may encode the opposite behavior.
- **Recommendation:** Decide the actual requirement, then assert either truncation to 40 characters or rejection of input longer than 40.

### 4.5 Large tests have too many responsibilities

- **File:** `tests/product/product-detail.spec.ts`
- **Problem:** One test adds three products, opens checkout, validates API and UI data, calculates totals, and deletes all cart rows.
- **Why it matters:** Failure diagnosis becomes difficult and one failure hides several independent behaviors.
- **Recommendation:** Split into focused tests: add product, view cart, validate quantities/prices, calculate total, and remove item.

### 4.6 Duplicate helper infrastructure is copied into product specs

- **Files:** `tests/product/filter.spec.ts`, `tests/product/pagination.spec.ts`, `tests/product/price-range-filter.spec.ts`, `tests/product/sort.spec.ts`
- **Problem:** API types, request parsing, sorting functions, and logging helpers are repeated.
- **Why it matters:** Fixes must be applied multiple times and behavior can diverge.
- **Recommendation:** Move shared helpers into a typed utility module, while keeping page-specific assertions in the tests.

## 5. Medium/Low Priority Improvements

- Add `baseURL` to `playwright.config.ts` to avoid repeating the application URL.
- Remove the duplicate `workers` property; the later declaration overrides the first.
- Consider retaining the HTML report locally but adding a CI-friendly reporter such as `list` or `dot`.
- Remove `console.log` and `console.table` debugging output before CI use.
- Remove unused `productTitle` and unused `printComparison` helpers.
- Use consistent single or double quote formatting.
- Use descriptive test names instead of names such as `valid search`, `1.`, `2.`, and `AC10`.
- Use API setup/cleanup for backend state where suitable.
- Add tests for invalid, empty, boundary, and server-error states.
- Add a `tsconfig.json` with stricter options such as `strict`, `noUnusedLocals`, and `noUnusedParameters`.

## 6. Locator Review

### Good

- `page.getByRole("button", { name: "Login" })`
- `page.getByLabel("Pliers")`
- `page.getByRole("heading", { name: "Installation" })`
- Stable selectors such as `[data-test="email"]`
- Stable product selectors such as `[data-test="add-to-cart"]`
- `selectOption()` against `[data-test="sort"]`

These locators express user-facing semantics or use explicit test contracts.

### Acceptable

- `[aria-label="category"]`
- `[aria-label="brand"]`
- `[data-test^="product-"]`
- `[data-test^="favorite-"]`
- `.page-item.active .page-link`
- `input[name="category_id"]`
- `input[name="brand_id"]`

These are reasonably useful, but some depend on implementation structure or broad prefixes.

### Fragile

- `.card`
- `.pagination`
- `.toast-success`
- `.toast-error`
- `figure img`
- `.ngx-slider-pointer-min`
- `.ngx-slider-pointer-max`
- `a[href^="/product/"]`
- `a.btn-danger`
- `page.locator("label").filter({ hasText: ... })`
- `.locator("..")`
- `.locator("xpath=ancestor::tr")`

These can break when styling, DOM nesting, or unrelated elements change.

### Bad or especially risky

- `tests/product/filter.spec.ts`: `[data-test^="brand-"] .first()` assumes the first brand is always ForgeFlex Tools.
- `tests/product/filter.spec.ts`: hard-coded category ID selector.
- `tests/product/product-detail.spec.ts`: hard-coded product ID for stock behavior.
- `tests/product/favourite.spec.ts`: first product is used without asserting its identity.
- `tests/product/product-detail.spec.ts`: dynamically constructed regular expression is created from product text without escaping regex characters.

Recommended preference order:

1. `getByRole`
2. `getByLabel`
3. `getByTestId` or stable `data-test`
4. Stable semantic CSS selectors
5. XPath only when no better relationship locator exists

## 7. Flakiness Risks

1. Shared authenticated favorites account retains data between tests.
2. Favorites tests rely on test execution order.
3. `page.pause()` blocks unattended execution.
4. Response listeners are sometimes registered after the triggering action.
5. Live external website/API can change independently.
6. Product order can change while tests use `.first()`.
7. Hard-coded product/category IDs may become invalid.
8. Fixed product counts such as four search results depend on mutable catalog data.
9. Tests use CSS classes that may change during application redesign.
10. Registration tests depend on the current date, timezone, and server age calculation.
11. The random email generator has a small collision possibility under parallel execution.
12. Slider tests assume fixed keyboard-step behavior and a non-empty result set.
13. Toast assertions are broad and may match a previous toast.
14. Cleanup in the large cart test is not protected by `finally`, so a mid-test failure leaves backend state behind.
15. API/UI comparison tests are tightly coupled to undocumented response shapes.

## 8. Test-by-Test Review

| Test area | Rating | Good points | Problems | Recommendation |
|---|---|---|---|---|
| `example.spec.ts` | Acceptable | Correct role/title assertions | Tests Playwright’s website, not the application | Remove after learning or convert into an application smoke test |
| Login | Good | Strong negative and positive coverage | Hard-coded credentials and repeated setup | Use environment-managed credentials and LoginPage consistently |
| Registration | Good/Strong | Broad validation and data-driven required-field coverage | Repetition, some hard-coded data, unused date helpers | Keep coverage and improve fixtures/data reuse |
| Favorites anonymous | Good | Validates authorization toast | Uses first product and broad toast selector | Select a deterministic product and scope the toast |
| Favorites authenticated | Fragile | Strong request/response checks | Shared state, credentials, pauses, order dependence | Isolate account/data and remove pauses |
| Product filters | Fragile | Checks category/brand behavior | Late response listener and first-element assumptions | Wait before actions and assert visible filtered results |
| Pagination | Good | API metadata and UI IDs are both checked | Duplicated helpers and limited edge cases | Extract helpers and add first/last page checks |
| Price filtering | Fragile | Checks request, API/UI IDs, and boundaries | Response listener is registered too late | Register the listener before slider changes |
| Product details | Good | API-backed UI validation and quantity coverage | Uses first product and includes one oversized cart test | Use deterministic products and split cart behavior |
| Search | Good/Fragile | Broad search scenarios | Maximum-length test contradicts its name; fixed result counts | Correct the requirement and make result data deterministic |
| Sort | Good | Broad API/UI order comparisons | Over 1,000 lines and repeated helper code | Extract shared utilities and reduce duplicate scenarios |
| Cart | Beginner | Some cart behavior exists elsewhere | Dedicated cart specs are empty | Add focused cart tests and Page Object methods |
| Checkout/payment | Beginner | Checkout navigation occurs in one flow | No meaningful checkout or payment validation | Add required-field, success, failure, and payment scenarios |

## 9. Page Object Review

### LoginPage

- Useful abstraction with locators and `open()`/`login()` methods.
- Correctly uses `Promise.all` for navigation and click.
- Password toggle locator uses parent traversal and is fragile.
- URL is hard-coded.
- It does not expose common error or account-menu locators.
- Recommendation: use `baseURL`, add meaningful page-level methods, and prefer a stable toggle test ID or role.

### RegistrationPage

- Good locator organization.
- Good separation between personal, address, and contact data.
- Typed `RegistrationData` is a strong practice.
- `fillAddress()` contains a speculative comment about address lookup rather than explicit synchronization.
- Password toggle uses XPath parent traversal.
- Exposes many raw locators, which is acceptable for an intern project but can make tests tightly coupled to page structure.

### ProductPage

- Provides useful search, sort, reset, product extraction, and parsing methods.
- `ProductSortOption` is a good type-safe union.
- `productCards` uses a reasonable `data-test` prefix selector.
- `getProductPrices()` parses displayed currency and can silently produce `NaN`.
- `getRenderedCo2Ratings()` depends on `.active` implementation details.
- `open()` waits for both sort and first product, which is useful but assumes products always exist.
- It lacks methods for filters, pagination, product detail, cart, and favorites despite those being major project areas.

### Empty Page Objects

The following files are empty:

- `tests/pages/home.page.ts`
- `tests/pages/cart.page.ts`
- `tests/pages/checkout.page.ts`

They should either be implemented when their corresponding scenarios are added or removed until needed.

## 10. `utils/locators.json`

`utils/locators.json` does not exist in the repository.

The current approach of declaring locators in Page Objects is preferable for this project. A separate locator JSON file would likely duplicate Page Objects and remove type safety. It would be useful only if locators must be maintained by non-developers, shared with multiple tools, or treated as an external selector contract.

For this learning project, keep locators in typed Page Objects and do not introduce a JSON locator registry.

## 11. TypeScript Assessment

### Positive

- Interfaces are used for API response shapes.
- `RegistrationData` is typed.
- `ProductSortOption` provides compile-time validation.
- Async Playwright operations generally use `await`.
- No explicit `any` usage was found in the reviewed code.

### Problems

- Type assertions such as `as ProductsApiResponse` trust external data without runtime validation.
- `unknown[]` in `printComparison` weakens type safety.
- Several unused helpers and variables exist.
- No `tsconfig.json` or strict compiler configuration is present.
- Duplicate interfaces and helper functions are copied across files.
- Naming is inconsistent: `favourite` and `favorites`, numbered tests, and generic names such as `valid search`.
- `Math.random()` plus `Date.now()` is acceptable for learning but not a robust unique-data strategy.

**Rating:** Good for intern-level TypeScript, with clear room for stronger compiler enforcement and reuse.

## 12. `playwright.config.ts`

- `testDir` is appropriate.
- Chromium-only execution is reasonable for an initial learning project.
- `forbidOnly` and CI retries are good defaults.
- `trace: 'on-first-retry'` is appropriate.
- `workers: 1` locally reduces concurrency but slows execution.
- `fullyParallel: false` is reasonable while learning isolation.
- `workers` is declared twice; the second declaration overrides the first.
- `baseURL` is commented out even though every test repeats the same application URL.
- No `webServer` is configured, which is acceptable because tests target an external application.
- No global setup, storage state, or custom fixture setup exists.
- HTML reporting is suitable locally, but CI artifact handling is absent because no workflow exists.

## 13. CI/CD

`.github/workflows/playwright.yml` is absent.

A suitable workflow should:

1. Check out the repository.
2. Install Node.
3. Run `npm ci`.
4. Install Chromium and required browser dependencies.
5. Run the Playwright suite.
6. Upload the HTML report.
7. Upload traces, screenshots, and videos when tests fail.
8. Supply required environment variables securely.
9. Avoid committing credentials.

## 14. README

`README.md` is absent.

The project needs documentation covering:

- Node.js version
- `npm ci`
- Browser installation
- Test commands
- Headed mode
- Debug mode
- Test filtering
- HTML report command
- Required environment variables
- Dependency on the external Practice Software Testing site
- Test account/data requirements
- CI execution

## 15. Coverage Review

| Area | Assessment |
|---|---|
| Login | Good negative and positive coverage; needs credential management and more Page Object use |
| Register | Strongest area; broad validation and data-driven required-field coverage |
| Products | Good detail, search, filter, sort, and pagination coverage |
| Cart | Partial; one oversized test, two empty spec files |
| Checkout | Weak; navigation to checkout is tested, payment/checkout behavior is not |
| Favorites | Present but backend-state dependent and flaky |
| Search | Broad scenarios, but max-length test is incorrect |
| Filter | Basic category/brand coverage, weak synchronization in combined filters |
| Pagination | Good main test, duplicated setup and limited edge coverage |
| Price | One useful test, but synchronization race risk |
| Sort | Broad API/UI comparison, but excessive duplication |
| Payment | Missing |

Meaningful missing scenarios include:

- Login session persistence and logout
- Registration server failure
- Registration invalid phone boundaries
- Password confirmation mismatch
- Duplicate favorites cleanup
- Favorite persistence after page reload
- Cart quantity update
- Cart empty state
- Cart persistence after refresh
- Removing a specific cart item
- Checkout required fields
- Checkout invalid payment details
- Successful payment
- Payment failure
- Out-of-stock checkout prevention
- Pagination first/last-page button states
- Search request prevention for short input
- Combined search/filter/sort reset behavior
- Price slider minimum and maximum boundaries

## 16. Intern Learning Assessment

| Skill | Rating | Evidence |
|---|---|---|
| Playwright fundamentals | Good | Uses fixtures, actions, assertions, navigation, and response listeners |
| Locators | Good | Uses roles, labels, data-test attributes, and CSS; still relies on fragile structural selectors |
| Assertions | Good | Many meaningful UI, URL, API, and state assertions |
| Test design | Beginner | Shared state, oversized tests, duplicate scenarios, and weak naming |
| Page Object Model | Good | Three useful Page Objects; several empty placeholders and some locator leakage |
| Synchronization | Beginner | No fixed sleeps, but response-listener ordering has important race risks |
| TypeScript | Good | Interfaces and unions are used, but no strict compiler setup and duplicated types |
| Code quality | Beginner | Repetition, unused code, hard-coded values, debugging statements, and missing documentation |
| CI/CD | Beginner | Configuration exists, but no workflow, scripts, or report artifact handling |

## 17. Recommended Learning Topics

1. Test isolation and backend test-data cleanup.
2. Correct `waitForResponse`/`waitForRequest` ordering.
3. Playwright locator strategy and accessible selectors.
4. Fixtures for login state and reusable test data.
5. Page Object responsibilities and avoiding raw locator leakage.
6. Web-first assertions versus implementation-only API checks.
7. Reliable boundary and negative testing.
8. TypeScript strict mode and eliminating unused code.
9. CI setup, reports, traces, and artifact collection.
10. Splitting large end-to-end tests into focused scenarios.
11. Mocking and controlling external APIs.
12. Checkout and payment workflow design.

## 18. Overall Score

**5.5/10**

**Classification:** Acceptable for Intern Learning Project

The project shows genuine learning progress and contains several technically strong examples, especially registration validation and API/UI product comparisons. It is not yet a dependable regression suite because the external data is uncontrolled, favorites tests share state, some waits race the application, cart/checkout coverage is incomplete, and the project lacks executable documentation and CI.

No source code or configuration was modified as part of this review.
