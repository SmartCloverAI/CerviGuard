"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteCaseButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/cases");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete case");
      }
    } catch {
      alert("Failed to delete case");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-rose-600">Delete this case?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="rounded bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="rounded bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-200"
    >
      Delete Case
    </button>
  );
}
