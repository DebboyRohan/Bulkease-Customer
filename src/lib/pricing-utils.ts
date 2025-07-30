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
  isActive: boolean; // Added isActive field
  variants: Variant[];
  priceRanges: PriceRange[];
  _count?: {
    orderItems: number;
  };
  totalOrderedQuantity?: number;
  createdAt?: string; // Optional for sorting/display
}

export interface Variant {
  id: string;
  name: string;
  bookingAmount: number;
  images: string[];
  isActive: boolean; // Added isActive field
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
    return selectedVariant.images || [];
  }
  return product.images || [];
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
    return selectedVariant.priceRanges || [];
  }
  return product.priceRanges || [];
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

// New helper functions for active status checking
export function isProductActive(product: Product): boolean {
  if (!product.isActive) return false;

  // If product has variants, at least one variant must be active
  if (product.hasVariants) {
    return product.variants?.some((variant) => variant.isActive) || false;
  }

  return true;
}

export function getActiveVariants(product: Product): Variant[] {
  if (!product.hasVariants || !product.variants) return [];
  return product.variants.filter((variant) => variant.isActive);
}

export function isVariantActive(variant: Variant): boolean {
  return variant.isActive !== false; // Default to true if undefined
}

// Helper to get the first available variant (prioritizing active ones)
export function getDefaultVariant(product: Product): Variant | undefined {
  if (!product.hasVariants || !product.variants) return undefined;

  // First, try to find an active variant
  const activeVariant = product.variants.find((variant) => variant.isActive);
  if (activeVariant) return activeVariant;

  // Fallback to first variant (for backward compatibility)
  return product.variants[0];
}

// Filter function for client-side filtering (if needed)
export function filterActiveProducts(products: Product[]): Product[] {
  return products.filter(isProductActive);
}

// Helper to check if a product can be added to cart
export function canAddToCart(
  product: Product,
  selectedVariant?: Variant
): boolean {
  if (!product.isActive) return false;

  if (product.hasVariants) {
    if (!selectedVariant) return false;
    return selectedVariant.isActive;
  }

  return true;
}

// Helper to get product status for admin views
export function getProductStatus(product: Product): {
  isActive: boolean;
  hasActiveVariants: boolean;
  totalVariants: number;
  activeVariants: number;
  canBePurchased: boolean;
} {
  const activeVariants = getActiveVariants(product);

  return {
    isActive: product.isActive,
    hasActiveVariants: activeVariants.length > 0,
    totalVariants: product.variants?.length || 0,
    activeVariants: activeVariants.length,
    canBePurchased: isProductActive(product),
  };
}

export { safeToFixed, safeNumber };
