// lib/db/products.ts

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

export interface ProductWithDetails {
  id: string;
  name: string;
  description?: string;
  images: string[];
  bookingAmount?: number; // Nullable for products with variants
  hasVariants: boolean;
  variants: Array<{
    id: string;
    name: string;
    bookingAmount: number;
    images: string[]; // New field
    priceRanges: Array<{
      id: string;
      minQuantity: number;
      maxQuantity?: number;
      pricePerUnit: number;
    }>;
  }>;
  priceRanges: Array<{
    id: string;
    minQuantity: number;
    maxQuantity?: number;
    pricePerUnit: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Admin product operations
export async function getAllProductsAdmin(
  page: number = 1,
  limit: number = 10,
  search?: string,
  sort: string = "newest"
) {
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  let orderBy: Prisma.ProductOrderByWithRelationInput = { updatedAt: "desc" };

  switch (sort) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "name":
      orderBy = { name: "asc" };
      break;
    case "orders":
      orderBy = { orderItems: { _count: "desc" } };
      break;
    default:
      orderBy = { updatedAt: "desc" };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        variants: {
          include: {
            priceRanges: {
              orderBy: { minQuantity: "asc" },
            },
            _count: {
              select: {
                orderItems: true,
              },
            },
          },
        },
        priceRanges: {
          orderBy: { minQuantity: "asc" },
        },
        _count: {
          select: {
            orderItems: true,
            variants: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getProductByIdAdmin(id: string) {
  return await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          priceRanges: {
            orderBy: { minQuantity: "asc" },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      },
      priceRanges: {
        orderBy: { minQuantity: "asc" },
      },
      _count: {
        select: {
          orderItems: true,
          variants: true,
        },
      },
    },
  });
}

export async function createProductAdmin(data: {
  name: string;
  description?: string;
  images: string[];
  bookingAmount?: number; // Nullable
  hasVariants: boolean;
  variants?: Array<{
    name: string;
    bookingAmount: number;
    images: string[]; // New field
    priceRanges: Array<{
      minQuantity: number;
      maxQuantity?: number;
      pricePerUnit: number;
    }>;
  }>;
  priceRanges?: Array<{
    minQuantity: number;
    maxQuantity?: number;
    pricePerUnit: number;
  }>;
}) {
  // Validate business rules
  if (data.hasVariants) {
    if (data.bookingAmount !== undefined && data.bookingAmount !== null) {
      throw new Error(
        "Products with variants should not have a booking amount"
      );
    }
    if (!data.variants || data.variants.length === 0) {
      throw new Error("Products with variants must have at least one variant");
    }
  } else {
    if (!data.bookingAmount || data.bookingAmount <= 0) {
      throw new Error("Products without variants must have a booking amount");
    }
    if (!data.priceRanges || data.priceRanges.length === 0) {
      throw new Error("Products without variants must have price ranges");
    }
  }

  return await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      images: data.hasVariants ? [] : data.images, // Empty if has variants
      bookingAmount: data.hasVariants ? null : data.bookingAmount,
      hasVariants: data.hasVariants,
      variants:
        data.hasVariants && data.variants
          ? {
              create: data.variants.map((variant) => ({
                name: variant.name,
                bookingAmount: variant.bookingAmount,
                images: variant.images || [], // Variant images
                priceRanges: {
                  create: variant.priceRanges,
                },
              })),
            }
          : undefined,
      priceRanges:
        !data.hasVariants && data.priceRanges
          ? {
              create: data.priceRanges,
            }
          : undefined,
    },
    include: {
      variants: {
        include: {
          priceRanges: true,
        },
      },
      priceRanges: true,
    },
  });
}

export async function updateProductAdmin(id: string, data: any) {
  // Validate business rules
  if (data.hasVariants) {
    if (data.bookingAmount !== undefined && data.bookingAmount !== null) {
      throw new Error(
        "Products with variants should not have a booking amount"
      );
    }
    if (!data.variants || data.variants.length === 0) {
      throw new Error("Products with variants must have at least one variant");
    }
  } else {
    if (!data.bookingAmount || data.bookingAmount <= 0) {
      throw new Error("Products without variants must have a booking amount");
    }
    if (!data.priceRanges || data.priceRanges.length === 0) {
      throw new Error("Products without variants must have price ranges");
    }
  }

  // Delete existing variants and price ranges
  await prisma.variant.deleteMany({ where: { productId: id } });
  await prisma.priceRange.deleteMany({ where: { productId: id } });

  return await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      images: data.hasVariants ? [] : data.images, // Empty if has variants
      bookingAmount: data.hasVariants ? null : data.bookingAmount,
      hasVariants: data.hasVariants,
      variants:
        data.hasVariants && data.variants
          ? {
              create: data.variants.map((variant: any) => ({
                name: variant.name,
                bookingAmount: variant.bookingAmount,
                images: variant.images || [], // Variant images
                priceRanges: {
                  create: variant.priceRanges,
                },
              })),
            }
          : undefined,
      priceRanges:
        !data.hasVariants && data.priceRanges
          ? {
              create: data.priceRanges,
            }
          : undefined,
    },
    include: {
      variants: {
        include: {
          priceRanges: true,
        },
      },
      priceRanges: true,
    },
  });
}

export async function deleteProductAdmin(id: string) {
  return await prisma.product.delete({
    where: { id },
  });
}

// User/Public product operations
export async function getAllProductsPublic(
  page: number = 1,
  limit: number = 12,
  search?: string,
  sort: string = "newest"
) {
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };

  switch (sort) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "price_low":
      orderBy = { bookingAmount: "asc" };
      break;
    case "price_high":
      orderBy = { bookingAmount: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        bookingAmount: true,
        hasVariants: true,
        variants: {
          select: {
            id: true,
            name: true,
            bookingAmount: true,
            images: true, // New field
            priceRanges: {
              select: {
                minQuantity: true,
                maxQuantity: true,
                pricePerUnit: true,
              },
              orderBy: { minQuantity: "asc" },
            },
            // Calculate total ordered quantity for each variant
            orderItems: {
              select: {
                quantity: true,
              },
            },
          },
        },
        priceRanges: {
          select: {
            minQuantity: true,
            maxQuantity: true,
            pricePerUnit: true,
          },
          orderBy: { minQuantity: "asc" },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
        // Calculate total ordered quantity for product
        orderItems: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // Calculate totalOrderedQuantity for each product and variant
  const productsWithTotals = products.map((product) => ({
    ...product,
    totalOrderedQuantity: product.hasVariants
      ? 0 // For products with variants, total is sum of variant totals
      : product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
    variants: product.variants.map((variant) => ({
      ...variant,
      totalOrderedQuantity: variant.orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      orderItems: undefined, // Remove detailed orderItems
    })),
    orderItems: undefined, // Remove the detailed orderItems, keep only the count
  }));

  return {
    products: productsWithTotals,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getProductByIdPublic(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          priceRanges: {
            orderBy: { minQuantity: "asc" },
          },
          orderItems: {
            select: {
              quantity: true,
            },
          },
        },
      },
      priceRanges: {
        orderBy: { minQuantity: "asc" },
      },
      _count: {
        select: {
          orderItems: true,
        },
      },
      orderItems: {
        select: {
          quantity: true,
        },
      },
    },
  });

  if (!product) return null;

  // Calculate total ordered quantities
  return {
    ...product,
    totalOrderedQuantity: product.hasVariants
      ? 0 // For products with variants, use variant totals
      : product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
    variants: product.variants.map((variant) => ({
      ...variant,
      totalOrderedQuantity: variant.orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      orderItems: undefined,
    })),
    orderItems: undefined,
  };
}

// Helper function to get product images (for backward compatibility)
export function getProductImages(product: any) {
  if (product.hasVariants && product.variants.length > 0) {
    return product.variants[0]?.images || [];
  }
  return product.images || [];
}

// Helper function to get booking amount (for backward compatibility)
export function getProductBookingAmount(product: any) {
  if (product.hasVariants && product.variants.length > 0) {
    return product.variants[0]?.bookingAmount || 0;
  }
  return product.bookingAmount || 0;
}
