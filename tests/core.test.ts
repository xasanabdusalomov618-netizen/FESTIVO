import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { en } from "../src/i18n/en";
import { ru } from "../src/i18n/ru";
import { uz } from "../src/i18n/uz";
import { dictionaries, translate } from "../src/i18n";
import { ERROR_CODES } from "../src/lib/errors";
import { BOOKING_STATUSES } from "../src/lib/types";
import { priceLine, formatMoney, sumTotals } from "../src/lib/pricing";
import { availableQty } from "../src/lib/availability";
import { normalizePhone } from "../src/lib/validation";
import { rentalDates, addDaysIso } from "../src/lib/dates";
import { createSeedDatabase } from "../src/lib/seed";
import { verifyPassword, hashPassword } from "../src/lib/password";

/** Collect every leaf key path of a dictionary object. */
function leafKeys(obj: unknown, prefix = ""): string[] {
  if (typeof obj === "string") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => leafKeys(v, prefix ? `${prefix}.${k}` : k));
}

describe("translation dictionaries", () => {
  it("UZ, RU and EN define exactly the same keys", () => {
    const base = leafKeys(en).sort();
    assert.deepEqual(leafKeys(uz).sort(), base);
    assert.deepEqual(leafKeys(ru).sort(), base);
  });

  it("no translated value is empty", () => {
    for (const d of [en, ru, uz]) {
      for (const key of leafKeys(d)) {
        const value = key.split(".").reduce<any>((n, p) => n[p], d);
        assert.ok(value.trim().length > 0, `empty value for ${key}`);
      }
    }
  });

  it("every API error code has a message in every language", () => {
    for (const code of ERROR_CODES) {
      for (const lang of ["uz", "ru", "en"] as const) {
        assert.notEqual(translate(lang, `err.${code}`), `err.${code}`, `${lang} missing err.${code}`);
      }
    }
  });

  it("every booking status has a label in every language", () => {
    for (const s of BOOKING_STATUSES) {
      for (const lang of ["uz", "ru", "en"] as const) {
        assert.notEqual(translate(lang, `status.${s}`), `status.${s}`);
      }
    }
  });

  it("required brand copy matches the specification", () => {
    assert.equal(uz.home.headline, "TADBIRINGIZNI 10 DAQIQADA YIG'ING");
    assert.equal(ru.home.headline, "ОРГАНИЗУЙТЕ МЕРОПРИЯТИЕ ЗА 10 МИНУТ");
    assert.equal(en.home.headline, "PLAN YOUR EVENT IN 10 MINUTES");
    assert.equal(uz.nav.browse, "Jihozlarni ko'rish");
    assert.equal(ru.nav.plan, "Планировать мероприятие");
    assert.equal(en.catalog.addToCart, "Add to Cart");
    assert.equal(uz.nav.home, "Bosh sahifa");
    assert.equal(ru.nav.bookings, "Мои заказы");
    assert.equal(en.nav.delivery, "Delivery");
    assert.equal(ru.catalog.addToCart, "Добавить в корзину");
  });

  it("translate() fills placeholders and falls back safely", () => {
    assert.equal(translate("en", "catalog.results", { count: 3 }), "3 items");
    assert.equal(dictionaries.ru.nav.home, "Главная");
  });
});

describe("pricing", () => {
  const product = { pricePerDay: 1_200_000, deliveryFee: 250_000, installFee: 350_000, installable: true };

  it("rental is price x qty x days", () => {
    const p = priceLine(product, { qty: 2, days: 3, delivery: false, installation: false });
    assert.equal(p.rentalTotal, 7_200_000);
    assert.equal(p.lineTotal, 7_200_000);
  });

  it("adds delivery (flat) and installation (per unit) when selected", () => {
    const p = priceLine(product, { qty: 2, days: 1, delivery: true, installation: true });
    assert.equal(p.deliveryTotal, 250_000);
    assert.equal(p.installationTotal, 700_000);
    assert.equal(p.lineTotal, 2_400_000 + 250_000 + 700_000);
  });

  it("ignores installation for non-installable items", () => {
    const p = priceLine({ ...product, installable: false }, { qty: 1, days: 1, delivery: false, installation: true });
    assert.equal(p.installationTotal, 0);
  });

  it("sums multiple lines", () => {
    const a = priceLine(product, { qty: 1, days: 1, delivery: true, installation: false });
    const t = sumTotals([a, a]);
    assert.equal(t.total, 2 * (1_200_000 + 250_000));
  });

  it("formats UZS with space separators", () => {
    assert.equal(formatMoney(1234567), "1 234 567");
    assert.equal(formatMoney(0), "0");
  });
});

describe("availability", () => {
  const db = createSeedDatabase(new Date("2026-10-09T00:00:00Z"));
  const tent = db.products.find((p) => p.id === "p-white-tent")!; // stock 4

  it("full stock when there are no bookings", () => {
    assert.equal(availableQty(tent, [], "2026-11-01", 2), 4);
  });

  it("subtracts overlapping booked units", () => {
    const bookings = [{ ...db.bookings[0], status: "confirmed" as const }];
    // FV-1001 books 1 tent on the day it starts (today+6) for 2 days
    const start = bookings[0].lines[0].eventDate;
    assert.equal(availableQty(tent, bookings, start, 1), 3);
    assert.equal(availableQty(tent, bookings, addDaysIso(start, 5), 1), 4);
  });

  it("cancelled bookings free stock again", () => {
    const bookings = [{ ...db.bookings[0], status: "cancelled" as const }];
    assert.equal(availableQty(tent, bookings, bookings[0].lines[0].eventDate, 1), 4);
  });

  it("rental window covers the requested number of days", () => {
    assert.deepEqual(rentalDates("2026-12-30", 3), ["2026-12-30", "2026-12-31", "2027-01-01"]);
  });
});

describe("validation and security helpers", () => {
  it("normalises Uzbekistan phone numbers", () => {
    assert.equal(normalizePhone("+998 90 123 45 67"), "+998901234567");
    assert.equal(normalizePhone("901234567"), "+998901234567");
    assert.equal(normalizePhone("998 90 123 45 67"), "+998901234567");
    assert.equal(normalizePhone("12345"), null);
    assert.equal(normalizePhone("+7 999 123 45 67"), null);
  });

  it("hashes and verifies passwords", () => {
    const { hash, salt } = hashPassword("secret1");
    assert.equal(verifyPassword("secret1", hash, salt), true);
    assert.equal(verifyPassword("wrong", hash, salt), false);
  });

  it("seed database contains demo accounts for every role", () => {
    const db = createSeedDatabase();
    assert.deepEqual(db.users.map((u) => u.role).sort(), ["admin", "customer", "vendor", "vendor"]);
    assert.ok(db.products.length >= 12);
    assert.ok(db.categories.length >= 6);
  });
});
