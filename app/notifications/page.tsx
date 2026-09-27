"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useListings";
import { useHydration } from "@/hooks/useDatabase";
import { markAllRead, markRead, remove } from "@/services/notificationService";
import { relativeTime } from "@/lib/dates";
import { Icon, type IconName } from "@/components/ui/Icon";

const TYPE_ICONS: Record<string, IconName> = {
  BOOKING_SUBMITTED: "calendar",
  BOOKING_ACCEPTED: "check",
  BOOKING_REJECTED: "alert",
  BOOKING_CANCELLED: "close",
  BOOKING_COMPLETED: "check",
  BOOKING_IN_PROGRESS: "clock",
  PAYMENT_SUCCESSFUL: "wallet",
  PAYMENT_FAILED: "alert",
  PAYMENT_PENDING: "clock",
  PAYMENT_RECEIVED: "wallet",
  REVIEW_AVAILABLE: "star",
  NEW_REVIEW: "star",
  NEW_BOOKING_REQUEST: "calendar",
  NEW_MESSAGE: "message",
  VERIFICATION_SUBMITTED: "shield",
  VERIFICATION_APPROVED: "shield",
  VERIFICATION_REJECTED: "shield",
  LISTING_APPROVED: "check",
  ACCOUNT_SUSPENDED: "alert",
  ACCOUNT_REACTIVATED: "check",
};

function NotificationsContent() {
  const { user } = useAuth();
  const hydrated = useHydration();
  const toast = useToast();
  const router = useRouter();
  const notifications = useNotifications(user?.id ?? "");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!hydrated || !user) return <LoadingState label="Loading notifications..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-muted">
            Updates about your bookings, payments, reviews, and account.
          </p>
        </div>
        {notifications.length > 0 ? (
          <Button
            variant="outline"
            icon="check"
            onClick={() => {
              const count = markAllRead(user.id);
              toast.success("All marked as read", `${count} notification${count === 1 ? "" : "s"} updated.`);
            }}
          >
            Mark all as read
          </Button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon="bell"
          title="You're all caught up."
          message="New notifications about bookings, payments, and reviews will appear here."
        />
      ) : (
        <Card padded={false}>
          <ul>
            {notifications.map((item) => (
              <li
                key={item.id}
                className={`flex items-start gap-3 border-b border-line px-4 py-4 last:border-b-0 ${
                  item.read ? "bg-white" : "bg-primary-soft/40"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    item.read ? "bg-sand-deep text-muted" : "bg-white text-primary"
                  }`}
                >
                  <Icon name={TYPE_ICONS[item.type] ?? "info"} size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    {!item.read ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                        New
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-soft">{item.message}</p>
                  <p className="mt-1 text-xs text-muted">{relativeTime(item.createdAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {item.link ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() => {
                        markRead(item.id);
                        router.push(item.link!);
                      }}
                    >
                      Open
                    </button>
                  ) : null}
                  {!item.read ? (
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-ink"
                      onClick={() => markRead(item.id)}
                    >
                      Mark read
                    </button>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Delete notification"
                    className="text-xs text-muted hover:text-danger"
                    onClick={() => setDeleteId(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete this notification?"
        message="The notification will be removed from your list."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deleteId) {
            remove(deleteId);
            toast.success("Notification deleted");
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <RoleGuard allow={["FARMER", "PROVIDER", "ADMIN"]}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <div className="page-shell py-8">
            <NotificationsContent />
          </div>
        </main>
        <SiteFooter />
      </div>
    </RoleGuard>
  );
}
