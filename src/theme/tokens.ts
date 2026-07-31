import { Platform } from "react-native";

/**
 * MEDAIGENCY — Lot C tasarım token'ları.
 * Figma prototipindeki palet birebir korunmuştur (koyu operasyon teması).
 */
export const C = {
  bg: "#0F172A",
  sidebar: "#111827",
  card: "#1E293B",
  cardEl: "#243449",
  border: "#334155",
  blue: "#2563EB",
  blueHover: "#1D4ED8",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  critical: "#DC2626",
  info: "#06B6D4",
  ai: "#8B5CF6",
  gis: "#14B8A6",
  txt: "#F8FAFC",
  txt2: "#CBD5E1",
  muted: "#94A3B8",
};

/** Yarı saydam renk üretir (RN `#RRGGBBAA` destekler). */
export const alpha = (hex: string, a: number) =>
  `${hex}${Math.round(Math.min(Math.max(a, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0")}`;

export const FONT = Platform.select({
  web: "Inter, system-ui, -apple-system, sans-serif",
  default: undefined,
}) as string | undefined;

export const MONO = Platform.select({
  web: "ui-monospace, SFMono-Regular, Menlo, monospace",
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
}) as string;

export const RADIUS = { sm: 6, md: 10, lg: 12, xl: 16, pill: 999 };

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

/** Risk / öncelik seviyesine göre renk. */
export const riskColor = (risk: string) => {
  switch (risk) {
    case "critical":
      return C.critical;
    case "high":
      return C.warning;
    case "medium":
      return "#F97316";
    case "low":
      return C.success;
    default:
      return C.muted;
  }
};

/** Doluluk yüzdesine göre renk (yüksek = kötü). */
export const loadColor = (v: number) =>
  v > 100 ? C.critical : v > 85 ? C.warning : C.success;

/** Hazırlık yüzdesine göre renk (yüksek = iyi). */
export const readyColor = (v: number) =>
  v < 60 ? C.danger : v < 75 ? C.warning : C.success;

/**
 * Deprem tehlike/risk skoruna (0–100) göre kademeli renk.
 * Ramp, sismik tehlike haritalarında yerleşik olan yeşil→sarı→turuncu→kırmızı→
 * macenta sırasını izler; koyu altlık üzerinde okunacak biçimde seçilmiştir.
 */
export const hazardColor = (score: number) =>
  score < 35 ? "#16A34A" : score < 55 ? "#EAB308" : score < 70 ? "#F97316" : score < 88 ? "#EF4444" : "#C026D3";

/** Isı haritası skorunun sözel karşılığı (gösterge etiketleri). */
export const hazardLabel = (score: number) =>
  score < 35 ? "Düşük" : score < 55 ? "Orta" : score < 70 ? "Yüksek" : score < 88 ? "Çok Yüksek" : "Aşırı";
