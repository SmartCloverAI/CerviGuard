"use client";

import { useState } from "react";

interface LoginPayload {
  username: string;
  password: string;
}

export default function LoginForm() {
  const [form, setForm] = useState<LoginPayload>({ username: "", password: "" });
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (key: keyof LoginPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.username || !form.password) {
      setError("Username and password are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Login failed");
      }
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to authenticate");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={form.username}
          onChange={(event) => updateField("username", event.target.value)}
          placeholder="clinician@example.com"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          placeholder="••••••••"
        />
      </div>
      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing in…" : "Sign In"}
      </button>
      <p className="text-xs text-slate-500">
        Access is limited to SmartClover pilot accounts provisioned via the admin dashboard.
      </p>
    </form>
  );
}
