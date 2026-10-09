// Shared domain types for FESTIVO.

export type Lang = "uz" | "ru" | "en";
export const LANGS: readonly Lang[] = ["uz", "ru", "en"] as const;
export const DEFAULT_LANG: Lang = "uz";

/** Every user-facing product/category string is stored in all three languages. */
export type LText = Record<Lang, string>;

export type Role = "customer" | "vendor" | "admin";

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "delivering",
  "installed",
  "completed",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type PaymentMethod = "cash" | "transfer";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  vendorId?: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  city: LText;
  rating: number;
}

export interface Category {
  id: string;
  icon: string;
  name: LText;
  description: LText;
}

export interface Product {
  id: string;
  slug: string;
  categoryId: string;
  vendorId: string;
  name: LText;
  description: LText;
  /** Rental price per day (UZS) for one unit. */
  pricePerDay: number;
  /** Units the vendor owns. */
  stock: number;
  /** Flat delivery fee per order line (UZS). */
  deliveryFee: number;
  /** Installation fee per unit (UZS). */
  installFee: number;
  installable: boolean;
  featured: boolean;
  active: boolean;
  createdAt: string;
}

export interface BookingLine {
  productId: string;
  nameSnapshot: LText;
  vendorId: string;
  qty: number;
  eventDate: string; // YYYY-MM-DD
  days: number;
  delivery: boolean;
  installation: boolean;
  pricePerDay: number;
  rentalTotal: number;
  deliveryTotal: number;
  installationTotal: number;
  lineTotal: number;
}

export interface BookingCustomer {
  fullName: string;
  phone: string;
  address: string;
  notes: string;
}

export interface StatusEvent {
  status: BookingStatus;
  at: string;
}

export interface Booking {
  id: string;
  code: string;
  userId: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  customer: BookingCustomer;
  lines: BookingLine[];
  subtotal: number;
  deliveryTotal: number;
  installationTotal: number;
  total: number;
  history: StatusEvent[];
  createdAt: string;
  updatedAt: string;
}

export type NotificationKind = "booking_created" | "status_changed";

export interface AppNotification {
  id: string;
  userId: string;
  bookingId: string;
  bookingCode: string;
  kind: NotificationKind;
  status: BookingStatus;
  read: boolean;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
}

export interface Database {
  version: number;
  seq: number;
  users: User[];
  vendors: Vendor[];
  categories: Category[];
  products: Product[];
  bookings: Booking[];
  notifications: AppNotification[];
  sessions: Session[];
}

/** Public view of a user (never includes password fields). */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  vendorId?: string;
}
