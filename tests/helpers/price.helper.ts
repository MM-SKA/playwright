export function parseMoney(value: string): number {
  const result = Number(value.replace(/[^0-9.-]/g, ""));

  if (Number.isNaN(result)) {
    throw new Error(`Could not parse currency value: "${value}"`);
  }

  return result;
}

export function calculateLineTotal(price: number, quantity: number): number {
  return Number((price * quantity).toFixed(2));
}
