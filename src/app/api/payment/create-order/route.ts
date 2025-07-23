// app/api/payment/create-order/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
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
                product: true,
                variant: {
                  include: { product: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.cart || user.cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Calculate total booking amount
    let totalBookingAmount = 0;
    let totalQuantity = 0;

    for (const item of user.cart.items) {
      const bookingAmount = item.variant
        ? Number(item.variant.bookingAmount)
        : Number(item.product?.bookingAmount || 0);

      totalBookingAmount += bookingAmount * item.quantity;
      totalQuantity += item.quantity;
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalBookingAmount * 100), // Amount in paise
      currency: "INR",
      receipt: `order_${Date.now()}`,
    });

    // Create order in database (BOOKED status, will be updated after payment)
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        totalQuantity,
        bookingAmount: totalBookingAmount,
        transactionId: razorpayOrder.id,
        status: "BOOKED",
        orderItems: {
          create: user.cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            bookingPrice: item.variant
              ? Number(item.variant.bookingAmount)
              : Number(item.product?.bookingAmount || 0),
          })),
        },
      },
    });

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: totalBookingAmount,
      currency: "INR",
      orderId: order.id,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
