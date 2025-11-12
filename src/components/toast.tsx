"use client";

import { useEffect, useState } from "react";
import { useToast, type Toast as ToastType } from "@/contexts/toast-context";

function Toast({ toast }: { toast: ToastType }) {
  const { removeToast } = useToast();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, toast.duration - 300);

      return () => clearTimeout(exitTimer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300);
  };

  const typeStyles = {
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200 border-emerald-100",
    error: "bg-rose-50 text-rose-800 ring-rose-200 border-rose-100",
    warning: "bg-amber-50 text-amber-800 ring-amber-200 border-amber-100",
    info: "bg-blue-50 text-blue-800 ring-blue-200 border-blue-100",
  };

  const iconStyles = {
    success: "text-emerald-600",
    error: "text-rose-600",
    warning: "text-amber-600",
    info: "text-blue-600",
  };

  const icons = {
    success: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  return (
    <div
      className={`
        pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border p-4 shadow-lg ring-1 backdrop-blur transition-all duration-300
        ${typeStyles[toast.type]}
        ${
          isExiting
            ? "translate-x-full opacity-0"
            : "translate-x-0 opacity-100 animate-in slide-in-from-right-full"
        }
      `}
    >
      <div className={`flex-shrink-0 ${iconStyles[toast.type]}`}>{icons[toast.type]}</div>
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 rounded-md p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1"
        aria-label="Close"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="pointer-events-none fixed right-0 top-0 z-50 flex max-h-screen w-full flex-col items-end gap-3 p-4 sm:p-6">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
