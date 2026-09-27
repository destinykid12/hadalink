"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications } from "@/hooks/useListings";
import { DEMO_ACCOUNTS } from "@/services/demoService";
import { userRepository } from "@/repositories";

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="HadaLink home">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
        <Icon name="tractor" size={20} />
      </span>
      {!compact ? (
        <span className="text-lg font-bold tracking-tight text-ink">
          Hada<span className="text-primary">Link</span>
        </span>
      ) : null}
    </Link>
  );
}

export function SiteHeader() {
  const { user, logout, loginAs } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const unread = useUnreadNotifications(user?.id ?? "");

  const closeMenus = () => {
    setMenuOpen(false);
    setMobileOpen(false);
  };

  const dashboardHref = user
    ? user.role === "ADMIN"
      ? "/admin"
      : user.role === "PROVIDER"
        ? "/provider"
        : "/dashboard"
    : "/login";

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      onClick={closeMenus}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        pathname === href
          ? "bg-primary-soft text-primary"
          : "text-ink-soft hover:bg-sand-deep hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            {navLink("/equipment", "Find Equipment")}
            {navLink("/services", "Find Services")}
            {navLink("/how-it-works", "How it works")}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link
                href="/messages"
                aria-label="Messages"
                className="rounded-md p-2 text-ink-soft hover:bg-sand-deep hover:text-ink"
              >
                <Icon name="message" size={20} />
              </Link>
              <Link
                href="/notifications"
                aria-label={`Notifications, ${unread} unread`}
                className="relative rounded-md p-2 text-ink-soft hover:bg-sand-deep hover:text-ink"
              >
                <Icon name="bell" size={20} />
                {unread > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5 hover:bg-sand-deep"
                >
                  <Avatar name={user.name} src={user.avatar} size={28} />
                  <span className="max-w-[120px] truncate text-sm font-medium text-ink">{user.name}</span>
                  <Icon name="chevron-down" size={14} />
                </button>
                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-12 w-64 rounded-lg border border-line bg-white p-2 shadow-pop"
                  >
                    <div className="border-b border-line px-3 py-2">
                      <p className="text-sm font-semibold text-ink">{user.name}</p>
                      <p className="text-xs text-muted">{user.email}</p>
                      <Badge tone="soft" className="mt-1">
                        {user.role}
                      </Badge>
                    </div>
                    <Link
                      role="menuitem"
                      href={dashboardHref}
                      onClick={closeMenus}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-sand-deep"
                    >
                      <Icon name="home" size={16} /> My dashboard
                    </Link>
                    <Link
                      role="menuitem"
                      href="/notifications"
                      onClick={closeMenus}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-sand-deep"
                    >
                      <Icon name="bell" size={16} /> Notifications
                    </Link>
                    <Link
                      role="menuitem"
                      href="/messages"
                      onClick={closeMenus}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-sand-deep"
                    >
                      <Icon name="message" size={16} /> Messages
                    </Link>
                    <Link
                      role="menuitem"
                      href={user.role === "PROVIDER" ? "/provider/profile" : "/dashboard/profile"}
                      onClick={closeMenus}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-sand-deep"
                    >
                      <Icon name="user" size={16} /> Profile settings
                    </Link>
                    {user.role === "ADMIN" ? (
                      <Link
                        role="menuitem"
                        href="/admin/settings"
                        onClick={closeMenus}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-sand-deep"
                      >
                        <Icon name="settings" size={16} /> Platform settings
                      </Link>
                    ) : null}
                    <div className="my-1 border-t border-line" />
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Demo: switch role
                    </p>
                    <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                      {DEMO_ACCOUNTS.map((account) => {
                        const demoUser = userRepository.findOne((candidate) => candidate.email === account.email);
                        return (
                          <button
                            key={account.role}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              if (demoUser) {
                                loginAs(demoUser.id);
                                router.push(
                                  account.role === "ADMIN"
                                    ? "/admin"
                                    : account.role === "PROVIDER"
                                      ? "/provider"
                                      : "/dashboard",
                                );
                                setMenuOpen(false);
                              }
                            }}
                            className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                              user.role === account.role
                                ? "border-primary bg-primary-soft text-primary"
                                : "border-line text-ink-soft hover:bg-sand-deep"
                            }`}
                          >
                            {account.role === "FARMER"
                              ? "Farmer"
                              : account.role === "PROVIDER"
                                ? "Provider"
                                : "Admin"}
                          </button>
                        );
                      })}
                    </div>
                    <div className="my-1 border-t border-line" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger hover:bg-danger-soft"
                    >
                      <Icon name="logout" size={16} /> Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Create account
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 md:hidden">
          {user ? (
            <Link
              href="/notifications"
              aria-label={`Notifications, ${unread} unread`}
              className="relative rounded-md p-2 text-ink-soft"
            >
              <Icon name="bell" size={20} />
              {unread > 0 ? (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
              ) : null}
            </Link>
          ) : null}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-md p-2 text-ink"
          >
            <Icon name={mobileOpen ? "close" : "menu"} size={22} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen ? (
        <nav aria-label="Mobile navigation" className="border-t border-line bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navLink("/equipment", "Find Equipment")}
            {navLink("/services", "Find Services")}
            {navLink("/how-it-works", "How it works")}
            {user ? (
              <>
                {navLink(dashboardHref, "My dashboard")}
                {navLink("/messages", "Messages")}
                {navLink(
                  user.role === "PROVIDER" ? "/provider/profile" : "/dashboard/profile",
                  "Profile settings",
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger-soft"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" fullWidth size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <Button variant="primary" fullWidth size="sm">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
