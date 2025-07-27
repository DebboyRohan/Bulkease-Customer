// app/api/admin/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "all"; // all, active, inactive

    const offset = (page - 1) * limit;

    // Build where clause for admin (can see all products)
    const whereClause: any = {
      AND: [],
    };

    if (search) {
      whereClause.AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Add status filter
    if (statusFilter === "active") {
      whereClause.AND.push({ isActive: true });
    } else if (statusFilter === "inactive") {
      whereClause.AND.push({ isActive: false });
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause.AND.length > 0 ? whereClause : {},
        include: {
          variants: {
            include: {
              priceRanges: { orderBy: { minQuantity: "asc" } },
            },
          },
          priceRanges: { orderBy: { minQuantity: "asc" } },
          _count: {
            select: {
              orderItems: true,
              cartItems: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.product.count({
        where: whereClause.AND.length > 0 ? whereClause : {},
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching admin products:", error);
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
      isActive = true, // Default to true if not provided
    } = body;

    // Create product in transaction
    const product = await prisma.$transaction(async (tx) => {
      const createdProduct = await tx.product.create({
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
              isActive: variant.isActive ?? true, // Default to true if not provided
              productId: createdProduct.id,
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
            productId: createdProduct.id,
          })),
        });
      }

      return createdProduct;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
