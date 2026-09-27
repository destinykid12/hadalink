"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function RatingStars({
  value,
  count,
  size = 16,
  showValue = true,
}: {
  value: number;
  count?: number;
  size?: number;
  showValue?: boolean;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="star"
            size={size}
            filled={star <= rounded}
            className={star <= rounded ? "text-accent" : "text-line-strong"}
          />
        ))}
      </span>
      {showValue ? (
        <span className="text-xs font-medium text-ink-soft">
          {value > 0 ? value.toFixed(1) : "No ratings"}
          {typeof count === "number" ? ` (${count})` : ""}
        </span>
      ) : null}
      <span className="sr-only">
        {value > 0 ? `Rated ${value} out of 5` : "Not rated yet"}
      </span>
    </span>
  );
}

export function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;
  return (
    <div role="radiogroup" aria-label="Rating out of 5" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="rounded p-0.5 text-accent hover:bg-accent-soft"
        >
          <Icon name="star" size={26} filled={star <= shown} />
        </button>
      ))}
    </div>
  );
}
