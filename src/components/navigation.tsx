"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export interface NavItem {
  label: string;
  href: string;
}

export default function Navigation({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // Check if there's an exact match for any item
  const hasExactMatch = items.some((item) => item.href === pathname);

  return (
    <nav className="flex gap-2 text-sm">
      {items.map((item) => {
        // Use exact match if one exists, otherwise fall back to prefix matching
        const isActive = hasExactMatch
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "rounded-lg px-3 py-2 font-medium transition",
              isActive
                ? "bg-teal-100 text-teal-800"
                : "text-slate-600 hover:bg-teal-50 hover:text-teal-800",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
