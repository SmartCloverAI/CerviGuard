"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Failed to logout", error);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
      disabled={loading}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
