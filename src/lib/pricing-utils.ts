// lib/pricing-utils.ts

export interface PriceRange {
  minQuantity: number;
  maxQuantity?: number | null;
  pricePerUnit: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  images: string[];
  bookingAmount?: number | null;
  hasVariants: boolean;
  variants: Variant[];
  priceRanges: PriceRange[];
  _count: {
    orderItems: number;
  };
  totalOrderedQuantity?: number;
}

export interface Variant {
  id: string;
  name: string;
  bookingAmount: number;
  images: string[];
  totalOrderedQuantity?: number;
  priceRanges: PriceRange[];
}

const safeNumber = (value: any): number => Number(value) || 0;
const safeToFixed = (value: any, decimals: number = 2): string => {
  const num = Number(value) || 0;
  return num.toFixed(decimals);
};

export function getCurrentPrice(
  ranges: PriceRange[],
  totalOrders: number
): number {
  if (!ranges || ranges.length === 0) return 0;

  const sortedRanges = ranges.sort(
    (a, b) => safeNumber(a.minQuantity) - safeNumber(b.minQuantity)
  );

  if (totalOrders < 1) {
    return safeNumber(sortedRanges[0]?.pricePerUnit || 0);
  }

  for (const range of sortedRanges) {
    const minQuantity = safeNumber(range.minQuantity);
    const maxQuantity = range.maxQuantity
      ? safeNumber(range.maxQuantity)
      : null;

    if (
      totalOrders >= minQuantity &&
      (maxQuantity === null || totalOrders <= maxQuantity)
    ) {
      return safeNumber(range.pricePerUnit);
    }
  }

  return safeNumber(sortedRanges[sortedRanges.length - 1]?.pricePerUnit || 0);
}

export function getNextBracket(
  ranges: PriceRange[],
  totalOrders: number
): PriceRange | null {
  if (!ranges || ranges.length === 0) return null;

  const sortedRanges = ranges.sort(
    (a, b) => safeNumber(a.minQuantity) - safeNumber(b.minQuantity)
  );

  return (
    sortedRanges.find((range) => safeNumber(range.minQuantity) > totalOrders) ||
    null
  );
}

export function getMinPrice(ranges: PriceRange[]): number {
  if (!ranges || ranges.length === 0) return 0;

  const prices = ranges.map((r) => safeNumber(r.pricePerUnit));
  return Math.min(...prices);
}

export function getProductImages(
  product: Product,
  selectedVariant?: Variant
): string[] {
  if (product.hasVariants && selectedVariant) {
    return selectedVariant.images;
  }
  return product.images;
}

export function getProductBookingAmount(
  product: Product,
  selectedVariant?: Variant
): number {
  if (product.hasVariants && selectedVariant) {
    return safeNumber(selectedVariant.bookingAmount);
  }
  return safeNumber(product.bookingAmount);
}

export function getProductPriceRanges(
  product: Product,
  selectedVariant?: Variant
): PriceRange[] {
  if (product.hasVariants && selectedVariant) {
    return selectedVariant.priceRanges;
  }
  return product.priceRanges;
}

export function getTotalOrders(
  product: Product,
  selectedVariant?: Variant
): number {
  if (product.hasVariants && selectedVariant) {
    return safeNumber(selectedVariant.totalOrderedQuantity);
  }
  return safeNumber(product.totalOrderedQuantity);
}

export { safeToFixed, safeNumber };
