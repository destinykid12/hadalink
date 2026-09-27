"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StorageHealthNotice } from "@/components/layout/StorageHealthNotice";
import { useUnreadNotifications } from "@/hooks/useListings";
import type { User } from "@/types/models";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  match?: (pathname: string) => boolean;
}

export function DashboardShell({
  user,
  title,
  subtitle,
  nav,
  children,
}: {
  user: User;
  title?: string;
  subtitle?: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const unread = useUnreadNotifications(user.id);

  const isActive = (item: NavItem) =>
    item.match ? item.match(pathname) : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 border-r border-line bg-white lg:block">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col">
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <Avatar name={user.name} src={user.avatar} size={40} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                <p className="text-xs text-muted">{user.role}</p>
              </div>
            </div>
            <nav aria-label="Dashboard navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(item)
                      ? "bg-primary-soft text-primary"
                      : "text-ink-soft hover:bg-sand-deep hover:text-ink"
                  }`}
                >
                  <Icon name={item.icon} size={18} />
                  {item.label}
                  {item.href === "/notifications" && unread > 0 ? (
                    <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  ) : null}
                </Link>
              ))}
            </nav>
            <div className="border-t border-line px-5 py-4">
              <p className="text-xs leading-relaxed text-muted">
                Simulated prototype session. Data is stored in this browser only.
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 pb-24 lg:pb-10">
          <div className="page-shell py-6">
            <StorageHealthNotice />
            {title ? (
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>

      {/* Bottom navigation (mobile) */}
      <nav
        aria-label="Dashboard navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white lg:hidden"
      >
        <ul className="flex items-stretch justify-around">
          {nav.slice(0, 5).map((item) => (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive(item) ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                  isActive(item) ? "text-primary" : "text-muted"
                }`}
              >
                <Icon name={item.icon} size={20} />
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
