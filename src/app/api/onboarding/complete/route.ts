// app/api/onboarding/complete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, roll, hall } = await request.json();

    // Validate required fields
    if (!name || !phone || !roll || !hall) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    console.log("Updating user with data:", {
      name,
      phone,
      roll,
      hall,
      userId,
    });

    // Check if user exists first
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found. Please try signing out and back in." },
        { status: 404 }
      );
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        name,
        phone,
        roll,
        hall,
        onboarded: true,
      },
    });

    console.log("User updated successfully:", updatedUser);

    return NextResponse.json({
      message: "Onboarding completed successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);

    // Handle Prisma specific errors
    if (error instanceof Error) {
      if (error.message.includes("Record to update not found")) {
        return NextResponse.json(
          { error: "User not found. Please try signing out and back in." },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
