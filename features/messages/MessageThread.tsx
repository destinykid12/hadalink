"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useDatabase } from "@/hooks/useDatabase";
import { getThread, markThreadRead, sendMessage } from "@/services/messageService";
import { formatDateTime } from "@/lib/dates";

export function MessageThread({
  bookingId,
  currentUserId,
}: {
  bookingId: string;
  currentUserId: string;
}) {
  const toast = useToast();
  useDatabase();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const thread = useMemo(
    () => getThread(bookingId, currentUserId),
    [bookingId, currentUserId],
  );

  // Mark incoming messages as read when the thread is opened.
  useEffect(() => {
    markThreadRead(bookingId, currentUserId);
  }, [bookingId, currentUserId, thread]);

  const onSend = (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    const result = sendMessage(bookingId, currentUserId, body);
    setBusy(false);
    if (!result.ok) {
      toast.error("Message not sent", result.error);
      return;
    }
    setBody("");
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!thread) return null;

  const counterpartName =
    thread.farmerUser.id === currentUserId ? thread.providerUser.name : thread.farmerUser.name;

  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-semibold text-ink">Messages with {counterpartName}</h3>
      <p className="mt-1 text-xs text-muted">
        Booking-based conversation. Keep arrangements here so both sides have a record.
      </p>

      <ul
        className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-md border border-line bg-sand p-3"
        aria-live="polite"
      >
        {thread.messages.length === 0 ? (
          <li className="py-6 text-center text-sm text-muted">
            No messages yet. Start the conversation below.
          </li>
        ) : (
          thread.messages.map((message) => {
            const mine = message.senderUserId === currentUserId;
            return (
              <li key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm ${
                    mine ? "bg-primary text-white" : "border border-line bg-white text-ink"
                  }`}
                >
                  <p className="leading-relaxed">{message.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-white/75" : "text-muted"}`}>
                    {formatDateTime(message.createdAt)}
                    {mine ? (message.read ? " | Seen" : " | Sent") : ""}
                  </p>
                </div>
              </li>
            );
          })
        )}
        <div ref={bottomRef} />
      </ul>

      <form onSubmit={onSend} className="mt-3 flex gap-2">
        <label htmlFor={`message-input-${bookingId}`} className="sr-only">
          Type a message
        </label>
        <input
          id={`message-input-${bookingId}`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-line-strong bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
        <Button type="submit" disabled={busy || !body.trim()} icon="send">
          Send
        </Button>
      </form>
    </div>
  );
}
