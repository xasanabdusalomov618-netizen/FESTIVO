"use client";

import type { BookingStatus } from "@/lib/types";
import { useLang } from "@/i18n/LanguageProvider";

const TONE: Record<BookingStatus, string> = {
  pending: "badge-blue",
  confirmed: "badge-green",
  delivering: "badge-blue",
  installed: "badge-green",
  completed: "badge-neutral",
  cancelled: "badge-red",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useLang();
  return (
    <span className={`badge badge-dot ${TONE[status]}`} data-status={status}>
      {t(`status.${status}`)}
    </span>
  );
}
