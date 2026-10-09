// Calendar helpers. All dates are ISO "YYYY-MM-DD" strings in UTC so they behave
// identically on the server and in the browser (no locale-dependent output).

export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Inclusive list of rental dates: eventDate, eventDate+1, ... (days entries). */
export function rentalDates(eventDate: string, days: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) out.push(addDaysIso(eventDate, i));
  return out;
}

/** Display format DD.MM.YYYY — identical in every language to avoid mixing scripts. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
