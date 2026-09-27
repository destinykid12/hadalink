"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  tone: "success" | "error" | "info";
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((item: Omit<ToastItem, "id">) => {
    const id = `toast-${++nextId}`;
    setItems((current) => [...current, { ...item, id }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((entry) => entry.id !== id));
    }, 4200);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, message) => toast({ title, message, tone: "success" }),
      error: (title, message) => toast({ title, message, tone: "error" }),
      info: (title, message) => toast({ title, message, tone: "info" }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 rounded-md border bg-white px-4 py-3 shadow-pop ${
              item.tone === "success"
                ? "border-primary/30"
                : item.tone === "error"
                  ? "border-danger/40"
                  : "border-line"
            }`}
          >
            <span
              className={`mt-0.5 ${
                item.tone === "success" ? "text-primary" : item.tone === "error" ? "text-danger" : "text-muted"
              }`}
            >
              <Icon name={item.tone === "success" ? "check" : item.tone === "error" ? "alert" : "info"} size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              {item.message ? <p className="mt-0.5 text-xs text-ink-soft">{item.message}</p> : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="ml-auto rounded p-1 text-muted hover:bg-sand-deep"
              onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
