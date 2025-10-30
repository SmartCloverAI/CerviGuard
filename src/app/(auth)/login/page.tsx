import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentAuthenticatedUser } from "@/lib/services/userService";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentAuthenticatedUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Preparing secure login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
