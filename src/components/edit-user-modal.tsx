"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/contexts/toast-context";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    username: string;
    role: "admin" | "user";
    metadata?: {
      isActive?: boolean;
    };
  } | null;
  onSuccess?: () => void;
}

export default function EditUserModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: EditUserModalProps) {
  const { success, error: showError } = useToast();
  const [role, setRole] = useState<"admin" | "user">("user");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setIsActive(user.metadata?.isActive ?? true);
    }
  }, [user]);

  const resetForm = () => {
    if (user) {
      setRole(user.role);
      setIsActive(user.metadata?.isActive ?? true);
    }
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          role,
          metadata: { isActive },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const message = data.error || "Failed to update user";
        setError(message);
        showError(message);
        return;
      }

      success(`User "${user.username}" updated successfully`);
      onSuccess?.();
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update user";
      setError(message);
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Edit User</h2>
          <p className="mt-1 text-sm text-slate-500">
            Update role and status for {user.username}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Username
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
            <p className="mt-1 text-xs text-slate-400">Username cannot be changed</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "user")}
              disabled={isSubmitting}
              className="w-full"
            >
              <option value="user">Clinician (user)</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Status</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="isActive" className="text-sm text-slate-700">
                Active
              </label>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Inactive users cannot log in
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="sm:w-fit"
            >
              {isSubmitting ? "Updating..." : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
