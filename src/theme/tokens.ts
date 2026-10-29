import { Platform } from "react-native";

/**
 * MEDAIGENCY — Lot C tasarım token'ları.
 *
 * Siyah-beyaz resmi tema; varsayılan koyu, Ayarlar'dan açık tema seçilebilir.
 * Renk yalnızca durum bilgisinde kullanılır (kritik, uyarı, normal) ve her
 * zaman metin veya ikonla birlikte gösterilir. Her paletteki metin çiftleri
 * kendi yüzeyleri üzerinde en az 4.5:1 kontrast sağlar.
 *
 * `C` nesnesi tema değiştiğinde yerinde güncellenir; bileşenler renkleri her
 * çizimde `C` üzerinden okur, modül düzeyindeki stiller ise `themed()` ile
 * sarılarak tema değişiminde yeniden hesaplanır.
 */

export type ThemeMode = "dark" | "light";

const DARK = {
  // Yüzeyler
  bg: "#0A0A0A",
  card: "#141414",
  cardEl: "#1C1C1C",
  border: "#262626",
  borderStrong: "#3A3A3A",
  mapBg: "#1A1A1A",

  // Gezinme çubuğu
  sidebar: "#000000",
  sidebarEl: "#171717",
  sidebarBorder: "#1F1F1F",
  onDark: "#FAFAFA",
  onDarkMuted: "#A1A1AA",

  // Metin
  txt: "#FAFAFA",
  txt2: "#D4D4D8",
  muted: "#A1A1AA",

  // Vurgu — beyaz ve gri tonları; ana düğme beyaz, üzerindeki metin siyah
  blue: "#FAFAFA",
  blueHover: "#E4E4E7",
  onPrimary: "#0A0A0A",
  ai: "#D4D4D8",
  gis: "#A1A1AA",
  info: "#A1A1AA",

  // Durum
  success: "#4ADE80",
  warning: "#FBBF24",
  danger: "#F87171",
  critical: "#EF4444",
  onSemantic: "#0A0A0A",
};

const LIGHT: typeof DARK = {
  bg: "#F4F4F5",
  card: "#FFFFFF",
  cardEl: "#FAFAFA",
  border: "#E4E4E7",
  borderStrong: "#D4D4D8",
  mapBg: "#E9E9EB",

  sidebar: "#0A0A0A",
  sidebarEl: "#1C1C1E",
  sidebarBorder: "#27272A",
  onDark: "#FAFAFA",
  onDarkMuted: "#A1A1AA",

  txt: "#0A0A0A",
  txt2: "#3F3F46",
  muted: "#71717A",

  blue: "#0A0A0A",
  blueHover: "#27272A",
  onPrimary: "#FFFFFF",
  ai: "#3F3F46",
  gis: "#52525B",
  info: "#52525B",

  success: "#15803D",
  warning: "#B45309",
  danger: "#B91C1C",
  critical: "#991B1B",
  onSemantic: "#FFFFFF",
};

export const PALETTES: Record<ThemeMode, typeof DARK> = { dark: DARK, light: LIGHT };

/** Etkin palet. Tema değiştiğinde yerinde güncellenir. */
export const C = { ...DARK };

let mode: ThemeMode = "dark";
let version = 0;

export const themeMode = () => mode;
export const themeVersion = () => version;

/** Paleti değiştirir; `themed()` stilleri bir sonraki erişimde yeniden hesaplanır. */
export function applyTheme(next: ThemeMode) {
  if (next === mode) return;
  mode = next;
  Object.assign(C, PALETTES[next]);
  version += 1;
}

/**
 * Modül düzeyindeki stil nesnesini temaya duyarlı yapar: nesne ilk erişimde
 * ve her tema değişiminden sonra `factory` ile yeniden üretilir.
 */
export function themed<T extends object>(factory: () => T): T {
  let cache: T | null = null;
  let builtFor = -1;
  const current = () => {
    if (builtFor !== version || !cache) {
      cache = factory();
      builtFor = version;
    }
    return cache;
  };
  return new Proxy({} as T, {
    get: (_t, p) => (current() as any)[p],
    has: (_t, p) => p in current(),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_t, p) => {
      const d = Reflect.getOwnPropertyDescriptor(current(), p);
      return d ? { ...d, configurable: true } : undefined;
    },
  });
}

/** Yarı saydam renk üretir (RN `#RRGGBBAA` destekler). */
export const alpha = (hex: string, a: number) =>
  `${hex}${Math.round(Math.min(Math.max(a, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0")}`;

export const FONT = Platform.select({
  web: "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif",
  default: undefined,
}) as string | undefined;

export const MONO = Platform.select({
  web: "ui-monospace, SFMono-Regular, Menlo, monospace",
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
}) as string;

export const RADIUS = { sm: 3, md: 4, lg: 6, xl: 8, pill: 999 };

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

/** Risk / öncelik seviyesine göre renk. */
export const riskColor = (risk: string) => {
  switch (risk) {
    case "critical":
      return C.critical;
    case "high":
      return C.danger;
    case "medium":
      return C.warning;
    case "low":
      return C.success;
    default:
      return C.muted;
  }
};

/** Doluluk yüzdesine göre renk (yüksek = kötü). */
export const loadColor = (v: number) =>
  v > 100 ? C.critical : v > 85 ? C.warning : C.txt2;

/** Hazırlık yüzdesine göre renk (yüksek = iyi). */
export const readyColor = (v: number) =>
  v < 60 ? C.danger : v < 75 ? C.warning : C.txt2;

/**
 * Deprem tehlike/risk skoruna (0–100) göre kademeli renk.
 * Tek yönlü sıcak rampa: düşük risk gri, arttıkça amber → turuncu → kırmızı →
 * koyu kırmızı. Her iki altlık üzerinde de okunacak biçimde seçilmiştir.
 */
export const hazardColor = (score: number) =>
  score < 35 ? "#A1A1AA" : score < 55 ? "#D97706" : score < 70 ? "#EA580C" : score < 88 ? "#DC2626" : "#991B1B";

/** Isı haritası skorunun sözel karşılığı (gösterge etiketleri). */
export const hazardLabel = (score: number) =>
  score < 35 ? "Düşük" : score < 55 ? "Orta" : score < 70 ? "Yüksek" : score < 88 ? "Çok Yüksek" : "Aşırı";
