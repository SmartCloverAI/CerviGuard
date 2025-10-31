"use client";

import { useState } from "react";

export default function CreateUserForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create user");
      }
      await response.json();
      setUsername("");
      setPassword("");
      setRole("user");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 border-teal-100 bg-white">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Add a new pilot account</h2>
        <p className="text-sm text-slate-500">
          Credentials are hashed before being stored in the decentralized metadata ledger. Share login details securely.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600" htmlFor="new-username">
            Username
          </label>
          <input
            id="new-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="clinician@clinic.ro"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600" htmlFor="new-password">
            Initial password
          </label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Temporary password"
            autoComplete="off"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Role</label>
        <select value={role} onChange={(event) => setRole(event.target.value as "admin" | "user")}>
          <option value="user">Clinician (user)</option>
          <option value="admin">Administrator</option>
        </select>
      </div>
      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <button type="submit" disabled={isSaving} className="sm:w-fit">
        {isSaving ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
