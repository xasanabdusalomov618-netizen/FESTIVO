// Initial catalogue and demo accounts. Written to data/festivo-db.json on first run.
import type { Booking, BookingLine, Category, Database, Product, User, Vendor, LText } from "./types";
import { hashPassword } from "./password";
import { priceLine, sumTotals } from "./pricing";
import { addDaysIso, todayIso } from "./dates";

const t = (uz: string, ru: string, en: string): LText => ({ uz, ru, en });

export const SEED_VENDORS: Vendor[] = [
  { id: "v-shamiyana", name: "Shamiyana Pro", city: t("Toshkent", "Ташкент", "Tashkent"), rating: 4.8 },
  { id: "v-soundlight", name: "SoundLight UZ", city: t("Samarqand", "Самарканд", "Samarkand"), rating: 4.6 },
];

export const SEED_CATEGORIES: Category[] = [
  {
    id: "tents",
    icon: "tent",
    name: t("Shamiyana va chodirlar", "Шатры и навесы", "Tents & Canopies"),
    description: t("Ochiq havodagi tadbirlar uchun", "Для мероприятий на открытом воздухе", "For outdoor events"),
  },
  {
    id: "furniture",
    icon: "armchair",
    name: t("Mebel", "Мебель", "Furniture"),
    description: t("Stullar, stollar va divanlar", "Стулья, столы и диваны", "Chairs, tables and sofas"),
  },
  {
    id: "sound",
    icon: "speaker",
    name: t("Ovoz va musiqa", "Звук и музыка", "Sound & Music"),
    description: t("Tizimlar, mikrofonlar, DJ jihozlari", "Системы, микрофоны, DJ-оборудование", "Systems, microphones, DJ gear"),
  },
  {
    id: "lighting",
    icon: "lightbulb",
    name: t("Yoritish va ekranlar", "Освещение и экраны", "Lighting & Screens"),
    description: t("Sahna yoritgichlari va LED ekranlar", "Сценические прожекторы и LED-экраны", "Stage lights and LED screens"),
  },
  {
    id: "decor",
    icon: "flower",
    name: t("Dekor va bezak", "Декор и оформление", "Decor & Styling"),
    description: t("Gul arkalar, lyustralar, bezak", "Арки, люстры, декор", "Arches, chandeliers, styling"),
  },
  {
    id: "catering",
    icon: "utensils",
    name: t("Oshxona va servirovka", "Кейтеринг и сервировка", "Catering & Tableware"),
    description: t("Dasturxon, chafing dish va boshqalar", "Скатерти, мармиты и другое", "Linens, chafing dishes and more"),
  },
  {
    id: "climate",
    icon: "thermometer",
    name: t("Isitish va sovutish", "Обогрев и охлаждение", "Heating & Cooling"),
    description: t("Isitgichlar va ventilyatorlar", "Обогреватели и вентиляторы", "Heaters and fans"),
  },
];

type ProductSeed = Omit<Product, "createdAt" | "active"> & { active?: boolean };

const PRODUCT_SEEDS: ProductSeed[] = [
  {
    id: "p-white-tent",
    slug: "white-party-tent-6x12",
    categoryId: "tents",
    vendorId: "v-shamiyana",
    name: t("Oq shamiyana 6x12 m", "Белый шатёр 6x12 м", "White Party Tent 6x12 m"),
    description: t(
      "To'y va bayram uchun kengaytirilgan oq shamiyana. Yomg'irdan himoya, 150 kishigacha.",
      "Просторный белый шатёр для свадеб и праздников. Защита от дождя, до 150 гостей.",
      "Spacious white marquee for weddings and celebrations. Rain protection, up to 150 guests.",
    ),
    pricePerDay: 1200000,
    stock: 4,
    deliveryFee: 250000,
    installFee: 350000,
    installable: true,
    featured: true,
  },
  {
    id: "p-clear-tent",
    slug: "clear-span-tent-4x8",
    categoryId: "tents",
    vendorId: "v-shamiyana",
    name: t("Shaffof shamiyana 4x8 m", "Прозрачный шатёр 4x8 м", "Clear Span Tent 4x8 m"),
    description: t(
      "Panoramali ko'rinish uchun shaffof tomli shamiyana. 60 kishigacha.",
      "Прозрачный шатёр с панорамным видом. До 60 гостей.",
      "Transparent-roof tent with panoramic views. Up to 60 guests.",
    ),
    pricePerDay: 850000,
    stock: 3,
    deliveryFee: 220000,
    installFee: 280000,
    installable: true,
    featured: false,
  },
  {
    id: "p-chiavari",
    slug: "gold-chiavari-chair",
    categoryId: "furniture",
    vendorId: "v-shamiyana",
    name: t("Oltin Chiavari stul", "Стул Кьявари (золото)", "Gold Chiavari Chair"),
    description: t(
      "Yengil alyuminiy karkasli, zamonaviy oltin rangli stul. Narx donasi uchun.",
      "Лёгкий золотистый стул с алюминиевым каркасом. Цена за штуку.",
      "Lightweight gold chair with aluminum frame. Priced per piece.",
    ),
    pricePerDay: 15000,
    stock: 200,
    deliveryFee: 80000,
    installFee: 0,
    installable: false,
    featured: true,
  },
  {
    id: "p-round-table",
    slug: "round-banquet-table-180",
    categoryId: "furniture",
    vendorId: "v-shamiyana",
    name: t("Dumaloq ziyofat stoli 180 sm", "Круглый банкетный стол 180 см", "Round Banquet Table 180 cm"),
    description: t(
      "10 kishilik dumaloq stol, oq matoli. Narx donasi uchun.",
      "Круглый стол на 10 гостей с белой скатертью. Цена за стол.",
      "Round table for 10 guests with white cover. Priced per table.",
    ),
    pricePerDay: 40000,
    stock: 40,
    deliveryFee: 80000,
    installFee: 0,
    installable: false,
    featured: false,
  },
  {
    id: "p-lounge",
    slug: "lounge-sofa-set-5",
    categoryId: "furniture",
    vendorId: "v-shamiyana",
    name: t("Lounge divan to'plami (5 o'rinli)", "Лаунж-комплект (диван, 5 мест)", "Lounge Sofa Set (5 seats)"),
    description: t(
      "Yumshoq divan va kofe stoli. VIP zona uchun.",
      "Мягкий диван и журнальный столик. Для VIP-зоны.",
      "Soft sofa set with coffee table. Ideal for VIP areas.",
    ),
    pricePerDay: 650000,
    stock: 2,
    deliveryFee: 200000,
    installFee: 120000,
    installable: true,
    featured: false,
  },
  {
    id: "p-pa-system",
    slug: "portable-pa-system-2000w",
    categoryId: "sound",
    vendorId: "v-soundlight",
    name: t("Portativ ovoz tizimi 2000 Vt", "Портативная акустика 2000 Вт", "Portable PA System 2000 W"),
    description: t(
      "Ikki kolonkali, Bluetooth va USB bilan. 300 kishilik zal uchun.",
      "Двухколоночная система с Bluetooth и USB. Для залов до 300 мест.",
      "Two-speaker system with Bluetooth and USB. For halls up to 300 people.",
    ),
    pricePerDay: 500000,
    stock: 5,
    deliveryFee: 150000,
    installFee: 150000,
    installable: true,
    featured: true,
  },
  {
    id: "p-wireless-mics",
    slug: "wireless-microphone-set-4",
    categoryId: "sound",
    vendorId: "v-soundlight",
    name: t("Simsiz mikrofon to'plami (4 ta)", "Набор беспроводных микрофонов (4 шт.)", "Wireless Microphone Set (4 pcs)"),
    description: t(
      "Nutq va qo'shiq uchun 4 ta simsiz mikrofon, qabul qilgich bilan.",
      "4 беспроводных микрофона с приёмником для речей и выступлений.",
      "Four wireless microphones with receiver for speeches and performances.",
    ),
    pricePerDay: 220000,
    stock: 6,
    deliveryFee: 60000,
    installFee: 0,
    installable: false,
    featured: false,
  },
  {
    id: "p-dj-console",
    slug: "dj-console-controller",
    categoryId: "sound",
    vendorId: "v-soundlight",
    name: t("DJ pult va kontroller", "DJ-пульт и контроллер", "DJ Console & Controller"),
    description: t(
      "Ikki kanalli DJ pult, effektlar va ulanish kabellari bilan.",
      "Двухканальный DJ-пульт с эффектами и кабелями.",
      "Two-channel DJ console with effects and cables included.",
    ),
    pricePerDay: 380000,
    stock: 2,
    deliveryFee: 120000,
    installFee: 100000,
    installable: true,
    featured: false,
  },
  {
    id: "p-led-par",
    slug: "led-stage-par-8",
    categoryId: "lighting",
    vendorId: "v-soundlight",
    name: t("LED sahna yoritgichi (8 ta)", "LED-прожекторы для сцены (8 шт.)", "LED Stage Par Lights (8 pcs)"),
    description: t(
      "RGB rangli 8 ta sahna yoritgichi, DMX boshqaruvi bilan.",
      "8 RGB-прожекторов для сцены с управлением DMX.",
      "Eight RGB stage lights with DMX control.",
    ),
    pricePerDay: 320000,
    stock: 4,
    deliveryFee: 120000,
    installFee: 180000,
    installable: true,
    featured: true,
  },
  {
    id: "p-led-backdrop",
    slug: "led-backdrop-screen-3x2",
    categoryId: "lighting",
    vendorId: "v-soundlight",
    name: t("LED ekran fon (3x2 m)", "LED-экран для фона (3x2 м)", "LED Backdrop Screen (3x2 m)"),
    description: t(
      "Sahna orqasi uchun yuqori aniqlikdagi LED ekran.",
      "Высококонтрастный LED-экран для фона сцены.",
      "High-resolution LED screen for stage backdrops.",
    ),
    pricePerDay: 600000,
    stock: 2,
    deliveryFee: 180000,
    installFee: 200000,
    installable: true,
    featured: false,
  },
  {
    id: "p-chandelier",
    slug: "crystal-chandelier-decor",
    categoryId: "decor",
    vendorId: "v-shamiyana",
    name: t("Kristall lyustra (dekor)", "Хрустальная люстра (декор)", "Crystal Chandelier (Decor)"),
    description: t(
      "Zal uchun dekorativ kristall lyustra. Montaj bilan birga.",
      "Декоративная хрустальная люстра для банкетного зала.",
      "Decorative crystal chandelier for banquet halls.",
    ),
    pricePerDay: 400000,
    stock: 2,
    deliveryFee: 100000,
    installFee: 150000,
    installable: true,
    featured: false,
  },
  {
    id: "p-floral-arch",
    slug: "floral-arch-metal",
    categoryId: "decor",
    vendorId: "v-shamiyana",
    name: t("Gul arka (metall ramka)", "Цветочная арка (металлическая)", "Floral Arch with Metal Frame"),
    description: t(
      "Nikoh va suratga olish uchun metall ramkali gul arka.",
      "Металлическая арка для церемоний и фотозоны.",
      "Metal-frame arch for ceremonies and photo zones.",
    ),
    pricePerDay: 280000,
    stock: 3,
    deliveryFee: 120000,
    installFee: 80000,
    installable: true,
    featured: true,
  },
  {
    id: "p-linen",
    slug: "linen-table-set",
    categoryId: "catering",
    vendorId: "v-shamiyana",
    name: t("Dasturxon va stol matolari to'plami", "Комплект скатертей и дорожек", "Linen & Table Runner Set"),
    description: t(
      "Stol matosi va yo'l-yo'lak to'plami. Narx to'plam uchun.",
      "Скатерть и дорожка для стола. Цена за комплект.",
      "Table cloth and runner set. Priced per set.",
    ),
    pricePerDay: 25000,
    stock: 60,
    deliveryFee: 60000,
    installFee: 0,
    installable: false,
    featured: false,
  },
  {
    id: "p-chafing",
    slug: "chafing-dish-set-6",
    categoryId: "catering",
    vendorId: "v-shamiyana",
    name: t("Chafing dish to'plami (6 ta)", "Набор мармитов (6 шт.)", "Chafing Dish Set (6 pcs)"),
    description: t(
      "Issiq taomlar uchun 6 ta chafing dish. Narx to'plam uchun.",
      "6 мармитов для горячих блюд. Цена за комплект.",
      "Six chafing dishes for hot buffet service. Priced per set.",
    ),
    pricePerDay: 90000,
    stock: 10,
    deliveryFee: 90000,
    installFee: 0,
    installable: false,
    featured: false,
  },
  {
    id: "p-heater",
    slug: "infrared-patio-heater",
    categoryId: "climate",
    vendorId: "v-shamiyana",
    name: t("Infraqizil isitgich", "Инфракрасный обогреватель", "Infrared Patio Heater"),
    description: t(
      "Ochiq maydonlar uchun infraqizil isitgich, 12 soatgacha ishlaydi.",
      "Инфракрасный обогреватель для открытых площадок, до 12 часов работы.",
      "Infrared heater for open-air areas, runs up to 12 hours.",
    ),
    pricePerDay: 150000,
    stock: 4,
    deliveryFee: 90000,
    installFee: 60000,
    installable: true,
    featured: false,
  },
];

export const DEMO_PASSWORDS = {
  admin: "admin123",
  vendor1: "vendor123",
  vendor2: "vendor123",
  customer: "customer123",
} as const;

export function createSeedDatabase(now: Date = new Date()): Database {
  const nowIso = now.toISOString();
  const products: Product[] = PRODUCT_SEEDS.map((p) => ({ ...p, active: true, createdAt: nowIso }));

  const mkUser = (
    id: string,
    name: string,
    email: string,
    phone: string,
    role: User["role"],
    password: string,
    vendorId?: string,
  ): User => {
    const { hash, salt } = hashPassword(password);
    return { id, name, email, phone, role, vendorId, passwordHash: hash, passwordSalt: salt, createdAt: nowIso };
  };

  const users: User[] = [
    mkUser("u-admin", "FESTIVO Admin", "admin@festivo.uz", "+998 71 200 00 01", "admin", DEMO_PASSWORDS.admin),
    mkUser("u-vendor1", "Shamiyana Pro", "vendor1@festivo.uz", "+998 90 100 00 01", "vendor", DEMO_PASSWORDS.vendor1, "v-shamiyana"),
    mkUser("u-vendor2", "SoundLight UZ", "vendor2@festivo.uz", "+998 90 100 00 02", "vendor", DEMO_PASSWORDS.vendor2, "v-soundlight"),
    mkUser("u-customer", "Aziza Karimova", "customer@festivo.uz", "+998 93 555 12 34", "customer", DEMO_PASSWORDS.customer),
  ];

  const db: Database = {
    version: 1,
    seq: 0,
    users,
    vendors: SEED_VENDORS,
    categories: SEED_CATEGORIES,
    products,
    bookings: [],
    notifications: [],
    sessions: [],
  };

  // Two sample bookings for the demo customer so dashboards are not empty.
  const today = todayIso(now);
  const sample: Array<{ code: string; status: Booking["status"]; offsetDays: number; items: Array<[string, number, number, boolean, boolean]> }> = [
    {
      code: "FV-1001",
      status: "confirmed",
      offsetDays: 6,
      items: [
        ["p-white-tent", 1, 2, true, true],
        ["p-chiavari", 120, 2, true, false],
        ["p-round-table", 12, 2, false, false],
      ],
    },
    {
      code: "FV-1002",
      status: "completed",
      offsetDays: -14,
      items: [["p-pa-system", 1, 1, true, true]],
    },
  ];

  for (const s of sample) {
    const eventDate = addDaysIso(today, s.offsetDays);
    const lines: BookingLine[] = s.items.map(([productId, qty, days, delivery, installation]) => {
      const product = products.find((p) => p.id === productId)!;
      const priced = priceLine(product, { qty, days, delivery, installation });
      return {
        productId,
        nameSnapshot: product.name,
        vendorId: product.vendorId,
        qty,
        eventDate,
        days,
        delivery,
        installation: installation && product.installable,
        pricePerDay: product.pricePerDay,
        ...priced,
      };
    });
    const totals = sumTotals(lines);
    db.seq += 1;
    db.bookings.push({
      id: `b-${String(db.seq).padStart(4, "0")}`,
      code: s.code,
      userId: "u-customer",
      status: s.status,
      paymentMethod: "cash",
      customer: { fullName: "Aziza Karimova", phone: "+998 93 555 12 34", address: "Toshkent, Chilonzor 9-kvartal", notes: "" },
      lines,
      subtotal: totals.subtotal,
      deliveryTotal: totals.deliveryTotal,
      installationTotal: totals.installationTotal,
      total: totals.total,
      history: [{ status: "pending", at: nowIso }, { status: s.status, at: nowIso }],
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    db.notifications.push({
      id: `n-${db.bookings.length}-a`,
      userId: "u-customer",
      bookingId: db.bookings[db.bookings.length - 1].id,
      bookingCode: s.code,
      kind: "status_changed",
      status: s.status,
      read: false,
      createdAt: nowIso,
    });
  }

  return db;
}
