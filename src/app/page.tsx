import { redirect } from "next/navigation";
import { getCurrentAuthenticatedUser } from "@/lib/services/userService";

export default async function Home() {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (user) {
      redirect("/dashboard");
    }
  } catch (error) {
    // If auth service is unavailable, redirect to login
    console.error("[Home] Auth check failed:", error instanceof Error ? error.message : error);
  }
  redirect("/login");
}
