import { C } from "../theme/tokens";
import type { DistributionDataset, ModelId } from "../api/types";

/**
 * Kullanıcı rolleri ve izinler.
 *
 * Platformun iki kullanıcı kategorisi vardır: dış sistem / veri sağlayıcı
 * kurumlar (AFAD, Kızılay, Sağlık Bakanlığı, 112) ve insan kullanıcı (Sistem
 * Yöneticisi & Karar Verici). Her rol yalnızca sorumluluğu kadar izne sahiptir
 * (en az yetki ilkesi); arayüz menüsü ve API yetkilendirmesi bu listeden
 * beslenir.
 */

export type ActorId = "AFAD" | "KIZILAY" | "MOH" | "E112" | "ADMIN";

export type Permission =
  // Veri toplama
  | "stock.locations.submit"
  | "stock.quantities.submit"
  | "exposure.submit"
  | "fragility.submit"
  | "osm.update"
  // Acil durum operasyonları
  | "hospital.occupancy.submit"
  | "incidents.submit"
  | "ambulances.submit"
  | "routes.view"
  | "hospitals.status.view"
  // Saha veri girişi
  | "roadDamage.submit"
  // YZ model tetikleme
  | "model.hazard.run"
  | "model.risk.run"
  | "model.roadRisk.run"
  | "model.localOptimization.run"
  | "model.globalOptimization.run"
  | "model.emergency.run"
  // Sonuç ve veri alma
  | "results.hazard.view"
  | "results.risk.view"
  | "results.roadRisk.view"
  | "data.observatory.view"
  | "data.exposure.view"
  | "data.fragility.view"
  | "stock.points.view"
  | "stock.quantities.view"
  // Sistem & erişim
  | "session.login"
  | "notifications.view"
  | "vault.manage"
  | "logs.export"
  // Karar destek
  | "recommendations.decide";

/** Kullanıcı yönetimi ekranında gösterilen, günlük dildeki izin adları. */
export const PERMISSION_LABEL: Record<Permission, string> = {
  "stock.locations.submit": "Stok noktası konumlarını iletme",
  "stock.quantities.submit": "Stok miktarlarını iletme",
  "exposure.submit": "Bina maruziyet verisi iletme",
  "fragility.submit": "Bina kırılganlık verisi iletme",
  "osm.update": "Harita / yol ağı güncelleme",
  "hospital.occupancy.submit": "Acil servis doluluğu iletme",
  "incidents.submit": "Olay / ihbar noktası iletme",
  "ambulances.submit": "Ambulans konumu iletme",
  "routes.view": "Hastane ve güzergah önerisi alma",
  "hospitals.status.view": "Hastane uygunluk durumunu görme",
  "roadDamage.submit": "Yol hasarı ve erişim kısıtı girme",
  "model.hazard.run": "Tehlike modelini çalıştırma",
  "model.risk.run": "Risk modelini çalıştırma",
  "model.roadRisk.run": "Yol riski modelini çalıştırma",
  "model.localOptimization.run": "Yerel optimizasyonu çalıştırma",
  "model.globalOptimization.run": "Uluslararası optimizasyonu çalıştırma",
  "model.emergency.run": "Acil gerçek zamanlı YZ'yi çalıştırma",
  "results.hazard.view": "Tehlike sonuçlarını alma",
  "results.risk.view": "Risk sonuçlarını alma",
  "results.roadRisk.view": "Yol riski sonuçlarını alma",
  "data.observatory.view": "Gözlemevi verisini alma",
  "data.exposure.view": "Maruziyet verisini alma",
  "data.fragility.view": "Kırılganlık verisini alma",
  "stock.points.view": "Stok noktalarını görme",
  "stock.quantities.view": "Stok miktarlarını görme",
  "session.login": "Sisteme giriş",
  "notifications.view": "Bildirimleri görme",
  "vault.manage": "Vault değerlerini yönetme",
  "logs.export": "Sistem loglarını dışa aktarma",
  "recommendations.decide": "YZ önerilerini onaylama / reddetme",
};

export type Role = {
  id: ActorId;
  name: string;
  short: string;
  category: "Dış Sistem / Veri Sağlayıcı" | "İnsan Kullanıcı";
  gateway: "Koordinasyon Gateway" | "Acil Durum Gateway" | "Backoffice Gateway";
  desc: string;
  permissions: Permission[];
  color: string;
  demoUser: { name: string; title: string; email: string; initials: string };
};

export const ROLES: Role[] = [
  {
    id: "AFAD",
    name: "AFAD",
    short: "AFAD",
    category: "Dış Sistem / Veri Sağlayıcı",
    gateway: "Koordinasyon Gateway",
    desc:
      "Afet olayı ve olay verisi ile yapısal maruziyet, bina envanteri ve kırılganlık verisini sağlayan birincil ulusal otorite. Risk ve yol riski değerlendirmesini besler, müdahaleyi koordine eder.",
    permissions: [
      "stock.locations.submit", "stock.quantities.submit", "exposure.submit", "fragility.submit",
      "model.hazard.run", "model.risk.run", "model.roadRisk.run", "model.localOptimization.run",
      "results.hazard.view", "results.risk.view", "results.roadRisk.view",
      "data.observatory.view", "data.exposure.view", "data.fragility.view",
      "stock.points.view", "stock.quantities.view",
      "session.login", "notifications.view", "roadDamage.submit",
    ],
    get color() { return C.txt; },
    demoUser: { name: "Gen. Yılmaz K.", title: "Ulusal Koordinatör", email: "y.kurt@afad.gov.tr", initials: "YK" },
  },
  {
    id: "KIZILAY",
    name: "Kızılay",
    short: "Kızılay",
    category: "Dış Sistem / Veri Sağlayıcı",
    gateway: "Koordinasyon Gateway",
    desc:
      "İnsani yardım kaynak ve envanter verisini (malzeme, barınma / Güvenli Düğüm stoğu) sağlayan, kaynak tahsis çıktılarını tüketen insani yardım kuruluşu.",
    permissions: [
      "stock.locations.submit", "stock.quantities.submit",
      "stock.points.view", "stock.quantities.view",
      "session.login", "notifications.view",
    ],
    get color() { return C.ai; },
    demoUser: { name: "Uzm. Elif D.", title: "Lojistik Sorumlusu", email: "e.demir@kizilay.org.tr", initials: "ED" },
  },
  {
    id: "MOH",
    name: "Sağlık Bakanlığı",
    short: "Sağlık Bak.",
    category: "Dış Sistem / Veri Sağlayıcı",
    gateway: "Acil Durum Gateway",
    desc:
      "Hastane kapasitesi, hastane durumu ve yatak müsaitliği verisini sağlar; tıbbi müdahale ve yönlendirme çıktılarını tüketir.",
    permissions: ["hospital.occupancy.submit", "session.login", "notifications.view"],
    get color() { return C.gis; },
    demoUser: { name: "Dr. Özlem S.", title: "Tıbbi Koordinatör", email: "o.sahin@saglik.gov.tr", initials: "ÖS" },
  },
  {
    id: "E112",
    name: "112 Acil Çağrı Merkezi",
    short: "112",
    category: "Dış Sistem / Veri Sağlayıcı",
    gateway: "Acil Durum Gateway",
    desc:
      "Tıbbi müdahale ve sevki tetikleyen acil çağrı ve olay verisini sağlar. Etkileşimli sistem içi operatör değil, dış veri kaynağı/kurum olarak ele alınır.",
    permissions: [
      "incidents.submit", "ambulances.submit", "routes.view", "hospitals.status.view",
      "model.emergency.run", "session.login", "notifications.view",
    ],
    get color() { return C.muted; },
    demoUser: { name: "Kdr. Fatih D.", title: "Sevk Amiri", email: "f.demir@112.gov.tr", initials: "FD" },
  },
  {
    id: "ADMIN",
    name: "Sistem Yöneticisi & Karar Verici",
    short: "Admin",
    category: "İnsan Kullanıcı",
    gateway: "Backoffice Gateway",
    desc:
      "Başlıca etkileşimli insan kullanıcı. Sistem yapılandırması, kullanıcı yönetimi, güvenlik yönetimi, izleme ve bakımdan sorumludur. Karar verici olarak operasyonel panoları, analitiği ve tahminleri izler. Tam yönetimsel erişime sahiptir.",
    permissions: [
      "osm.update", "model.globalOptimization.run",
      "session.login", "notifications.view", "vault.manage", "logs.export",
      "recommendations.decide",
    ],
    get color() { return C.txt; },
    demoUser: { name: "Uzm. Mert A.", title: "Sistem Yöneticisi", email: "m.acar@medaigency.gov.tr", initials: "MA" },
  },
];

export const ROLE_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r])) as Record<ActorId, Role>;

/**
 * Rolün belirli bir işlemi yapma izni var mı? Admin tam yönetimsel erişime
 * sahiptir; diğer roller yalnızca kendi izin listesiyle sınırlıdır.
 */
export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return role.id === "ADMIN" || role.permissions.includes(permission);
}

/**
 * Ekran görünürlüğü. Admin, tam yönetimsel erişimi ve karar verici rolü gereği
 * tüm panoları izleyebilir; diğer roller yalnızca kendi izinlerinden en az
 * birini gerektiren ekranları görür.
 */
export function canAccess(role: Role, required: Permission[]): boolean {
  if (role.id === "ADMIN") return true;
  if (required.length === 0) return true;
  return required.some((p) => role.permissions.includes(p));
}

/** Her modeli tetiklemek için gereken izin. */
export const MODEL_RUN_PERMISSION: Record<ModelId, Permission> = {
  hazard: "model.hazard.run",
  risk: "model.risk.run",
  roadRisk: "model.roadRisk.run",
  localOptimization: "model.localOptimization.run",
  globalOptimization: "model.globalOptimization.run",
  emergency: "model.emergency.run",
};

/** Sonuç alma izni; alınabilir sonuç kümesi olmayan modeller listede yer almaz. */
export const MODEL_RESULT_PERMISSION: Partial<Record<ModelId, Permission>> = {
  hazard: "results.hazard.view",
  risk: "results.risk.view",
  roadRisk: "results.roadRisk.view",
  localOptimization: "stock.points.view",
};

/** Dağıtım Sistemi veri kümelerini alma izni. */
export const DATASET_PERMISSION: Record<DistributionDataset, Permission> = {
  observatory: "data.observatory.view",
  exposure: "data.exposure.view",
  fragility: "data.fragility.view",
};
