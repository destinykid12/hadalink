"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/** Slide-in drawer used for mobile navigation and filter panels. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "left" | "right";
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-ink/45"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute top-0 ${side === "right" ? "right-0" : "left-0"} h-full w-[86%] max-w-sm overflow-y-auto border-${side === "right" ? "l" : "r"} border-line bg-white shadow-pop`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-md p-1.5 text-muted hover:bg-sand-deep hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
