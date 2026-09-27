"use client";

/**
 * Data table with horizontal scroll on small screens.
 * On mobile, rows can be rendered as stacked cards instead (see features).
 */

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right";
  hideOnMobile?: boolean;
}

export function Table<T extends { id: string }>({
  columns,
  rows,
  caption,
  emptyMessage = "No records found.",
}: {
  columns: TableColumn<T>[];
  rows: T[];
  caption: string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white px-5 py-10 text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line bg-sand">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted ${
                    column.align === "right" ? "text-right" : "text-left"
                  } ${column.hideOnMobile ? "hidden lg:table-cell" : ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-b-0 hover:bg-sand/60">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 align-middle text-ink ${
                      column.align === "right" ? "text-right" : "text-left"
                    } ${column.hideOnMobile ? "hidden lg:table-cell" : ""}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
