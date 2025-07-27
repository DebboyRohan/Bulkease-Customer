// app/api/products/[productId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true, // Only show if product is active
      },
      include: {
        variants: {
          where: { isActive: true }, // Only include active variants
          include: {
            priceRanges: { orderBy: { minQuantity: "asc" } },
          },
        },
        priceRanges: { orderBy: { minQuantity: "asc" } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or inactive" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
