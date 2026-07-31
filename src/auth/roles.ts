import { C } from "../theme/tokens";
import type { ActorId } from "../data/srs";

/**
 * SRS §2.3 — Kullanıcı özellikleri.
 * Platform iki kullanıcı kategorisine sahiptir: dış sistem/veri sağlayıcılar
 * (AFAD, Kızılay, Sağlık Bakanlığı, 112) ve insan kullanıcı (Sistem Yöneticisi
 * & Karar Verici). Erişim SEC-001/SEC-009 uyarınca en az yetki ilkesiyle
 * sınırlandırılır.
 */
export type Role = {
  id: ActorId;
  name: string;
  short: string;
  category: "Dış Sistem / Veri Sağlayıcı" | "İnsan Kullanıcı";
  gateway: "Koordinasyon Gateway" | "Acil Durum Gateway" | "Backoffice Gateway";
  desc: string;
  /** SRS §2.3 tablosundaki "Related Functions" sütunu. */
  functions: string[];
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
    functions: [
      "PF-DAT01", "PF-DAT02", "PF-DAT04", "PF-DAT05",
      "PF-AI01", "PF-AI02", "PF-AI03", "PF-AI04",
      "PF-GET01", "PF-GET02", "PF-GET03", "PF-GET04",
      "PF-GET05", "PF-GET06", "PF-GET07", "PF-GET08",
      "PF-SYS01", "PF-SYS02", "PF-RSK01",
    ],
    color: C.blue,
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
    functions: ["PF-DAT01", "PF-DAT02", "PF-GET07", "PF-GET08", "PF-SYS01", "PF-SYS02"],
    color: C.danger,
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
    functions: ["PF-EMG01", "PF-SYS01", "PF-SYS02"],
    color: C.gis,
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
    functions: ["PF-EMG02", "PF-EMG03", "PF-EMG04", "PF-EMG05", "PF-AI06", "PF-SYS01", "PF-SYS02"],
    color: C.warning,
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
    functions: ["PF-DAT06", "PF-AI05", "PF-SYS01", "PF-SYS02", "PF-SYS03", "PF-SYS04"],
    color: C.ai,
    demoUser: { name: "Uzm. Mert A.", title: "Sistem Yöneticisi", email: "m.acar@medaigency.gov.tr", initials: "MA" },
  },
];

export const ROLE_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r])) as Record<ActorId, Role>;

/**
 * SEC-009 (en az yetki) — Admin, "tam yönetimsel erişim" ve karar verici
 * rolü gereği tüm panoları görebilir; diğer roller yalnızca SRS §2.3'te
 * kendilerine atanmış fonksiyonların ekranlarını görür.
 */
export function canAccess(role: Role, requiredFunctions: string[]): boolean {
  if (role.id === "ADMIN") return true;
  if (requiredFunctions.length === 0) return true;
  return requiredFunctions.some((f) => role.functions.includes(f));
}
