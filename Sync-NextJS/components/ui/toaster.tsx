"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

let toasts: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

export function toast(options: Omit<Toast, "id">) {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast = { ...options, id };
  toasts = [...toasts, newToast];
  listeners.forEach((listener) => listener(toasts));

  if (options.duration !== Infinity) {
    setTimeout(() => {
      toast.dismiss(id);
    }, options.duration || 3000);
  }
}

toast.dismiss = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id);
  listeners.forEach((listener) => listener(toasts));
};

export function Toaster() {
  const [toastList, setToastList] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setToastList);
    return () => {
      listeners = listeners.filter((l) => l !== setToastList);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toastList.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg shadow-lg px-4 py-3 min-w-[300px] flex items-start justify-between ${
            t.type === "success"
              ? "bg-green-50 border border-green-200"
              : t.type === "error"
                ? "bg-red-50 border border-red-200"
                : t.type === "warning"
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-blue-50 border border-blue-200"
          }`}
        >
          <div className="flex-1">
            {t.title && (
              <div className="font-semibold text-gray-900">{t.title}</div>
            )}
            {t.description && (
              <div className="text-sm text-gray-600 mt-1">{t.description}</div>
            )}
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
