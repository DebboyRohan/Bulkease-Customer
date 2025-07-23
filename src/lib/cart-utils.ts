// lib/cart-utils.ts

import {
  getCurrentPrice,
  getProductBookingAmount,
  getProductImages,
  safeToFixed,
  safeNumber,
} from "@/lib/pricing-utils";

export interface CartItemWithDetails {
  id: string;
  quantity: number;
  productId?: string | null;
  variantId?: string | null;
  product?: {
    id: string;
    name: string;
    images: string[];
    bookingAmount?: number | null;
    hasVariants: boolean;
    priceRanges: any[];
  } | null;
  variant?: {
    id: string;
    name: string;
    bookingAmount: number;
    images: string[];
    priceRanges: any[];
    product: {
      id: string;
      name: string;
      hasVariants: boolean;
    };
  } | null;
}

export function getCartItemDetails(item: CartItemWithDetails) {
  const isVariant = !!item.variant;
  const product = isVariant ? item.variant!.product : item.product!;
  const variant = item.variant;

  return {
    id: item.id,
    productId: product.id,
    variantId: variant?.id,
    name: product.name,
    variantName: variant?.name,
    quantity: item.quantity,
    images: isVariant ? variant!.images : item.product!.images,
    bookingAmountPerUnit: isVariant
      ? safeNumber(variant!.bookingAmount)
      : safeNumber(item.product!.bookingAmount),
    totalBookingAmount:
      (isVariant
        ? safeNumber(variant!.bookingAmount)
        : safeNumber(item.product!.bookingAmount)) * item.quantity,
    priceRanges: isVariant ? variant!.priceRanges : item.product!.priceRanges,
    hasVariants: product.hasVariants,
  };
}

export function calculateCartTotals(cartItems: CartItemWithDetails[]) {
  let totalItems = 0;
  let totalBookingAmount = 0;

  cartItems.forEach((item) => {
    const details = getCartItemDetails(item);
    totalItems += details.quantity;
    totalBookingAmount += details.totalBookingAmount;
  });

  return {
    totalItems,
    totalBookingAmount,
    formattedTotal: safeToFixed(totalBookingAmount),
  };
}
