/** Notification service. Notifications are created by domain events. */

import { hydrateDatabase } from "@/lib/db";
import { createId } from "@/lib/ids";
import { nowISO } from "@/lib/dates";
import { notificationRepository } from "@/repositories";
import type { AppNotification, NotificationType, Result } from "@/types/models";

export interface NotifyInput {
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export function notify(input: NotifyInput): AppNotification {
  hydrateDatabase();
  const now = nowISO();
  return notificationRepository.create({
    id: createId("ntf"),
    recipientUserId: input.recipientUserId,
    type: input.type,
    title: input.title,
    message: input.message,
    read: false,
    link: input.link,
    createdAt: now,
    updatedAt: now,
  });
}

export function listForUser(userId: string): AppNotification[] {
  hydrateDatabase();
  return notificationRepository
    .findWhere((item) => item.recipientUserId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function unreadCount(userId: string): number {
  hydrateDatabase();
  return notificationRepository.count(
    (item) => item.recipientUserId === userId && !item.read,
  );
}

export function markRead(id: string): Result<AppNotification> {
  hydrateDatabase();
  const existing = notificationRepository.findById(id);
  if (!existing) return { ok: false, error: "Notification not found." };
  const updated = notificationRepository.update(id, { read: true });
  return { ok: true, data: updated ?? existing };
}

export function markAllRead(userId: string): number {
  hydrateDatabase();
  let count = 0;
  notificationRepository
    .findWhere((item) => item.recipientUserId === userId && !item.read)
    .forEach((item) => {
      notificationRepository.update(item.id, { read: true });
      count += 1;
    });
  return count;
}

export function remove(id: string): Result<boolean> {
  hydrateDatabase();
  const removed = notificationRepository.delete(id);
  if (!removed) return { ok: false, error: "Notification not found." };
  return { ok: true, data: true };
}
