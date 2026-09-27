"use client";

import Link from "next/link";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BookingStatusBadge } from "@/components/ui/Badge";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { useThreads } from "@/hooks/useListings";
import { useHydration } from "@/hooks/useDatabase";
import { relativeTime } from "@/lib/dates";

function MessagesContent() {
  const { user } = useAuth();
  const hydrated = useHydration();
  const threads = useThreads(user?.id ?? "");

  if (!hydrated || !user) return <LoadingState label="Loading conversations..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Messages</h1>
        <p className="mt-1 text-sm text-muted">
          Booking-based conversations with farmers and providers.
        </p>
      </div>

      {threads.length === 0 ? (
        <EmptyState
          icon="message"
          title="No conversations yet"
          message="Messages appear here when you contact a provider or receive questions about a booking."
          action={
            <Link href="/equipment">
              <span className="inline-flex">
                <span className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-white">
                  Find equipment
                </span>
              </span>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const counterpart =
              thread.farmerUser.id === user.id ? thread.providerUser : thread.farmerUser;
            const lastMessage = thread.messages[thread.messages.length - 1];
            return (
              <Link
                key={thread.threadId}
                href={`/messages/${thread.bookingId}`}
                className="block rounded-lg border border-line bg-white p-4 shadow-card hover:border-primary/40 hover:bg-primary-soft/30"
              >
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={counterpart.avatar || "/images/service-team.jpg"}
                    alt=""
                    className="h-11 w-11 rounded-full border border-line object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{counterpart.name}</p>
                      <BookingStatusBadge status={thread.booking.status} />
                      {thread.unreadCount > 0 ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                          {thread.unreadCount} new
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {thread.booking.listingTitle} | Booking {thread.booking.reference}
                    </p>
                    <p className="mt-1 truncate text-sm text-ink-soft">
                      {lastMessage ? lastMessage.body : "No messages yet."}
                    </p>
                    <p className="mt-1 text-xs text-muted">{relativeTime(thread.lastMessageAt)}</p>
                  </div>
                  <Icon name="chevron-right" size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <RoleGuard allow={["FARMER", "PROVIDER", "ADMIN"]}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <div className="page-shell py-8">
            <MessagesContent />
          </div>
        </main>
        <SiteFooter />
      </div>
    </RoleGuard>
  );
}
