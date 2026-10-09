// Stock availability per rental day. A unit is "booked" on every day of a
// booking's rental window unless that booking is cancelled or completed.
import type { Booking, Product } from "./types";
import { rentalDates } from "./dates";

const NON_BLOCKING = new Set(["cancelled", "completed"]);

export function availableQty(
  product: Pick<Product, "id" | "stock">,
  bookings: Booking[],
  eventDate: string,
  days: number,
  ignoreBookingId?: string,
): number {
  const dates = rentalDates(eventDate, days);
  let worst = product.stock;
  for (const day of dates) {
    let booked = 0;
    for (const b of bookings) {
      if (NON_BLOCKING.has(b.status) || b.id === ignoreBookingId) continue;
      for (const line of b.lines) {
        if (line.productId !== product.id) continue;
        const lineDates = rentalDates(line.eventDate, line.days);
        if (lineDates.includes(day)) booked += line.qty;
      }
    }
    worst = Math.min(worst, product.stock - booked);
  }
  return Math.max(0, worst);
}
