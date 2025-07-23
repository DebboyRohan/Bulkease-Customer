// app/api/webhooks/clerk/route.ts

import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
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
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with an ID of ${id} and type of ${eventType}`);
  console.log("Webhook body:", body);

  // Handle the webhook
  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(evt.data);
        break;
      case "user.updated":
        await handleUserUpdated(evt.data);
        break;
      case "user.deleted":
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled webhook type: ${eventType}`);
    }

    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
}

async function handleUserCreated(userData: any) {
  try {
    console.log("Creating user:", userData);

    // Extract user data from Clerk
    const {
      id: clerkId,
      email_addresses,
      phone_numbers,
      first_name,
      last_name,
      image_url,
    } = userData;

    // Get primary email and phone
    const primaryEmail = email_addresses.find(
      (email: any) => email.id === userData.primary_email_address_id
    );
    const primaryPhone = phone_numbers.find(
      (phone: any) => phone.id === userData.primary_phone_number_id
    );

    // Create user name
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    // Create a cart for the user first
    const cart = await prisma.cart.create({
      data: {},
    });

    // Create user in database
    const user = await prisma.user.create({
      data: {
        clerkId,
        email: primaryEmail?.email_address || null,
        phone: primaryPhone?.phone_number || null,
        name,
        cartId: cart.id,
        onboarded: false, // User will need to complete onboarding
      },
    });

    console.log("User created successfully:", user);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

async function handleUserUpdated(userData: any) {
  try {
    console.log("Updating user:", userData);

    const {
      id: clerkId,
      email_addresses,
      phone_numbers,
      first_name,
      last_name,
    } = userData;

    // Get primary email and phone
    const primaryEmail = email_addresses.find(
      (email: any) => email.id === userData.primary_email_address_id
    );
    const primaryPhone = phone_numbers.find(
      (phone: any) => phone.id === userData.primary_phone_number_id
    );

    // Create user name
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { clerkId },
        data: {
          email: primaryEmail?.email_address || null,
          phone: primaryPhone?.phone_number || null,
          name,
        },
      });
      console.log("User updated successfully");
    } else {
      // User doesn't exist, create them (fallback)
      await handleUserCreated(userData);
    }
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

async function handleUserDeleted(userData: any) {
  try {
    console.log("Deleting user:", userData);

    const { id: clerkId } = userData;

    // Delete user from database (cart will be deleted due to cascade)
    await prisma.user.delete({
      where: { clerkId },
    });

    console.log("User deleted successfully");
  } catch (error) {
    console.error("Error deleting user:", error);
    // Don't throw error for deletion as user might not exist in our DB
  }
}
