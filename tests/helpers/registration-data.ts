export interface RegistrationData {
  firstName: string;
  lastName: string;
  dob: string;
  country: string;
  postalCode: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  password: string;
}
export function createUniqueEmail(): string {
  return `playwright-${Date.now()}-${Math.floor(
    Math.random() * 10_000,
  )}@example.com`;
}
export function createValidRegistrationData(
  overrides: Partial<RegistrationData> = {},
): RegistrationData {
  return {
    firstName: "Samarth",
    lastName: "Kachhadiya",
    dob: "2000-08-18",
    country: "IN",
    postalCode: "390001",
    houseNumber: "42",
    street: "Test Street",
    city: "Vadodara",
    state: "Gujarat",
    phone: "9876543210",
    email: createUniqueEmail(),
    password: "Strong@Test123",
    ...overrides,
  };
}
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
export function getExactly18YearsAgo(): string {
  const today = new Date();
  return formatDate(
    new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()),
  );
}
export function getOneDayUnder18(): string {
  const today = new Date();
  const date = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );
  date.setDate(date.getDate() + 1);
  return formatDate(date);
}
export function getOneDayOver18(): string {
  const today = new Date();
  const date = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );
  date.setDate(date.getDate() - 1);
  return formatDate(date);
}
