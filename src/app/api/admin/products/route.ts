// app/api/admin/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createProductAdmin, getAllProductsAdmin } from "@/lib/db/products";

export async function GET(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();

    // Check if user is admin
    if (sessionClaims?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;
    const sort = searchParams.get("sort") || "newest";

    const result = await getAllProductsAdmin(page, limit, search, sort);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();

    if (sessionClaims?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await request.json();
    console.log("Received data:", data);

    // Basic validation
    if (!data.name) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // Schema-specific validation
    if (data.hasVariants) {
      // For products with variants
      if (data.bookingAmount !== null && data.bookingAmount !== undefined) {
        return NextResponse.json(
          { error: "Products with variants should not have a booking amount" },
          { status: 400 }
        );
      }

      if (!data.variants || data.variants.length === 0) {
        return NextResponse.json(
          { error: "Products with variants must have at least one variant" },
          { status: 400 }
        );
      }

      // Validate each variant
      for (let i = 0; i < data.variants.length; i++) {
        const variant = data.variants[i];
        if (!variant.name) {
          return NextResponse.json(
            { error: `Variant ${i + 1} name is required` },
            { status: 400 }
          );
        }
        if (!variant.bookingAmount || variant.bookingAmount <= 0) {
          return NextResponse.json(
            {
              error: `Variant ${
                i + 1
              } booking amount is required and must be greater than 0`,
            },
            { status: 400 }
          );
        }
        if (!variant.priceRanges || variant.priceRanges.length === 0) {
          return NextResponse.json(
            { error: `Variant ${i + 1} must have at least one price range` },
            { status: 400 }
          );
        }
      }
    } else {
      // For products without variants
      if (!data.bookingAmount || data.bookingAmount <= 0) {
        return NextResponse.json(
          { error: "Booking amount is required for products without variants" },
          { status: 400 }
        );
      }

      if (!data.priceRanges || data.priceRanges.length === 0) {
        return NextResponse.json(
          {
            error:
              "Products without variants must have at least one price range",
          },
          { status: 400 }
        );
      }
    }

    const product = await createProductAdmin(data);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "A product with this name already exists" },
          { status: 409 }
        );
      }

      // Return the specific error message for validation errors
      if (
        error.message.includes("Products with variants") ||
        error.message.includes("Products without variants") ||
        error.message.includes("must have")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
