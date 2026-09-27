"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Icon } from "@/components/ui/Icon";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { searchUsers, setUserStatus } from "@/services/adminService";
import { useToast } from "@/components/ui/Toast";
import type { User, UserStatus } from "@/types/models";
import { formatDate } from "@/lib/dates";

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const hydrated = useHydration();
  useDatabase();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const users = useMemo(() => searchUsers(query, role, status), [query, role, status]);

  if (!hydrated) return <LoadingState label="Loading users..." />;

  const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const visible = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleStatus = (user: User) => {
    const next: UserStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const result = setUserStatus(user.id, next);
    if (result.ok) {
      toast.success(
        next === "SUSPENDED" ? "User suspended" : "User reactivated",
        `${user.name} is now ${next.toLowerCase()}.`,
      );
    } else {
      toast.error("Action failed", result.error);
    }
  };

  const columns: TableColumn<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) => (
        <div>
          <Link href={`/admin/users/${user.id}`} className="font-medium text-ink hover:text-primary">
            {user.name}
          </Link>
          <p className="text-xs text-muted">{user.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <Badge tone={user.role === "ADMIN" ? "soft" : user.role === "PROVIDER" ? "green" : "blue"}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      hideOnMobile: true,
      render: (user) => <span className="text-ink-soft">{user.phone}</span>,
    },
    {
      key: "location",
      header: "Location",
      hideOnMobile: true,
      render: (user) => <span className="text-ink-soft">{user.location}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <Badge tone={user.status === "ACTIVE" ? "green" : "red"}>{user.status}</Badge>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      hideOnMobile: true,
      render: (user) => <span className="text-xs text-muted">{formatDate(user.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (user) => (
        <div className="flex justify-end gap-1.5">
          <Link href={`/admin/users/${user.id}`} aria-label={`View ${user.name}`}>
            <Button variant="ghost" size="sm" icon="search" />
          </Link>
          {user.role !== "ADMIN" ? (
            <Button
              variant={user.status === "ACTIVE" ? "danger" : "outline"}
              size="sm"
              onClick={() => toggleStatus(user)}
            >
              {user.status === "ACTIVE" ? "Suspend" : "Reactivate"}
            </Button>
          ) : (
            <span className="text-xs text-muted">Admin</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Users</h1>
        <p className="mt-1 text-sm text-muted">
          Search, filter, review, suspend, reactivate, or delete user accounts.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="user-search" className="text-sm font-medium text-ink">
            Search users
          </label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <Icon name="search" size={16} />
            </span>
            <input
              id="user-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Name, email, phone, or location"
              className="h-10 w-full rounded-md border border-line-strong bg-white pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <Select
          label="Role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          options={[
            { value: "ALL", label: "All roles" },
            { value: "FARMER", label: "Farmers" },
            { value: "PROVIDER", label: "Providers" },
            { value: "ADMIN", label: "Admins" },
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          options={[
            { value: "ALL", label: "All statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "SUSPENDED", label: "Suspended" },
          ]}
        />
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {users.length} user{users.length === 1 ? "" : "s"} found
      </p>

      {users.length === 0 ? (
        <EmptyState
          icon="user"
          title="No users found"
          message="Try a different search term or filter."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setRole("ALL");
                setStatus("ALL");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <Table columns={columns} rows={visible} caption="Platform users" />
          <Pagination page={page} pageCount={pageCount} onChange={setPage} label="User pages" />
        </>
      )}
    </div>
  );
}
