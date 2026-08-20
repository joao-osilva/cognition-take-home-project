export function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100);
}

export function Money({ amountCents, currency }: { amountCents: number; currency: string }) {
  return <span className="tabular-nums">{formatMoney(amountCents, currency)}</span>;
}
