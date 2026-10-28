/** Domain constants shared by UI and inventory math. */
export const KG_PER_CRATE = 22.5;
export const LITERS_PER_KG_OIL = 1.1;
export const CURRENCY = "EUR";

export function cratesToKg(crates: number): number {
  return Math.round(crates * KG_PER_CRATE);
}

export function oilKgToLiters(kg: number): number {
  return Math.round(kg * LITERS_PER_KG_OIL);
}

export function oilLitersToKg(liters: number): number {
  return Math.round(liters / LITERS_PER_KG_OIL);
}

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

export function centsToEuros(cents: number): number {
  return cents / 100;
}

export function formatCurrency(cents: number, locale = "el-GR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: CURRENCY,
  }).format(centsToEuros(cents));
}

export function formatDate(isoDate: string, locale = "el-GR"): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat(locale).format(new Date(y, m - 1, d));
}

export function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
