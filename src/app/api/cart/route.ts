// app/api/cart/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    priceRanges: true,
                  },
                },
                variant: {
                  include: {
                    priceRanges: true,
                    product: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user.cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, variantId, quantity } = await request.json();

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    if (!productId && !variantId) {
      return NextResponse.json(
        { error: "Either productId or variantId is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { cartId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Fixed: Handle the unique constraint properly
    let existingItem;

    if (variantId) {
      // For variant products, productId should be null
      existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: user.cartId,
          productId: null,
          variantId: variantId,
        },
      });
    } else {
      // For regular products, variantId should be null
      existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: user.cartId,
          productId: productId,
          variantId: null,
        },
      });
    }

    if (existingItem) {
      // Update quantity
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
      return NextResponse.json(updatedItem);
    } else {
      // Create new cart item
      const newItem = await prisma.cartItem.create({
        data: {
          cartId: user.cartId,
          productId: variantId ? null : productId, // ✅ Explicit null handling
          variantId: productId ? null : variantId, // ✅ Explicit null handling
          quantity,
        },
      });
      return NextResponse.json(newItem);
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
