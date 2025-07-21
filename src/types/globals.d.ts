export {};

// Create a type for the roles
export type Roles = "admin" | "sales" | "user";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
      onboarded?: boolean;
    };
  }
}
