import {
  Armchair,
  Flower2,
  Lightbulb,
  Package,
  Speaker,
  Tent,
  Thermometer,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  tent: Tent,
  armchair: Armchair,
  speaker: Speaker,
  lightbulb: Lightbulb,
  flower: Flower2,
  utensils: UtensilsCrossed,
  thermometer: Thermometer,
};

export function categoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Package;
}

/** Brand colour rotation for tiles: blue → green → red. */
export const TONES = ["blue", "green", "red"] as const;
export type Tone = (typeof TONES)[number];

export function toneFor(index: number): Tone {
  return TONES[index % TONES.length];
}

export const TONE_HEX: Record<Tone, string> = {
  blue: "#3B82F6",
  green: "#22C55E",
  red: "#EF4444",
};
