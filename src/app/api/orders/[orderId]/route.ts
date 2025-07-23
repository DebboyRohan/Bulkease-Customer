// app/api/orders/[orderId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
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
    console.error("Error fetching order:", error);
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
    const { action } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow cancellation if order is BOOKED
    if (action === "cancel" && order.status === "BOOKED") {
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: "Order cancelled successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action or order cannot be modified" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
