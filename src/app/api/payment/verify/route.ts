// app/api/payment/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = await request.json();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Update order with payment details
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        transactionId: razorpay_payment_id,
        status: "BOOKED",
      },
    });

    // Clear user's cart
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { cartId: true },
    });

    if (user) {
      await prisma.cartItem.deleteMany({
        where: { cartId: user.cartId },
      });
    }

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
