import { Feather } from "@expo/vector-icons";
import type { Permission } from "../auth/roles";

/**
 * Ekran kayıt defteri.
 *
 * Menü grupları rol tabanlı konsol yerleşimini izler: "Ana, Kapasite & Kaynak,
 * Planlama & YZ, Koordinasyon, Yönetim".
 *
 * `requires`, ekranı görebilmek için gereken izinlerden en az birini listeler;
 * menü filtresi bu alana göre çalışır.
 */
export type ScreenId =
  | "dashboard" | "gis" | "notifications"
  | "medical" | "dispatch" | "logistics" | "allocation" | "prepositioning"
  | "dataacq" | "orchestration" | "fieldentry" | "forecasting"
  | "international"
  | "reporting" | "audit" | "users" | "vault" | "settings";

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
  requires: Permission[];
  /** Yalnızca Admin (İnsan Kullanıcı) görebilir. */
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  // ── Ana
  { id: "dashboard", label: "Operasyon Panosu", icon: "grid", group: "Ana", requires: ["notifications.view"] },
  { id: "gis", label: "GIS İstihbaratı", icon: "map", group: "Ana", requires: ["osm.update", "results.roadRisk.view"] },
  { id: "notifications", label: "Bildirimler", icon: "bell", group: "Ana", requires: ["notifications.view"] },

  // ── Kapasite & Kaynak
  { id: "medical", label: "Tıbbi Kapasite", icon: "heart", group: "Kapasite & Kaynak", requires: ["hospital.occupancy.submit", "hospitals.status.view"] },
  { id: "dispatch", label: "Acil Sevk & Yönlendirme", icon: "navigation", group: "Kapasite & Kaynak", requires: ["incidents.submit", "ambulances.submit", "routes.view", "model.emergency.run"] },
  { id: "logistics", label: "Güvenli Düğüm & Koridor", icon: "box", group: "Kapasite & Kaynak", requires: ["stock.points.view", "stock.quantities.view"] },
  { id: "allocation", label: "Kaynak Optimizasyonu", icon: "package", group: "Kapasite & Kaynak", requires: ["model.localOptimization.run", "stock.quantities.view"] },
  { id: "prepositioning", label: "Stratejik Ön Konuşlanma", icon: "truck", group: "Kapasite & Kaynak", requires: ["model.localOptimization.run", "stock.points.view"] },

  // ── Planlama & YZ
  {
    id: "dataacq", label: "Veri Toplama Durumu", icon: "database", group: "Planlama & YZ",
    requires: [
      "stock.locations.submit", "stock.quantities.submit", "exposure.submit", "fragility.submit", "osm.update",
      "data.observatory.view", "data.exposure.view", "data.fragility.view",
    ],
  },
  {
    id: "orchestration", label: "YZ Model Orkestrasyonu", icon: "cpu", group: "Planlama & YZ",
    requires: [
      "model.hazard.run", "model.risk.run", "model.roadRisk.run", "model.localOptimization.run",
      "model.globalOptimization.run", "model.emergency.run",
      "results.hazard.view", "results.risk.view", "results.roadRisk.view",
    ],
  },
  { id: "fieldentry", label: "Saha Veri Girişi", icon: "edit-3", group: "Planlama & YZ", requires: ["roadDamage.submit"] },
  { id: "forecasting", label: "YZ Tahminleme", icon: "trending-up", group: "Planlama & YZ", requires: ["model.localOptimization.run"] },

  // ── Koordinasyon
  { id: "international", label: "Uluslararası Yardım", icon: "globe", group: "Koordinasyon", requires: ["model.globalOptimization.run"] },

  // ── Yönetim
  { id: "reporting", label: "Raporlama", icon: "bar-chart-2", group: "Yönetim", requires: ["results.hazard.view", "results.risk.view", "logs.export"] },
  { id: "audit", label: "Denetim & Etik", icon: "book-open", group: "Yönetim", requires: ["logs.export"] },
  { id: "users", label: "Kullanıcı Yönetimi", icon: "users", group: "Yönetim", requires: ["session.login"], adminOnly: true },
  { id: "vault", label: "Vault & Sır Yönetimi", icon: "lock", group: "Yönetim", requires: ["vault.manage"], adminOnly: true },
  { id: "settings", label: "Ayarlar", icon: "settings", group: "Yönetim", requires: ["session.login"] },
];

export const NAV_BY_ID = Object.fromEntries(NAV_ITEMS.map((n) => [n.id, n])) as Record<ScreenId, NavItem>;
