"use client";

import React, { useState, useEffect } from "react";

export interface ToastInfo {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

type ToastListener = (toasts: ToastInfo[]) => void;
let toastListeners: ToastListener[] = [];
let toastsList: ToastInfo[] = [];

export const showToast = (
  message: string,
  type: "success" | "error" | "info" | "warning" = "info"
) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastInfo = { id, message, type };
  toastsList = [...toastsList, newToast];
  toastListeners.forEach((listener) => listener(toastsList));

  // Auto remove after 5 seconds
  setTimeout(() => {
    toastsList = toastsList.filter((t) => t.id !== id);
    toastListeners.forEach((listener) => listener(toastsList));
  }, 5000);
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  useEffect(() => {
    const handleUpdate = (newList: ToastInfo[]) => {
      setToasts(newList);
    };
    toastListeners.push(handleUpdate);
    setToasts([...toastsList]);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== handleUpdate);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-80 max-w-[calc(100vw-32px)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in transition-all duration-300 pointer-events-auto ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : toast.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-blue-50 border-blue-200 text-primary"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" && <span className="text-green-600">✓</span>}
            {toast.type === "error" && <span className="text-red-500">✕</span>}
            {toast.type === "warning" && <span className="text-amber-500">⚠</span>}
            {toast.type === "info" && <span className="text-blue-500">ℹ</span>}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => {
              toastsList = toastsList.filter((t) => t.id !== toast.id);
              setToasts([...toastsList]);
            }}
            className="text-ink-muted-48 hover:text-ink flex-shrink-0 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
