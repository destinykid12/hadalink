"use client";

/**
 * Compare selection store (max 3 listings).
 * Selection persists in localStorage so it survives navigation and refresh.
 */

import { useSyncExternalStore } from "react";
import { hydrateDatabase } from "@/lib/db";
import { COMPARE_STORAGE_KEY } from "@/lib/db";
import { readJson, storageWrite } from "@/lib/storage";

export const COMPARE_LIMIT = 3;

function isStringArray(raw: unknown): raw is string[] {
  return Array.isArray(raw) && raw.every((item) => typeof item === "string");
}

const listeners = new Set<() => void>();
let cached: string[] | null = null;

function load(): string[] {
  if (cached) return cached;
  const outcome = readJson<string[]>(COMPARE_STORAGE_KEY, isStringArray);
  cached = outcome.ok && outcome.value ? outcome.value : [];
  return cached;
}

function save(next: string[]): void {
  cached = next;
  storageWrite(COMPARE_STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): string {
  return load().join(",");
}

export function getCompareIds(): string[] {
  return [...load()];
}

export function toggleCompare(listingId: string): { ok: boolean; message?: string } {
  hydrateDatabase();
  const current = load();
  if (current.includes(listingId)) {
    save(current.filter((id) => id !== listingId));
    return { ok: true };
  }
  if (current.length >= COMPARE_LIMIT) {
    return {
      ok: false,
      message: `You can compare up to ${COMPARE_LIMIT} listings at a time. Remove one first.`,
    };
  }
  save([...current, listingId]);
  return { ok: true };
}

export function removeCompare(listingId: string): void {
  save(load().filter((id) => id !== listingId));
}

export function clearCompare(): void {
  save([]);
}

export function useCompareIds(): string[] {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return getCompareIds();
}
