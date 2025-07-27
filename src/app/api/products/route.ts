// app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "newest";

    const offset = (page - 1) * limit;

    // Build sort order
    let sortOrder: any = { createdAt: "desc" };
    if (sort === "price_low") {
      sortOrder = { bookingAmount: "asc" };
    } else if (sort === "price_high") {
      sortOrder = { bookingAmount: "desc" };
    }

    // Build where clause with isActive filter
    const whereClause: any = {
      isActive: true, // Only show active products
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

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          variants: {
            where: { isActive: true }, // Only include active variants
            include: {
              priceRanges: { orderBy: { minQuantity: "asc" } },
            },
          },
          priceRanges: { orderBy: { minQuantity: "asc" } },
        },
        orderBy: sortOrder,
        skip: offset,
        take: limit,
      }),
      prisma.product.count({
        where: whereClause,
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
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
