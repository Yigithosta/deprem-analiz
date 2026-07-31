/**
 * SRS V1.0 — MEDAIGENCY Lot C gereksinim kataloğu.
 * Kaynak: "AI-Driven Disaster Resilience, Medical Response, and Multi-Purpose
 * Resource Logistics Management System" — IEEE Std 29148-2018 uyumlu.
 *
 * Bu dosya arayüzün izlenebilirlik (traceability) omurgasıdır: her ekran
 * gerçeklediği ürün fonksiyonlarını (PF) buradan referanslar.
 */

export type PFGroup = "PF-DAT" | "PF-EMG" | "PF-RSK" | "PF-AI" | "PF-GET" | "PF-SYS";

export type ActorId = "AFAD" | "KIZILAY" | "MOH" | "E112" | "ADMIN";

export type ProductFunction = {
  id: string;
  group: PFGroup;
  title: string;
  desc: string;
  actors: ActorId[];
};

/** SRS §2.2 — Ürün fonksiyonları (25 adet). */
export const PRODUCT_FUNCTIONS: ProductFunction[] = [
  // ── Veri Toplama (PF-DAT) — SRS §2.2 / §3.2
  {
    id: "PF-DAT01",
    group: "PF-DAT",
    title: "Stok Noktası Konumları",
    desc: "Afet kaynak stok noktalarının güncel konumlarının AFAD ve Kızılay entegrasyon arayüzlerinden alınması.",
    actors: ["AFAD", "KIZILAY"],
  },
  {
    id: "PF-DAT02",
    group: "PF-DAT",
    title: "Kaynak Miktarları",
    desc: "Her stok noktasındaki güncel kaynak miktarlarının alınması ve envanterin sağlayıcı kayıtlarıyla senkron tutulması.",
    actors: ["AFAD", "KIZILAY"],
  },
  {
    id: "PF-DAT03",
    group: "PF-DAT",
    title: "Gözlemevi Verisi",
    desc: "Kandilli gözlemevinden konum, büyüklük ve derinlik verisinin API ile otomatik alınması. Aktör etkileşimi yoktur.",
    actors: [],
  },
  {
    id: "PF-DAT04",
    group: "PF-DAT",
    title: "Bina Maruziyet Verisi",
    desc: "AFAD'dan bölgedeki yapı envanteri ve dağılımını tanımlayan maruziyet verisinin alınması. Risk modeline girdidir.",
    actors: ["AFAD"],
  },
  {
    id: "PF-DAT05",
    group: "PF-DAT",
    title: "Bina Kırılganlık Verisi",
    desc: "Yapı tiplerinin sismik kuvvetlere tepkisini tanımlayan kırılganlık verisinin AFAD'dan alınması.",
    actors: ["AFAD"],
  },
  {
    id: "PF-DAT06",
    group: "PF-DAT",
    title: "OSM Güncelleme",
    desc: "Harita ve yol ağı (OSM) verisinin Backoffice Gateway üzerinden Admin tarafından güncellenmesi.",
    actors: ["ADMIN"],
  },

  // ── Acil Durum Operasyonları (PF-EMG)
  {
    id: "PF-EMG01",
    group: "PF-EMG",
    title: "Hastane Doluluk",
    desc: "Hastanelerin acil servis doluluk oranlarının Sağlık Bakanlığı'ndan gerçek zamanlı alınması.",
    actors: ["MOH"],
  },
  {
    id: "PF-EMG02",
    group: "PF-EMG",
    title: "Olay Noktaları",
    desc: "112'den acil çağrı / ihbar noktalarının alınması. Tıbbi müdahale iş akışının birincil tetikleyicisidir.",
    actors: ["E112"],
  },
  {
    id: "PF-EMG03",
    group: "PF-EMG",
    title: "Ambulans Konumları",
    desc: "Acil durum süresince ambulans koordinatlarının 112'den canlı alınması; sevk ve yeniden optimizasyonu besler.",
    actors: ["E112"],
  },
  {
    id: "PF-EMG04",
    group: "PF-EMG",
    title: "Güzergah Önerisi",
    desc: "Ambulanslara önerilen hedef hastane ve optimal güzergahın sunulması. Öneri niteliğindedir (SEC-008).",
    actors: ["E112"],
  },
  {
    id: "PF-EMG05",
    group: "PF-EMG",
    title: "Hastane Durum Görünümü",
    desc: "112'ye hastanelerin güncel doluluk ve uygunluk durumunun karar-hazır biçimde sunulması.",
    actors: ["E112"],
  },

  // ── Manuel Saha Veri Girişi (PF-RSK)
  {
    id: "PF-RSK01",
    group: "PF-RSK",
    title: "Yol Hasarı & Erişim Kısıtı Girişi",
    desc: "AFAD'ın afet sonrası yol hasarlarını, kapalı güzergahları ve erişilebilirlik kısıtlarını Koordinasyon Gateway üzerinden sisteme girmesi.",
    actors: ["AFAD"],
  },

  // ── YZ Model Orkestrasyonu (PF-AI)
  {
    id: "PF-AI01",
    group: "PF-AI",
    title: "Hazard Modeli Tetikleme",
    desc: "Dağıtım Sistemi'ndeki OpenQuake tabanlı Hazard modelinin çalıştırılması; sismik tehlike dağılımı üretir.",
    actors: ["AFAD"],
  },
  {
    id: "PF-AI02",
    group: "PF-AI",
    title: "Risk Modeli Tetikleme",
    desc: "Hazard çıktısını maruziyet ve kırılganlık verisiyle birleştiren Risk modelinin çalıştırılması.",
    actors: ["AFAD"],
  },
  {
    id: "PF-AI03",
    group: "PF-AI",
    title: "Yol Riski Modeli Tetikleme",
    desc: "Bina hasar tahmini, harita/yol verisi ve manuel yol hasarı girdisinden yol ve altyapı riskini türeten modelin çalıştırılması.",
    actors: ["AFAD"],
  },
  {
    id: "PF-AI04",
    group: "PF-AI",
    title: "Yerel Optimizasyon Tetikleme",
    desc: "Ülke içi kaynak tahsisi ve ön konuşlanmayı stok, talep tahmini ve risk çıktılarına göre hesaplayan modelin çalıştırılması.",
    actors: ["AFAD"],
  },
  {
    id: "PF-AI05",
    group: "PF-AI",
    title: "Küresel Optimizasyon Tetikleme",
    desc: "Sınır ötesi kaynak paylaşımı ve yardım akışlarını koordine eden çok-etmenli optimizasyon modelinin Admin tarafından çalıştırılması.",
    actors: ["ADMIN"],
  },
  {
    id: "PF-AI06",
    group: "PF-AI",
    title: "Acil Gerçek Zamanlı YZ Tetikleme",
    desc: "112'nin zaman kritik sevk ve yönlendirme kararlarını destekleyen gerçek zamanlı modeli tetiklemesi.",
    actors: ["E112"],
  },

  // ── Sonuç Alma (PF-GET)
  {
    id: "PF-GET01",
    group: "PF-GET",
    title: "Hazard Sonuçları",
    desc: "Hazard modelinin ürettiği sonuçların Dağıtım Sistemi'nden alınması.",
    actors: ["AFAD"],
  },
  {
    id: "PF-GET02",
    group: "PF-GET",
    title: "Risk Sonuçları",
    desc: "Risk modelinin ürettiği bina hasar ve kayıp tahminlerinin alınması.",
    actors: ["AFAD"],
  },
  {
    id: "PF-GET03",
    group: "PF-GET",
    title: "Yol Riski Sonuçları",
    desc: "Yol ve altyapı riski sonuçlarının alınması; güzergah önerisini (PF-EMG04) de besler.",
    actors: ["AFAD"],
  },
  {
    id: "PF-GET04",
    group: "PF-GET",
    title: "Gözlemevi Verisi Alma",
    desc: "Dağıtım Sistemi'nde tutulan güncel gözlemevi verisinin alınması.",
    actors: ["AFAD"],
  },
  {
    id: "PF-GET05",
    group: "PF-GET",
    title: "Maruziyet Verisi Alma",
    desc: "Dağıtım Sistemi'nde tutulan güncel bina maruziyet verisinin alınması.",
    actors: ["AFAD"],
  },
  {
    id: "PF-GET06",
    group: "PF-GET",
    title: "Kırılganlık Verisi Alma",
    desc: "Dağıtım Sistemi'nde tutulan güncel bina kırılganlık verisinin alınması.",
    actors: ["AFAD"],
  },
  {
    id: "PF-GET07",
    group: "PF-GET",
    title: "Stok Noktası Verisi Alma",
    desc: "Yerel Optimizasyon modelinde tutulan güncel stok noktası verisinin alınması.",
    actors: ["AFAD", "KIZILAY"],
  },
  {
    id: "PF-GET08",
    group: "PF-GET",
    title: "Kaynak Miktarı Alma",
    desc: "Yerel Optimizasyon modelinde tutulan güncel stok noktası kaynak miktarlarının alınması.",
    actors: ["AFAD", "KIZILAY"],
  },

  // ── Sistem & Erişim (PF-SYS)
  {
    id: "PF-SYS01",
    group: "PF-SYS",
    title: "Sisteme Giriş",
    desc: "Tüm yetkili kullanıcıların kimlik doğrulaması. Erişim rol tabanlı erişim kontrolü ile yönetilir (SEC-001).",
    actors: ["AFAD", "KIZILAY", "MOH", "E112", "ADMIN"],
  },
  {
    id: "PF-SYS02",
    group: "PF-SYS",
    title: "Bildirimleri Görüntüleme",
    desc: "Bildirim Servisi üzerinden iletilen operasyonel uyarı ve bildirimlerin görüntülenmesi.",
    actors: ["AFAD", "KIZILAY", "MOH", "E112", "ADMIN"],
  },
  {
    id: "PF-SYS03",
    group: "PF-SYS",
    title: "Vault Değerlerini Değiştirme",
    desc: "Vault Servisi tarafından yönetilen sır ve yapılandırma değerlerinin Admin tarafından değiştirilmesi (SEC-002).",
    actors: ["ADMIN"],
  },
  {
    id: "PF-SYS04",
    group: "PF-SYS",
    title: "Sistem Loglarını Dışa Aktarma",
    desc: "Denetim, izleme ve hesap verebilirlik amacıyla sistem loglarının Admin tarafından dışa aktarılması (SEC-006).",
    actors: ["ADMIN"],
  },
];

export const PF = Object.fromEntries(
  PRODUCT_FUNCTIONS.map((p) => [p.id, p])
) as Record<string, ProductFunction>;

export const PF_GROUP_LABEL: Record<PFGroup, string> = {
  "PF-DAT": "Veri Toplama",
  "PF-EMG": "Acil Durum Operasyonları",
  "PF-RSK": "Manuel Saha Veri Girişi",
  "PF-AI": "YZ Model Orkestrasyonu",
  "PF-GET": "Sonuç Alma",
  "PF-SYS": "Sistem & Erişim",
};

/** SRS §2.4 — Kısıtlar. */
export const CONSTRAINTS: { id: string; text: string }[] = [
  { id: "CON-001", text: "Bulut, yerinde (on-premises) veya hibrit dağıtım desteklenmelidir." },
  { id: "CON-002", text: "Tüm dış entegrasyonlar belgelenmiş API arayüzleri üzerinden sunulmalıdır." },
  { id: "CON-003", text: "Kimliği doğrulanmış tüm kullanıcılar için rol tabanlı erişim kontrolü (RBAC) desteklenmelidir." },
  { id: "CON-004", text: "Tüm kimlik doğrulama olayları, veri değişiklikleri ve operasyonel kararlar için denetim kaydı tutulmalıdır." },
  { id: "CON-005", text: "Geospatial veri işleme ve görselleştirme yetenekleri desteklenmelidir." },
  { id: "CON-006", text: "Sağlık, acil durum yönetimi ve insani yardım sistemleriyle standart veri değişimi üzerinden birlikte çalışabilirlik sağlanmalıdır." },
  { id: "CON-007", text: "YZ üretimi öneriler, operasyonel eylem öncesi insan onayı gerektirir." },
  { id: "CON-008", text: "YZ önerileri ile temel girdi verisi arasında izlenebilirlik sağlanmalıdır." },
  { id: "CON-009", text: "Birden fazla katılımcı kuruluşun eşzamanlı erişimi desteklenmelidir." },
  { id: "CON-010", text: "Geçerli veri koruma ve gizlilik düzenlemelerine uygun çalışılmalıdır." },
  { id: "CON-011", text: "Tıbbi, insani ve lojistik kaynaklar birleşik bir veri modeli içinde işlenmelidir." },
  { id: "CON-012", text: "Mevcut iş süreçleri değiştirilmeden yeni servis modülleri eklenebilmelidir." },
  { id: "CON-013", text: "Tüm işleme ve karar destek akışlarında veri şeffaflığını sağlayan etik-tasarım yaklaşımı izlenmelidir." },
  { id: "CON-014", text: "Kullanılan teknoloji ve bileşenlerde açık kaynak uyumluluğu sağlanmalıdır." },
  { id: "CON-015", text: "Mağdur ve hasta verilerinin gizliliği toplama, işleme ve saklamanın her aşamasında güvence altına alınmalıdır." },
  { id: "CON-016", text: "Tedarikçi bağımlılığından kaçınılmalı, bulut ve yerinde ortamlar arası geçiş desteklenmelidir." },
  { id: "CON-017", text: "Operasyonel konumlar, ayrıntılı tesis tipleri yerine işlevsel kategorilerle tutulmalıdır." },
];

/** SRS §4.2 — Güvenlik gereksinimleri. */
export const SECURITY_REQS: { id: string; text: string }[] = [
  { id: "SEC-001", text: "Tüm kullanıcılar ve servisler arası çağrılar kimlik doğrulanmalı, RBAC uygulanmalıdır." },
  { id: "SEC-002", text: "Tüm sırlar, kimlik bilgileri ve şifreleme anahtarları Vault Servisi ile yönetilmeli, düz metin saklanmamalıdır." },
  { id: "SEC-003", text: "Erişim token'ları (JWT) üretilmeli, doğrulanmalı; yenileme ve iptal desteklenmelidir." },
  { id: "SEC-004", text: "Bileşenler ve dış arayüzler arası tüm veri aktarımı TLS ile şifrelenmelidir." },
  { id: "SEC-005", text: "Bekleyen hassas veri — özellikle mağdur ve hasta verisi — şifrelenmelidir (CON-015)." },
  { id: "SEC-006", text: "Kimlik doğrulama, veri değişikliği, hassas veri erişimi ve operasyonel kararlar için kurcalamaya karşı korumalı denetim kaydı tutulmalıdır." },
  { id: "SEC-007", text: "GDPR ve ilgili ulusal mevzuata uyumlu çalışılmalıdır (CON-010)." },
  { id: "SEC-008", text: "YZ önerileri yalnızca tavsiye niteliğindedir; uygulama öncesi insan onayı zorunludur (CON-007)." },
  { id: "SEC-009", text: "En az yetki ilkesi uygulanmalı; her role yalnızca sorumluluğu kadar erişim verilmelidir." },
];

/** SRS §4.1 — Performans gereksinimleri (özet). */
export const PERFORMANCE_REQS: { id: string; text: string }[] = [
  { id: "PER-001", text: "Acil bildirim ve durum güncellemeleri uçtan uca ≤ 5 sn hedef gecikmeyle iletilmelidir." },
  { id: "PER-002", text: "Tüm katılımcı kuruluş ve gateway'ler pik afet yükünde eşzamanlı çalışabilmelidir." },
  { id: "PER-003", text: "Redis Cache'ten sunulan veriler isteklerin %90'ında ≤ 1 sn içinde dönmelidir." },
  { id: "PER-004", text: "Dinamik ambulans ve lojistik güzergah istekleri ≤ 10 sn içinde optimize güzergah döndürmelidir." },
  { id: "PER-005", text: "Hazard ve risk hesaplamaları asenkron toplu iş olarak çalışabilir; sonuçlar mutabık süre içinde sunulmalıdır." },
  { id: "PER-006", text: "Sistem yatay ölçeklenebilir olmalıdır." },
  { id: "PER-007", text: "Yüksek hacimli veri alımı veri kaybı olmadan sürdürülmelidir." },
];

/** SRS §4.3 — Yazılım kalite nitelikleri. */
export const QUALITY_REQS: { id: string; attr: string; text: string }[] = [
  { id: "QLT-001", attr: "Güvenilirlik", text: "Tek hata noktası olmamalı; kısmi arızalarda temel koordinasyon işlevleri sürmelidir." },
  { id: "QLT-002", attr: "Erişilebilirlik", text: "Çekirdek koordinasyon servisleri yüksek operasyonel erişilebilirlik hedeflemelidir (≥ %90/ay ön hedef)." },
  { id: "QLT-003", attr: "Bakım Yapılabilirlik", text: "Modüler mikroservis tasarımı; servisler bağımsız güncellenebilmelidir (CON-012)." },
  { id: "QLT-004", attr: "Birlikte Çalışabilirlik", text: "Belgelenmiş API'ler ve standart veri değişim mekanizmaları kullanılmalıdır." },
  { id: "QLT-005", attr: "Kullanılabilirlik", text: "Panolar, teknik olmayan operatörlerce zaman kritik koşullarda etkin kullanılabilmelidir." },
  { id: "QLT-006", attr: "Şeffaflık", text: "YZ çıktıları temel girdi verisine kadar izlenebilir olmalıdır (CON-008, CON-013)." },
  { id: "QLT-007", attr: "Sürdürülebilirlik", text: "Açık kaynak uyumlu teknolojiler tercih edilmelidir (CON-014)." },
  { id: "QLT-008", attr: "Taşınabilirlik", text: "Bulut, yerinde ve hibrit ortamlarda minimum yeniden yapılandırma ile çalışmalıdır." },
];

/** SRS §5 — Gereksinim izlenebilirlik matrisi. */
export const TRACEABILITY: {
  group: PFGroup;
  label: string;
  source: string;
  related: string[];
  nfr: string[];
}[] = [
  {
    group: "PF-DAT",
    label: "Veri Toplama",
    source: "RFQ C1; Gateway'ler + Redis çekirdeği; Dış sağlayıcılar",
    related: ["CON-002", "CON-006", "DEP-001", "DEP-002", "DEP-003", "DEP-004", "DEP-007", "DEP-008", "DEP-009"],
    nfr: ["PER-007", "SEC-001"],
  },
  {
    group: "PF-EMG",
    label: "Acil Durum Operasyonları",
    source: "RFQ C2; Emergency Service + A* YZ + Road Risk Service",
    related: ["CON-007", "DEP-002", "DEP-005"],
    nfr: ["PER-001", "PER-004", "SEC-008"],
  },
  {
    group: "PF-AI",
    label: "YZ Model Orkestrasyonu",
    source: "RFQ C2/C3; Hazard/Risk/Road Risk + Optimizasyon (RL)",
    related: ["CON-007", "CON-008", "DEP-008", "DEP-009"],
    nfr: ["PER-005", "SEC-008", "QLT-006"],
  },
  {
    group: "PF-GET",
    label: "Sonuç Alma",
    source: "RFQ C2/C3; Dağıtım Sistemi + Optimizasyon Servisi",
    related: ["CON-005", "DEP-004"],
    nfr: ["PER-003", "PER-006", "QLT-004"],
  },
  {
    group: "PF-SYS",
    label: "Sistem & Erişim",
    source: "Mimari; Auth + Vault + Notification + Log Servisleri",
    related: ["CON-003", "CON-004", "CON-010", "DEP-006"],
    nfr: ["SEC-001", "SEC-002", "SEC-006", "SEC-009"],
  },
  {
    group: "PF-RSK",
    label: "Manuel Saha Veri Girişi",
    source: "RFQ C1/C2; Road Risk Service + Optimizasyon Servisi",
    related: ["CON-002", "CON-004"],
    nfr: ["SEC-001", "SEC-006"],
  },
];
