import { auth, clerkMiddleware } from "@clerk/nextjs/server";
import { createRouteMatcher } from "@clerk/nextjs/server";
import { checkRole } from "./lib/roles";
import { NextResponse } from "next/server";
import { UserRound } from "lucide-react";

const isPublicRoute = createRouteMatcher(["/", "/products(.*),/sign-in"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isSalesRoute = createRouteMatcher(["/sales(.*)"]);
export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const userRole = sessionClaims?.metadata?.role ?? "user";
  if (!isPublicRoute(req) && !userId) {
    auth.protect();
  }
  if (isAdminRoute(req) && userRole !== "admin") {
    const url = new URL("/", req.url);
    return NextResponse.redirect(url);
  }
  if (isSalesRoute(req) && userRole != "sales") {
    const url = new URL("/", req.url);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
