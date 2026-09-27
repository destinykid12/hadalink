"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  login as loginService,
  loginAs as loginAsService,
  logout as logoutService,
  signup as signupService,
  type SignupInput,
} from "@/services/authService";
import type { Result, User } from "@/types/models";

/**
 * Authentication state hook.
 * Simulated auth: the session lives in localStorage and survives refresh.
 * State is kept in an external store so React reads it via
 * useSyncExternalStore (no effect-driven state updates).
 */

let cachedUser: User | null | undefined = undefined;
const listeners = new Set<() => void>();

function readUser(): User | null {
  if (cachedUser === undefined) {
    cachedUser = getCurrentUser();
  }
  return cachedUser;
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): User | null {
  return readUser();
}

function getServerSnapshot(): User | null {
  return null;
}

function setCachedUser(user: User | null): void {
  cachedUser = user;
  emit();
}

/** Called after local database resets so the cached session re-reads. */
export function invalidateAuthCache(): void {
  cachedUser = undefined;
  emit();
}

export function useAuth() {
  const router = useRouter();
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const login = useCallback((email: string, password: string): Result<User> => {
    const result = loginService(email, password);
    if (result.ok) setCachedUser(result.data);
    return result;
  }, []);

  const loginAs = useCallback((userId: string): Result<User> => {
    const result = loginAsService(userId);
    if (result.ok) setCachedUser(result.data);
    return result;
  }, []);

  const signup = useCallback((input: SignupInput): Result<User> => {
    const result = signupService(input);
    if (result.ok) setCachedUser(result.data);
    return result;
  }, []);

  const logout = useCallback(() => {
    logoutService();
    setCachedUser(null);
    router.push("/");
    router.refresh();
  }, [router]);

  const refresh = useCallback(() => {
    setCachedUser(getCurrentUser());
  }, []);

  return { user, loading: false, login, loginAs, signup, logout, refresh };
}
