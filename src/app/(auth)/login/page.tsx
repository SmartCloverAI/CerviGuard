import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentAuthenticatedUser } from "@/lib/services/userService";
import LoginForm from "./login-form";

export default async function LoginPage() {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (user) {
      redirect("/dashboard");
    }
  } catch (error) {
    console.error("[LoginPage] Auth check failed:", error instanceof Error ? error.message : error);
    // Continue to show login form even if auth check fails
  }

  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Preparing secure login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
