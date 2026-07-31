import { Feather } from "@expo/vector-icons";

/**
 * Ekran kayıt defteri.
 *
 * Gruplar SRS §3.1.1'de tanımlanan rol tabanlı yerleşimle birebir aynıdır:
 * "Ana, Kapasite & Kaynak, Planlama & YZ, Koordinasyon, Yönetim".
 *
 * `pfs` alanı ekranın gerçeklediği ürün fonksiyonlarını listeler; hem
 * izlenebilirlik rozetlerini (CON-008) hem de RBAC menü filtresini (SEC-009)
 * besler.
 */
export type ScreenId =
  | "dashboard" | "gis" | "notifications"
  | "medical" | "dispatch" | "logistics" | "allocation" | "prepositioning"
  | "dataacq" | "orchestration" | "fieldentry" | "forecasting"
  | "international"
  | "reporting" | "audit" | "users" | "vault" | "traceability" | "settings";

export type NavGroup = "Ana" | "Kapasite & Kaynak" | "Planlama & YZ" | "Koordinasyon" | "Yönetim";

export const NAV_GROUPS: NavGroup[] = [
  "Ana",
  "Kapasite & Kaynak",
  "Planlama & YZ",
  "Koordinasyon",
  "Yönetim",
];

export type NavItem = {
  id: ScreenId;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  group: NavGroup;
  pfs: string[];
  /** Yalnızca Admin (İnsan Kullanıcı) görebilir. */
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  // ── Ana
  { id: "dashboard", label: "Operasyon Panosu", icon: "grid", group: "Ana", pfs: ["PF-SYS02"] },
  { id: "gis", label: "GIS İstihbaratı", icon: "map", group: "Ana", pfs: ["PF-DAT06", "PF-GET03"] },
  { id: "notifications", label: "Bildirimler", icon: "bell", group: "Ana", pfs: ["PF-SYS02"] },

  // ── Kapasite & Kaynak
  { id: "medical", label: "Tıbbi Kapasite", icon: "heart", group: "Kapasite & Kaynak", pfs: ["PF-EMG01", "PF-EMG05"] },
  { id: "dispatch", label: "Acil Sevk & Yönlendirme", icon: "navigation", group: "Kapasite & Kaynak", pfs: ["PF-EMG02", "PF-EMG03", "PF-EMG04", "PF-AI06"] },
  { id: "logistics", label: "Güvenli Düğüm & Koridor", icon: "box", group: "Kapasite & Kaynak", pfs: ["PF-GET07", "PF-GET08"] },
  { id: "allocation", label: "Kaynak Optimizasyonu", icon: "package", group: "Kapasite & Kaynak", pfs: ["PF-AI04", "PF-GET08"] },
  { id: "prepositioning", label: "Stratejik Ön Konuşlanma", icon: "truck", group: "Kapasite & Kaynak", pfs: ["PF-AI04", "PF-GET07"] },

  // ── Planlama & YZ
  { id: "dataacq", label: "Veri Toplama Durumu", icon: "database", group: "Planlama & YZ", pfs: ["PF-DAT01", "PF-DAT02", "PF-DAT03", "PF-DAT04", "PF-DAT05", "PF-DAT06"] },
  { id: "orchestration", label: "YZ Model Orkestrasyonu", icon: "cpu", group: "Planlama & YZ", pfs: ["PF-AI01", "PF-AI02", "PF-AI03", "PF-AI04", "PF-AI05", "PF-AI06", "PF-GET01", "PF-GET02", "PF-GET03"] },
  { id: "fieldentry", label: "Saha Veri Girişi", icon: "edit-3", group: "Planlama & YZ", pfs: ["PF-RSK01"] },
  { id: "forecasting", label: "YZ Tahminleme", icon: "trending-up", group: "Planlama & YZ", pfs: ["PF-AI04"] },

  // ── Koordinasyon
  { id: "international", label: "Uluslararası Yardım", icon: "globe", group: "Koordinasyon", pfs: ["PF-AI05"] },

  // ── Yönetim
  { id: "reporting", label: "Raporlama", icon: "bar-chart-2", group: "Yönetim", pfs: ["PF-GET01", "PF-GET02"] },
  { id: "audit", label: "Denetim & Etik", icon: "book-open", group: "Yönetim", pfs: ["PF-SYS04"] },
  { id: "traceability", label: "Gereksinim İzlenebilirliği", icon: "git-merge", group: "Yönetim", pfs: ["PF-SYS01"] },
  { id: "users", label: "Kullanıcı Yönetimi", icon: "users", group: "Yönetim", pfs: ["PF-SYS01"], adminOnly: true },
  { id: "vault", label: "Vault & Sır Yönetimi", icon: "lock", group: "Yönetim", pfs: ["PF-SYS03"], adminOnly: true },
  { id: "settings", label: "Sistem Ayarları", icon: "settings", group: "Yönetim", pfs: ["PF-SYS03"], adminOnly: true },
];

export const NAV_BY_ID = Object.fromEntries(NAV_ITEMS.map((n) => [n.id, n])) as Record<ScreenId, NavItem>;
