import { auth } from "@clerk/nextjs/server";
export async function checkOnboardingStatus() {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.onboarded ?? false;
}
