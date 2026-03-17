export type CurrencyCode = 'USD' | 'NPR';
export function normalizeCurrencyCode(value: unknown): CurrencyCode {
  return String(value) === 'USD' ? 'USD' : 'NPR';
}

export function sanitizeConversionRate(rate: number | null | undefined) {
  return rate && Number.isFinite(rate) && rate > 0 ? rate : 133.5;
}

export function convertAmount(amount: number, from: CurrencyCode, to: CurrencyCode, rate: number) {
  const safeRate = sanitizeConversionRate(rate);
  if (from === to) return amount;
  if (from === 'USD' && to === 'NPR') return amount * safeRate;
  return amount / safeRate;
}

export function roundCurrencyAmount(amount: number, currencyCode: CurrencyCode) {
  if (currencyCode === 'USD') {
    return Math.round(amount * 100) / 100;
  }
  return Math.round(amount);
}

export function getCurrencySymbol(currencyCode: CurrencyCode) {
  return currencyCode === 'USD' ? '$' : 'NPR';
}

export function formatCurrency(amount: number, currencyCode: CurrencyCode) {
  const rounded = roundCurrencyAmount(amount, currencyCode);
  return `${getCurrencySymbol(currencyCode)} ${rounded.toLocaleString(undefined, {
    minimumFractionDigits: currencyCode === 'USD' ? 2 : 0,
    maximumFractionDigits: currencyCode === 'USD' ? 2 : 0,
  })}`;
}
