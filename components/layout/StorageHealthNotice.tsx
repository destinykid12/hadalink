"use client";

import { ErrorState, InlineNote } from "@/components/ui/States";
import { useMounted } from "@/hooks/useDatabase";
import { storageStatus } from "@/services/demoService";
import { isStorageAvailable } from "@/lib/storage";

/**
 * Surfaces real local-database error conditions:
 * localStorage unavailable or previously corrupted data restored from seed.
 * Shown on major screens so users never face a blank failure.
 */
export function StorageHealthNotice() {
  const mounted = useMounted();
  if (!mounted) return null;

  const { persistent, lastError } = storageStatus();

  if (!isStorageAvailable()) {
    return (
      <div className="mb-6">
        <ErrorState
          title="Browser storage is unavailable"
          message="Your changes will only last for this session because this browser is blocking localStorage. Enable site data and reload to keep your work."
        />
      </div>
    );
  }

  if (!persistent) {
    return (
      <div className="mb-6">
        <ErrorState
          title="Browser storage is full or blocked"
          message="New changes may not be saved after you close the tab. Free up site storage or export your work."
        />
      </div>
    );
  }

  if (lastError) {
    return (
      <div className="mb-6">
        <InlineNote tone="warning">{lastError}</InlineNote>
      </div>
    );
  }

  return null;
}
