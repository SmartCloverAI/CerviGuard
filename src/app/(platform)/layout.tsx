import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentAuthenticatedUser } from "@/lib/services/userService";
import LogoutButton from "@/components/logout-button";
import Navigation from "@/components/navigation";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Cases", href: "/cases" },
    { label: "Add Case", href: "/cases/new" },
    { label: "Profile", href: "/profile" },
    ...(user.role === "admin" ? [{ label: "Admin", href: "/admin/users" }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/branding/smartclover-logo.jpg"
              alt="SmartClover logo"
              width={40}
              height={40}
              className="rounded-lg border border-slate-200 bg-white object-cover shadow-sm"
              priority
            />
            <div>
              <h1 className="text-xl font-semibold text-slate-900">CerviGuard Pilot Console</h1>
              <p className="text-xs text-slate-500">
                Logged in as {user.username} · Role: {user.role.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Navigation items={navItems} />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
