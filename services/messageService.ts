/**
 * Booking-based messaging service.
 * Lightweight threads tied to a booking, not a full chat product.
 */

import { hydrateDatabase } from "@/lib/db";
import { createId } from "@/lib/ids";
import { nowISO } from "@/lib/dates";
import {
  bookingRepository,
  farmerRepository,
  messageRepository,
  providerRepository,
  userRepository,
} from "@/repositories";
import type { Message, Result, ThreadWithRelations } from "@/types/models";
import { notify } from "@/services/notificationService";

export function sendMessage(bookingId: string, senderUserId: string, body: string): Result<Message> {
  hydrateDatabase();
  const booking = bookingRepository.findById(bookingId);
  if (!booking) return { ok: false, error: "Booking not found." };
  if (!body.trim()) return { ok: false, error: "Message cannot be empty." };
  if (["REJECTED", "CANCELLED"].includes(booking.status)) {
    return { ok: false, error: "This booking is closed, so it cannot receive new messages." };
  }

  const farmer = farmerRepository.findById(booking.farmerId);
  const provider = providerRepository.findById(booking.providerId);
  const farmerUser = farmer ? userRepository.findById(farmer.userId) : null;
  const providerUser = provider ? userRepository.findById(provider.userId) : null;
  if (!farmerUser || !providerUser) {
    return { ok: false, error: "Conversation participants could not be found." };
  }

  const isFarmer = senderUserId === farmerUser.id;
  const isProvider = senderUserId === providerUser.id;
  if (!isFarmer && !isProvider) {
    return { ok: false, error: "Only the farmer and provider on this booking can send messages." };
  }

  const now = nowISO();
  const message = messageRepository.create({
    id: createId("msg"),
    bookingId,
    threadId: bookingId,
    senderUserId,
    recipientUserId: isFarmer ? providerUser.id : farmerUser.id,
    body: body.trim(),
    read: false,
    createdAt: now,
    updatedAt: now,
  });

  const recipient = userRepository.findById(message.recipientUserId);
  if (recipient) {
    notify({
      recipientUserId: recipient.id,
      type: "NEW_MESSAGE",
      title: "New message",
      message: `${userRepository.findById(senderUserId)?.name ?? "Someone"} sent you a message about booking ${booking.reference}.`,
      link: "/messages",
    });
  }

  return { ok: true, data: message };
}

function buildThread(bookingId: string): ThreadWithRelations | null {
  const booking = bookingRepository.findById(bookingId);
  if (!booking) return null;
  const farmer = farmerRepository.findById(booking.farmerId);
  const provider = providerRepository.findById(booking.providerId);
  const farmerUser = farmer ? userRepository.findById(farmer.userId) : null;
  const providerUser = provider ? userRepository.findById(provider.userId) : null;
  if (!farmerUser || !providerUser) return null;

  const messages = messageRepository
    .findWhere((message) => message.bookingId === bookingId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    threadId: bookingId,
    bookingId,
    booking,
    farmerUser,
    providerUser,
    messages,
    lastMessageAt: messages.length ? messages[messages.length - 1].createdAt : booking.createdAt,
    unreadCount: 0,
  };
}

export function listThreadsForUser(userId: string): ThreadWithRelations[] {
  hydrateDatabase();
  const farmer = farmerRepository.findOne((profile) => profile.userId === userId);
  const provider = providerRepository.findOne((profile) => profile.userId === userId);

  const bookingIds = new Set<string>();
  messageRepository.findAll().forEach((message) => {
    if (message.senderUserId === userId || message.recipientUserId === userId) {
      bookingIds.add(message.bookingId);
    }
  });
  bookingRepository.findAll().forEach((booking) => {
    if ((farmer && booking.farmerId === farmer.id) || (provider && booking.providerId === provider.id)) {
      bookingIds.add(booking.id);
    }
  });

  const threads: ThreadWithRelations[] = [];
  bookingIds.forEach((id) => {
    const thread = buildThread(id);
    if (!thread) return;
    threads.push({
      ...thread,
      unreadCount: thread.messages.filter(
        (message) => message.recipientUserId === userId && !message.read,
      ).length,
    });
  });

  return threads.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export function getThread(bookingId: string, userId: string): ThreadWithRelations | null {
  hydrateDatabase();
  const thread = buildThread(bookingId);
  if (!thread) return null;
  return {
    ...thread,
    unreadCount: thread.messages.filter(
      (message) => message.recipientUserId === userId && !message.read,
    ).length,
  };
}

export function markThreadRead(bookingId: string, userId: string): void {
  hydrateDatabase();
  messageRepository
    .findWhere((message) => message.bookingId === bookingId && message.recipientUserId === userId && !message.read)
    .forEach((message) => {
      messageRepository.update(message.id, { read: true });
    });
}

export function deleteMessage(messageId: string, userId: string): Result<boolean> {
  hydrateDatabase();
  const message = messageRepository.findById(messageId);
  if (!message) return { ok: false, error: "Message not found." };
  if (message.senderUserId !== userId) {
    return { ok: false, error: "You can only delete your own messages." };
  }
  messageRepository.delete(messageId);
  return { ok: true, data: true };
}
