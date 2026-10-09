"use client";

import { useLang } from "@/i18n/LanguageProvider";

export function Money({ amount, suffix }: { amount: number; suffix?: string }) {
  const { money, currency } = useLang();
  return (
    <span className="money">
      {money(amount)} {currency}
      {suffix ? <small>{suffix}</small> : null}
    </span>
  );
}
