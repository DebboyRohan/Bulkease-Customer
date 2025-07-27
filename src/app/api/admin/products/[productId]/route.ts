// app/api/admin/products/[productId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { userId } = await auth();
    const { productId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Admin can see both active and inactive products
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            priceRanges: {
              orderBy: { minQuantity: "asc" },
            },
          },
        },
        priceRanges: {
          orderBy: { minQuantity: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { userId } = await auth();
    const { productId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      hasVariants,
      images,
      bookingAmount,
      variants,
      priceRanges,
      isActive,
    } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update product in transaction
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Delete existing variants and price ranges
      await tx.variant.deleteMany({
        where: { productId },
      });

      await tx.priceRange.deleteMany({
        where: { productId },
      });

      // Update product
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name,
          description,
          hasVariants,
          images: hasVariants ? [] : images,
          bookingAmount: hasVariants ? null : bookingAmount,
          isActive,
        },
      });

      if (hasVariants && variants) {
        // Create variants with their price ranges
        for (const variant of variants) {
          await tx.variant.create({
            data: {
              name: variant.name,
              bookingAmount: variant.bookingAmount,
              images: variant.images || [],
              isActive: variant.isActive ?? true,
              productId: product.id,
              priceRanges: {
                create: variant.priceRanges.map((pr: any) => ({
                  minQuantity: pr.minQuantity,
                  maxQuantity: pr.maxQuantity,
                  pricePerUnit: pr.pricePerUnit,
                })),
              },
            },
          });
        }
      } else if (priceRanges) {
        // Create product price ranges
        await tx.priceRange.createMany({
          data: priceRanges.map((pr: any) => ({
            minQuantity: pr.minQuantity,
            maxQuantity: pr.maxQuantity,
            pricePerUnit: pr.pricePerUnit,
            productId: product.id,
          })),
        });
      }

      return product;
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { userId } = await auth();
    const { productId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete product (cascades to variants and price ranges)
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
