// app/api/webhooks/clerk/route.ts

import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error("❌ CLERK_WEBHOOK_SECRET not found");
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Get the headers - await is required in Next.js 15
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("❌ Missing svix headers");
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (err) {
    console.error("❌ Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  const eventType = evt.type;
  const userData = evt.data;

  console.log(`🔥 Webhook received: ${eventType}`);
  console.log("📄 User data:", JSON.stringify(userData, null, 2));

  // Handle the webhook
  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(userData);
        break;
      case "user.updated":
        await handleUserUpdated(userData);
        break;
      case "user.deleted":
        await handleUserDeleted(userData);
        break;
      default:
        console.log(`❓ Unhandled webhook type: ${eventType}`);
    }

    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);

    // Log the full error details
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return new Response("Error processing webhook", { status: 500 });
  }
}

async function handleUserCreated(userData: any) {
  try {
    console.log("👤 Creating user in database...");

    // Extract data from webhook payload according to your schema
    const {
      id: clerkId,
      email_addresses,
      phone_numbers,
      first_name,
      last_name,
      primary_email_address_id,
      primary_phone_number_id,
    } = userData;

    console.log("🔍 Extracted data:", {
      clerkId,
      primaryEmailId: primary_email_address_id,
      primaryPhoneId: primary_phone_number_id,
      firstName: first_name,
      lastName: last_name,
    });

    // Get primary email
    const primaryEmail = email_addresses?.find(
      (email: any) => email.id === primary_email_address_id
    );

    // Get primary phone
    const primaryPhone = phone_numbers?.find(
      (phone: any) => phone.id === primary_phone_number_id
    );

    console.log("📧 Primary email:", primaryEmail);
    console.log("📱 Primary phone:", primaryPhone);

    // Create user name - handle null last_name
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    // Extract clean phone number (remove + prefix if exists)
    const phoneNumber = primaryPhone?.phone_number
      ? primaryPhone.phone_number.startsWith("+")
        ? primaryPhone.phone_number.slice(1)
        : primaryPhone.phone_number
      : null;

    console.log("📝 Processed data:", {
      clerkId,
      email: primaryEmail?.email_address,
      phone: phoneNumber,
      name,
    });

    // Create a cart for the user first
    console.log("🛒 Creating cart...");
    const cart = await prisma.cart.create({
      data: {},
    });

    console.log("✅ Cart created with ID:", cart.id);

    // Create user in database according to your schema
    const userToCreate = {
      clerkId,
      email: primaryEmail?.email_address || null,
      phone: phoneNumber,
      name,
      cartId: cart.id,
      onboarded: false,
      role: "user" as const,
      // roll and hall will be set during onboarding
      roll: null,
      hall: null,
    };

    console.log("👤 Creating user with data:", userToCreate);

    const user = await prisma.user.create({
      data: userToCreate,
    });

    console.log("✅ User created successfully:", {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      phone: user.phone,
      name: user.name,
      cartId: user.cartId,
      role: user.role,
      onboarded: user.onboarded,
    });

    return user;
  } catch (error) {
    console.error("❌ Error creating user:", error);

    // Log detailed Prisma errors
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      if ("code" in error) {
        console.error("Error code:", (error as any).code);
      }
    }

    throw error;
  }
}

async function handleUserUpdated(userData: any) {
  try {
    console.log("📝 Updating user in database...");

    const {
      id: clerkId,
      email_addresses,
      phone_numbers,
      first_name,
      last_name,
      primary_email_address_id,
      primary_phone_number_id,
    } = userData;

    // Get primary email
    const primaryEmail = email_addresses?.find(
      (email: any) => email.id === primary_email_address_id
    );

    // Get primary phone
    const primaryPhone = phone_numbers?.find(
      (phone: any) => phone.id === primary_phone_number_id
    );

    // Create user name
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    // Extract clean phone number
    const phoneNumber = primaryPhone?.phone_number
      ? primaryPhone.phone_number.startsWith("+")
        ? primaryPhone.phone_number.slice(1)
        : primaryPhone.phone_number
      : null;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { clerkId },
        data: {
          email: primaryEmail?.email_address || null,
          phone: phoneNumber,
          name,
        },
      });
      console.log("✅ User updated successfully:", updatedUser.id);
    } else {
      // User doesn't exist, create them (fallback)
      console.log("👤 User not found during update, creating...");
      await handleUserCreated(userData);
    }
  } catch (error) {
    console.error("❌ Error updating user:", error);
    throw error;
  }
}

async function handleUserDeleted(userData: any) {
  try {
    console.log("🗑️ Deleting user from database...");

    const { id: clerkId } = userData;

    // Delete user from database (cart will be deleted due to cascade)
    await prisma.user.delete({
      where: { clerkId },
    });

    console.log("✅ User deleted successfully");
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    // Don't throw error for deletion as user might not exist in our DB
    console.log("ℹ️ Continuing despite deletion error");
  }
}
