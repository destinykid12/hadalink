import { Icon, type IconName } from "@/components/ui/Icon";

/** Standard screen states: loading, empty, error, and unauthorized. */

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-line bg-white px-6 py-12"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-line-strong border-t-primary" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  icon = "info",
  action,
}: {
  title: string;
  message: string;
  icon?: IconName;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-line bg-white px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sand-deep text-muted">
        <Icon name={icon} size={22} />
      </span>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-6 py-10 text-center"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-danger">
        <Icon name="alert" size={22} />
      </span>
      <h3 className="text-base font-semibold text-danger">{title}</h3>
      <p className="max-w-md text-sm text-ink-soft">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function UnauthorizedState({
  message = "You do not have permission to view this page.",
  action,
}: {
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-line bg-white px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sand-deep text-muted">
        <Icon name="shield" size={22} />
      </span>
      <h3 className="text-base font-semibold text-ink">Access denied</h3>
      <p className="max-w-md text-sm text-muted">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function NotFoundState({
  title = "Not found",
  message = "The record you are looking for does not exist or was removed.",
  action,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-line bg-white px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sand-deep text-muted">
        <Icon name="search" size={22} />
      </span>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="max-w-md text-sm text-muted">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function InlineNote({
  tone = "info",
  children,
}: {
  tone?: "info" | "warning" | "success";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-line bg-sand text-ink-soft",
    warning: "border-warning/30 bg-warning-soft text-warning",
    success: "border-primary/25 bg-primary-soft text-primary",
  } as const;
  return (
    <div
      role="note"
      className={`flex items-start gap-2 rounded-md border px-3.5 py-2.5 text-sm ${styles[tone]}`}
    >
      <Icon name={tone === "warning" ? "alert" : tone === "success" ? "check" : "info"} size={16} />
      <div>{children}</div>
    </div>
  );
}
