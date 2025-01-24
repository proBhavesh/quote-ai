export function formatCurrency(amount: number, currency: string = "AED") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatPercentage(value: number) {
  return `${value.toFixed(2)}%`;
}
