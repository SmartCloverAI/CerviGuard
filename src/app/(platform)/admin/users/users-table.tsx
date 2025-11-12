"use client";

import { useState } from "react";
import { format } from "date-fns";
import EditUserModal from "@/components/edit-user-modal";
import type { PublicUser } from "@ratio1/cstore-auth-ts";

interface UsersTableProps {
  initialUsers: PublicUser<{ isActive?: boolean }>[];
}

export default function UsersTable({ initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<PublicUser<{ isActive?: boolean }> | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditUser = (user: PublicUser<{ isActive?: boolean }>) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = async () => {
    // Refresh users list
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to refresh users:", error);
    }
    setIsEditModalOpen(false);
  };

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const isActive = u.metadata?.isActive ?? true;
              return (
                <tr key={u.username} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.username}</td>
                  <td className="px-4 py-3 uppercase tracking-wide text-slate-500">{u.role}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {format(new Date(u.createdAt), "PPp")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-200 text-slate-500 ring-slate-300"
                      }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEditUser(u)}
                      className="inline-flex items-center space-x-1 rounded-md border-0 bg-transparent px-2 py-1 text-sm font-medium text-teal-600 shadow-none transition-colors hover:bg-teal-50 hover:text-teal-800"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
