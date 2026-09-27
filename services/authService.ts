/**
 * Simulated authentication service.
 * Production note: every rule here must be enforced server-side once a
 * real backend exists. Local role checks are UX only.
 */

import { hydrateDatabase, mutate, SESSION_STORAGE_KEY } from "@/lib/db";
import { createId } from "@/lib/ids";
import { nowISO } from "@/lib/dates";
import { readJson, storageRemove, storageWrite } from "@/lib/storage";
import {
  farmerRepository,
  providerRepository,
  userRepository,
} from "@/repositories";
import type { Result, Role, Session, User } from "@/types/models";

function isSession(raw: unknown): raw is Session {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  return typeof candidate.userId === "string" && typeof candidate.startedAt === "string";
}

export function readSession(): Session | null {
  const outcome = readJson<Session>(SESSION_STORAGE_KEY, isSession);
  return outcome.ok ? outcome.value : null;
}

export function getCurrentUser(): User | null {
  hydrateDatabase();
  const session = readSession();
  if (!session) return null;
  const user = userRepository.findById(session.userId);
  if (!user || user.status === "SUSPENDED") return null;
  return user;
}

export interface SignupInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  location: string;
  role: Extract<Role, "FARMER" | "PROVIDER">;
  farmName?: string;
  farmSize?: number;
  farmLocation?: string;
  businessName?: string;
  description?: string;
}

export function signup(input: SignupInput): Result<User> {
  hydrateDatabase();
  const email = input.email.trim().toLowerCase();
  const existing = userRepository.findOne((user) => user.email.toLowerCase() === email);
  if (existing) {
    return { ok: false, error: "An account with this email already exists. Try logging in instead." };
  }

  const now = nowISO();
  const user: User = {
    id: createId("usr"),
    role: input.role,
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    // Simulated credential storage. Replace with hashed server auth later.
    password: input.password,
    location: input.location.trim(),
    avatar: "/images/farm-scene.jpg",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  userRepository.create(user);

  if (input.role === "FARMER") {
    farmerRepository.create({
      id: createId("frm"),
      userId: user.id,
      farmName: input.farmName?.trim() || `${input.name.trim()}'s Farm`,
      farmSize: input.farmSize ?? 0,
      farmLocation: input.farmLocation?.trim() || input.location.trim(),
      preferredServices: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  if (input.role === "PROVIDER") {
    providerRepository.create({
      id: createId("prv"),
      userId: user.id,
      businessName: input.businessName?.trim() || input.name.trim(),
      description: input.description?.trim() || "",
      verificationStatus: "UNSUBMITTED",
      rating: 0,
      reviewCount: 0,
      completedJobs: 0,
      serviceAreas: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  storageWrite(SESSION_STORAGE_KEY, JSON.stringify({ userId: user.id, startedAt: now }));
  return { ok: true, data: user };
}

export function login(email: string, password: string): Result<User> {
  hydrateDatabase();
  const user = userRepository.findOne(
    (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!user || user.password !== password) {
    return { ok: false, error: "Email or password is incorrect." };
  }
  if (user.status === "SUSPENDED") {
    return {
      ok: false,
      error: "This account is suspended. Contact the HadaLink team if you think this is a mistake.",
    };
  }
  storageWrite(
    SESSION_STORAGE_KEY,
    JSON.stringify({ userId: user.id, startedAt: nowISO() } satisfies Session),
  );
  return { ok: true, data: user };
}

export function loginAs(userId: string): Result<User> {
  hydrateDatabase();
  const user = userRepository.findById(userId);
  if (!user) return { ok: false, error: "Demo account not found." };
  if (user.status === "SUSPENDED") return { ok: false, error: "This demo account is suspended." };
  storageWrite(
    SESSION_STORAGE_KEY,
    JSON.stringify({ userId: user.id, startedAt: nowISO() } satisfies Session),
  );
  return { ok: true, data: user };
}

export function logout(): void {
  storageRemove(SESSION_STORAGE_KEY);
}

/** Centralized role gate. UI hides links, this blocks actions. */
export function hasRole(user: User | null, roles: Role[]): boolean {
  return !!user && roles.includes(user.role);
}

export function requireRole(user: User | null, roles: Role[]): Result<User> {
  if (!user) return { ok: false, error: "Please log in to continue." };
  if (!roles.includes(user.role)) {
    return { ok: false, error: "You do not have permission to perform this action." };
  }
  return { ok: true, data: user };
}

export function currentUserSnapshot(): User | null {
  return getCurrentUser();
}

/** Used by admin service to keep demo switching coherent. */
export function touchUser(userId: string): void {
  mutate(() => {
    userRepository.update(userId, {});
  });
}
