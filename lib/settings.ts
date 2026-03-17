/**
 * Check if a product discount is currently active based on date range.
 */
export function isDiscountActive(
  discountStart: Date | string | null | undefined,
  discountEnd: Date | string | null | undefined
): boolean {
  const now = new Date();
  if (discountStart) {
    const start = new Date(discountStart);
    if (!isNaN(start.getTime()) && now < start) return false;
  }
  if (discountEnd) {
    const end = new Date(discountEnd);
    if (!isNaN(end.getTime()) && now > end) return false;
  }
  return true;
}

/**
 * Calculate the effective price after product-level and global discounts.
 */
export function calculateDiscountedPrice(
  basePrice: number,
  product: {
    discountPercent?: number | null;
    discountFixed?: number | null;
    discountStart?: Date | string | null;
    discountEnd?: Date | string | null;
  },
  globalConfig: {
    globalDiscountPercent: number;
    globalDiscountStart?: Date | string | null;
    globalDiscountEnd?: Date | string | null;
    allowStacking?: boolean;
  }
): number {
  let price = basePrice;
  let hasProductDiscount = false;

  // 1. Product-level discount check (discount is already baked into basePrice in the DB)
  if (isDiscountActive(product.discountStart, product.discountEnd)) {
    if ((product.discountFixed && product.discountFixed > 0) || (product.discountPercent && product.discountPercent > 0)) {
      hasProductDiscount = true;
    }
  }

  // 2. Global discount
  if (!globalConfig.allowStacking && hasProductDiscount) {
    return Math.max(0, price);
  }

  if (
    globalConfig.globalDiscountPercent > 0 &&
    isDiscountActive(globalConfig.globalDiscountStart, globalConfig.globalDiscountEnd)
  ) {
    price = Math.round(price * (1 - globalConfig.globalDiscountPercent / 100) * 100) / 100;
  }

  return Math.max(0, price);
}
