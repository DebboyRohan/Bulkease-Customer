// app/api/sales/orders/[orderId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OrderStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { userId } = await auth();
    const { orderId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has sales or admin role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!user || (user.role !== "sales" && user.role !== "admin")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                hasVariants: true,
              },
            },
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    hasVariants: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            hall: true,
            roll: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching sales order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { userId } = await auth();
    const { orderId } = await params;
    const { status } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has sales or admin role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!user || (user.role !== "sales" && user.role !== "admin")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate status
    const validStatuses: OrderStatus[] = [
      "BOOKED",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
