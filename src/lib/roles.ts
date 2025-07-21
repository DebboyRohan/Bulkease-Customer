import { Roles } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";

export async function checkRole(role: Roles) {
  const { sessionClaims } = await auth();
  const userRole = sessionClaims?.metadata?.role ?? "user";
  return userRole === role;
}
