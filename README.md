# FESTIVO

Event equipment marketplace (tents, furniture, sound, lighting, decor, catering, climate) with
Uzbek (default), Russian and English interfaces. Customers browse and book equipment with delivery and
installation; vendors manage their orders; admins manage users, vendors and products.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- JSON file store (`data/festivo-db.json`, created automatically from seed data on first run; override with `FESTIVO_DB_PATH`)
- No external services or fonts required

## Run

```bash
npm install
npm run dev          # development server on port 3000
npm run build && npm start   # production server on port 3000
npm run typecheck
npm test             # unit tests: translations, pricing, availability, validation
```

## Demo accounts

| Role     | Email               | Password    |
|----------|---------------------|-------------|
| Admin    | admin@festivo.uz    | admin123    |
| Vendor   | vendor1@festivo.uz  | vendor123   |
| Vendor   | vendor2@festivo.uz  | vendor123   |
| Customer | customer@festivo.uz | customer123 |

## Notes

- Language is chosen with the UZ | RU | EN switcher in the header, stored in the `festivo_lang` cookie
  (for server rendering) and in `localStorage` (`festivo.lang`).
- Translation dictionaries live in `src/i18n/` (`en.ts` is the source of truth; `uz.ts` and `ru.ts` must have
  the same keys, enforced by `npm test`).
- Cart is kept in `localStorage` (`festivo.cart.v1`).
