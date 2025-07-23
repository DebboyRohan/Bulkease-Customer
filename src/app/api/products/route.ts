// app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAllProductsPublic } from "@/lib/db/products";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || undefined;
    const sort = searchParams.get("sort") || "newest"; // newest, price_low, price_high

    const result = await getAllProductsPublic(page, limit, search, sort);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
