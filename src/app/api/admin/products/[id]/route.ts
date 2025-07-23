// app/api/admin/products/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getProductByIdAdmin,
  updateProductAdmin,
  deleteProductAdmin,
} from "@/lib/db/products";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { sessionClaims } = await auth();

    if (sessionClaims?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const product = await getProductByIdAdmin(id);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { sessionClaims } = await auth();

    if (sessionClaims?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await request.json();
    const { id } = await params;

    console.log("Updating product with data:", data);

    // Same validation logic as POST
    if (!data.name) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // Schema-specific validation
    if (data.hasVariants) {
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
    } else {
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

    const product = await updateProductAdmin(id, data);

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "A product with this name already exists" },
          { status: 409 }
        );
      }

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { sessionClaims } = await auth();

    if (sessionClaims?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await deleteProductAdmin(id);

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);

    if (
      error instanceof Error &&
      error.message.includes("Foreign key constraint")
    ) {
      return NextResponse.json(
        { error: "Cannot delete product with existing orders" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
