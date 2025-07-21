import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justidy-center">
      <SignIn />
    </div>
  );
}
