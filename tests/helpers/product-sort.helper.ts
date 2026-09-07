export function sortNamesAscending(names: string[]): string[] {
  return [...names].sort((first, second) =>
    first.localeCompare(second, "en", {
      sensitivity: "base",
    }),
  );
}

export function sortNamesDescending(names: string[]): string[] {
  return [...names].sort((first, second) =>
    second.localeCompare(first, "en", {
      sensitivity: "base",
    }),
  );
}

export function sortPricesAscending(prices: number[]): number[] {
  return [...prices].sort((a, b) => a - b);
}

export function sortPricesDescending(prices: number[]): number[] {
  return [...prices].sort((a, b) => b - a);
}

export function sortCo2Ascending(ratings: string[]): string[] {
  const order = ["A", "B", "C", "D", "E"];

  return [...ratings].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export function sortCo2Descending(ratings: string[]): string[] {
  const order = ["A", "B", "C", "D", "E"];

  return [...ratings].sort((a, b) => order.indexOf(b) - order.indexOf(a));
}