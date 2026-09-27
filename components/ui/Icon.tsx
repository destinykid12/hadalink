/**
 * Small inline icon set. Deliberately restrained: only icons the product
 * actually needs, drawn as simple strokes.
 */

export type IconName =
  | "search"
  | "bell"
  | "user"
  | "menu"
  | "close"
  | "chevron-down"
  | "chevron-right"
  | "chevron-left"
  | "check"
  | "star"
  | "pin"
  | "calendar"
  | "tractor"
  | "bookmark"
  | "message"
  | "filter"
  | "plus"
  | "edit"
  | "trash"
  | "alert"
  | "info"
  | "home"
  | "logout"
  | "shield"
  | "chart"
  | "settings"
  | "arrow-right"
  | "arrow-left"
  | "wallet"
  | "clock"
  | "compare"
  | "tools"
  | "send"
  | "image";

const paths: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  check: <path d="m5 13 4 4 10-10" />,
  star: (
    <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6L12 16.8 6.6 19.6l1-6L3.3 9.4l6-.9L12 3Z" />
  ),
  pin: (
    <>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
    </>
  ),
  tractor: (
    <>
      <circle cx="7" cy="16.5" r="3.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M10.5 16.5h4.5M4 13h3l2-5h5l2 4h3.5M9 8V5h4" />
    </>
  ),
  bookmark: <path d="M6 4h12v17l-6-4.5L6 21V4Z" />,
  message: <path d="M4 5h16v11H9l-5 4V5Z" />,
  filter: <path d="M4 5h16l-6.5 7.5V20l-3-2v-5.5L4 5Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20h4L20 8l-4-4L4 16v4Zm9-13 4 4" />,
  trash: <path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13" />,
  alert: (
    <>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v5M12 17.5v.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8v.5" />
    </>
  ),
  home: <path d="m4 11 8-7 8 7v9h-5v-6h-6v6H4v-9Z" />,
  logout: <path d="M15 5H6v14h9M18 12H10m5-4 4 4-4 4" />,
  shield: <path d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Z" />,
  chart: <path d="M4 20V10m5 10V4m5 16v-7m5 7V8" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.9 6.1l-1.5 1.5M7.6 16.4l-1.5 1.5M17.9 17.9l-1.5-1.5M7.6 7.6 6.1 6.1" />
    </>
  ),
  "arrow-right": <path d="M4 12h16m-6-6 6 6-6 6" />,
  "arrow-left": <path d="M20 12H4m6-6-6 6 6 6" />,
  wallet: (
    <>
      <rect x="3.5" y="6.5" width="17" height="12.5" rx="2" />
      <path d="M3.5 10h17M16 14.5h1.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2.5" />
    </>
  ),
  compare: <path d="M8 4v16M16 4v16M4 8h8M12 16h8" />,
  tools: <path d="m14.5 6.5 3-3a4 4 0 0 1-5 5l-7 7a2 2 0 1 0 3 3l7-7a4 4 0 0 0 5-5l-3 3-2-2Z" />,
  send: <path d="M4 12 20 4l-4 16-4-6-8-2Zm8 2 8-10" />,
  image: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m5 17 5-5 3 3 3-2 3 4" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  className = "",
  filled = false,
}: {
  name: IconName;
  size?: number;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
