import { redirect } from "next/navigation";
import { getCurrentAuthenticatedUser } from "@/lib/services/userService";

export default async function Home() {
  const user = await getCurrentAuthenticatedUser();
  if (user) {
    redirect("/dashboard");
  }
  redirect("/login");
}
