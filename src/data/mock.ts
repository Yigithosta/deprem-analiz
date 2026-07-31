/**
 * Demo veri kümesi.
 * Not: Gerçek dağıtımda bu veriler SRS §3.1.3'te tanımlı dış arayüzlerden
 * (AFAD, Kızılay, Sağlık Bakanlığı, 112, Kandilli) ve Dağıtım Sistemi'nin
 * model çıktılarından gelir. Prototipte statik olarak tutulmaktadır.
 */
import { C } from "../theme/tokens";

export const forecastData = [
  { day: "D+1", med: 85, resource: 72, corridor: 88 },
  { day: "D+2", med: 94, resource: 68, corridor: 75 },
  { day: "D+3", med: 112, resource: 58, corridor: 62 },
  { day: "D+4", med: 108, resource: 55, corridor: 58 },
  { day: "D+5", med: 89, resource: 62, corridor: 70 },
  { day: "D+6", med: 76, resource: 70, corridor: 80 },
  { day: "D+7", med: 62, resource: 78, corridor: 88 },
];

export const hospitalRows = [
  { name: "Adana Şehir Hastanesi", cap: 850, icu: 120, load: 94, forecast: 108, risk: "critical" },
  { name: "Mersin Eğitim Hastanesi", cap: 620, icu: 88, load: 78, forecast: 89, risk: "high" },
  { name: "Hatay Devlet Hastanesi", cap: 480, icu: 64, load: 112, forecast: 120, risk: "critical" },
  { name: "Gaziantep Tıp Merkezi", cap: 720, icu: 96, load: 65, forecast: 72, risk: "medium" },
  { name: "Osmaniye İlçe Hastanesi", cap: 280, icu: 32, load: 88, forecast: 95, risk: "high" },
  { name: "İskenderun Askeri Hastane", cap: 350, icu: 48, load: 54, forecast: 60, risk: "low" },
];

export type AIRecommendation = {
  id: number;
  sev: string;
  conf: number;
  title: string;
  area: string;
  impact: string;
  action: string;
  evidence: string[];
  reasoning: string;
  model: string;
  /** CON-008 / QLT-006 — öneriyi üreten girdi fonksiyonları. */
  sourceFunctions: string[];
};

export const aiRecs: AIRecommendation[] = [
  {
    id: 1,
    sev: "critical",
    conf: 94,
    title: "YBÜ Aşım Riski — Adana",
    area: "Adana İli",
    impact: "3 hastane YBÜ kapasitesini 8 saat içinde aşacak",
    action: "Ankara rezervinden 120 ek YBÜ yatağı ön konuşlan",
    evidence: [
      "Gerçek zamanlı yatış oranları (+%340)",
      "Tıbbi talep tahmini modeli v2.4",
      "Bölgesel nüfus maruziyet analizi",
    ],
    reasoning: "Mevcut yatış hızında YBÜ kapasitesi kritik eşiği 6–8 saat içinde aşacak.",
    model: "MedCapAI v3.1",
    sourceFunctions: ["PF-EMG01", "PF-DAT04", "PF-AI04"],
  },
  {
    id: 2,
    sev: "high",
    conf: 87,
    title: "Lojistik Koridor Kesintisi — C-02",
    area: "E-90 Otoyolu (Mersin–Hatay)",
    impact: "Birincil ikmal hattı 6–8 saat içinde riskli",
    action: "D-817 alternatif güzergahını etkinleştir",
    evidence: ["Yol yapısal izleme sensörleri", "Trafik akışı anomali tespiti", "Altyapı kırılganlık modeli"],
    reasoning: "Yol yük sensörleri %23 normal dışı değer gösteriyor.",
    model: "RouteRiskAI v2.2",
    sourceFunctions: ["PF-AI03", "PF-GET03", "PF-RSK01"],
  },
  {
    id: 3,
    sev: "high",
    conf: 91,
    title: "SN-07 Su Rezervi — Kritik Eşik",
    area: "Hatay İli (12 güvenli düğüm)",
    impact: "45.000 kişi için 12 saat içinde su tedariki kritik",
    action: "Adıyaman deposundan 8 adet su tankeri sevk et",
    evidence: ["IoT su seviyesi sensörleri (%18 doluluk)", "Nüfus bazlı tüketim modeli", "İkmal rotası kontrol"],
    reasoning: "Mevcut tüketim hızıyla 11.4 saatte depo tamamen boşalacak.",
    model: "LogisticsAI v1.8",
    sourceFunctions: ["PF-DAT02", "PF-GET08", "PF-AI04"],
  },
];

export const resourceItems = [
  { name: "Çadır", icon: "package-variant", stock: 8420, demand: 12000, unit: "adet", pct: 70 },
  { name: "Su", icon: "water", stock: 340000, demand: 420000, unit: "L", pct: 81 },
  { name: "Gıda", icon: "food-apple", stock: 125000, demand: 180000, unit: "kg", pct: 69 },
  { name: "Yakıt", icon: "fuel", stock: 85000, demand: 95000, unit: "L", pct: 89 },
  { name: "İlaç", icon: "pill", stock: 72, demand: 100, unit: "%", pct: 72 },
  { name: "Jeneratör", icon: "engine", stock: 340, demand: 500, unit: "adet", pct: 68 },
];

// ===== GIS OPERASYONEL VERİ =====
/**
 * Konumlar WGS84 (EPSG:4326) enlem/boylam olarak tutulur — DSN-002 uyarınca
 * OSM tabanlı harita servisiyle ve PostGIS geometrileriyle aynı referans sistemi.
 * Yer seçimleri 6 Şubat senaryosunun etkilediği Doğu Akdeniz illerini temsil eder.
 */
export const GIS_HOSPITALS = [
  { id: "H1", name: "Adana Şehir Hastanesi", short: "Adana", lat: 37.045, lng: 35.345, load: 94, risk: "critical" },
  { id: "H2", name: "Hatay Devlet Hastanesi", short: "Hatay", lat: 36.202, lng: 36.161, load: 112, risk: "critical" },
  { id: "H3", name: "Mersin Eğitim Hastanesi", short: "Mersin", lat: 36.803, lng: 34.634, load: 78, risk: "high" },
  { id: "H4", name: "Gaziantep Tıp Merkezi", short: "Gaz.", lat: 37.062, lng: 37.379, load: 65, risk: "medium" },
  { id: "H5", name: "Osmaniye İlçe Hastanesi", short: "Osm.", lat: 37.075, lng: 36.247, load: 88, risk: "high" },
  { id: "H6", name: "Konya Bölge Hastanesi", short: "Konya", lat: 37.874, lng: 32.493, load: 42, risk: "low" },
];

export const GIS_SAFE_NODES = [
  { id: "SN-01", lat: 37.058, lng: 35.463, water: 72, food: 68, tents: 60, days: 8 },
  { id: "SN-03", lat: 36.425, lng: 36.503, water: 28, food: 45, tents: 35, days: 3 },
  { id: "SN-05", lat: 36.917, lng: 34.895, water: 88, food: 82, tents: 75, days: 14 },
  { id: "SN-07", lat: 37.181, lng: 36.735, water: 15, food: 38, tents: 42, days: 2 },
];

export const GIS_WAREHOUSES = [
  { id: "W1", name: "Ankara Ulusal", lat: 39.925, lng: 32.866 },
  { id: "W2", name: "Adıyaman", lat: 37.764, lng: 38.278 },
  { id: "W3", name: "Kayseri", lat: 38.733, lng: 35.487 },
];

export const GIS_PORTS = [
  { id: "P1", name: "Mersin Limanı", lat: 36.786, lng: 34.629 },
  { id: "P2", name: "İskenderun Limanı", lat: 36.583, lng: 36.168 },
  { id: "P3", name: "Cilvegözü Sınır Kapısı", lat: 36.231, lng: 36.683 },
];

/**
 * Koridorlar üç noktalı (başlangıç–ara–bitiş) polyline olarak tanımlıdır;
 * ara nokta güzergâhın gerçek D/O yol geometrisini kabaca izler.
 */
export const GIS_CORRIDORS = [
  { id: "C-01", label: "C-01 Ankara → Adana", coords: [[39.925, 32.866], [38.372, 34.032], [37.045, 35.345]], status: "operational", risk: 22, load: 68, color: C.success, international: false },
  { id: "C-02", label: "C-02 Mersin → Hatay", coords: [[36.803, 34.634], [36.900, 35.500], [36.202, 36.161]], status: "risky", risk: 82, load: 91, color: C.danger, international: false },
  { id: "C-03", label: "C-03 Adana → Gaziantep", coords: [[37.045, 35.345], [37.180, 36.320], [37.062, 37.379]], status: "constrained", risk: 45, load: 74, color: C.warning, international: false },
  { id: "C-04", label: "C-04 Konya → Adana", coords: [[37.874, 32.493], [37.420, 33.980], [37.045, 35.345]], status: "operational", risk: 18, load: 45, color: C.success, international: false },
  { id: "C-05", label: "C-05 İskenderun → Hatay", coords: [[36.583, 36.168], [36.400, 36.200], [36.202, 36.161]], status: "constrained", risk: 68, load: 88, color: C.warning, international: false },
  { id: "INTL", label: "Akdeniz Yardım Koridoru", coords: [[37.507, 15.087], [34.400, 25.000], [36.786, 34.629]], status: "operational", risk: 10, load: 55, color: C.gis, international: true },
  { id: "W2H1", label: "Adıyaman → Adana İkmal", coords: [[37.764, 38.278], [37.550, 36.800], [37.045, 35.345]], status: "operational", risk: 15, load: 72, color: C.ai, international: false },
];

/** Isı haritası odakları — yarıçaplar metre cinsindendir. */
export const GIS_HEAT = {
  medicalDemand: [
    { lat: 37.045, lng: 35.345, radius: 95000, color: C.critical, intensity: 0.42 },
    { lat: 36.202, lng: 36.161, radius: 80000, color: C.danger, intensity: 0.38 },
    { lat: 36.803, lng: 34.634, radius: 60000, color: C.warning, intensity: 0.26 },
  ],
  resourceDeficit: [{ lat: 36.700, lng: 36.100, radius: 130000, color: C.ai, intensity: 0.24 }],
  population: [
    { lat: 41.008, lng: 28.978, radius: 120000, color: C.blue, intensity: 0.26 },
    { lat: 39.925, lng: 32.866, radius: 90000, color: C.blue, intensity: 0.18 },
    { lat: 38.423, lng: 27.143, radius: 75000, color: C.blue, intensity: 0.16 },
  ],
};

/**
 * Deprem risk ısı haritası — PF-AI01 (Hazard Modeli) × PF-AI02 (Risk Modeli)
 * çıktısının gösterim katmanı. `pga` 475 yıllık dönüş periyodu için en büyük yer
 * ivmesini (g), `score` ise maruziyet (PF-DAT04) ve kırılganlıkla (PF-DAT05)
 * ağırlıklandırılmış 0–100 bileşik risk skorunu ifade eder. Renk `hazardColor`
 * ile skordan türetilir; veri kümesinde renk tutulmaz.
 */
export const GIS_SEISMIC_RISK = [
  { id: "SR-01", name: "Pazarcık Segmenti (DAF)", lat: 37.49, lng: 37.29, radius: 115000, pga: 0.62, score: 96 },
  { id: "SR-02", name: "Antakya – Amanos (ÖDF)", lat: 36.20, lng: 36.16, radius: 85000, pga: 0.58, score: 94 },
  { id: "SR-03", name: "Elbistan Segmenti (DAF)", lat: 38.20, lng: 37.20, radius: 95000, pga: 0.55, score: 91 },
  { id: "SR-04", name: "Nurdağı – İslahiye", lat: 37.17, lng: 36.73, radius: 70000, pga: 0.48, score: 85 },
  { id: "SR-05", name: "Adıyaman – Gölbaşı", lat: 37.76, lng: 38.28, radius: 78000, pga: 0.45, score: 80 },
  { id: "SR-06", name: "Osmaniye – Toprakkale", lat: 37.07, lng: 36.25, radius: 60000, pga: 0.4, score: 76 },
  { id: "SR-07", name: "Ceyhan Ovası", lat: 37.03, lng: 35.82, radius: 68000, pga: 0.38, score: 72 },
  { id: "SR-08", name: "Malatya – Pütürge", lat: 38.35, lng: 38.31, radius: 72000, pga: 0.42, score: 78 },
  { id: "SR-09", name: "Marmara Denizi Segmenti (KAF)", lat: 40.78, lng: 28.60, radius: 105000, pga: 0.47, score: 92 },
  { id: "SR-10", name: "Düzce – Bolu (KAF)", lat: 40.84, lng: 31.16, radius: 72000, pga: 0.5, score: 87 },
  { id: "SR-11", name: "Erzincan Havzası (KAF)", lat: 39.75, lng: 39.49, radius: 80000, pga: 0.48, score: 83 },
  { id: "SR-12", name: "Mersin – Tarsus", lat: 36.92, lng: 34.90, radius: 60000, pga: 0.18, score: 38 },
  { id: "SR-13", name: "Konya Kapalı Havzası", lat: 37.87, lng: 32.49, radius: 90000, pga: 0.1, score: 18 },
  { id: "SR-14", name: "Ankara Platosu", lat: 39.93, lng: 32.87, radius: 85000, pga: 0.12, score: 22 },
];

/**
 * Ana diri fay zonlarının yaklaşık yüzey izleri (KAF / DAF / Ölü Deniz).
 * Deprem risk katmanının bağlam çizgisidir — ısı odaklarının neden bu hat
 * boyunca yoğunlaştığını görünür kılar.
 */
export const GIS_FAULTS = [
  {
    id: "KAF",
    name: "Kuzey Anadolu Fay Zonu",
    coords: [
      [39.27, 41.0], [39.75, 39.49], [40.1, 38.3], [40.3, 37.0], [40.6, 36.0],
      [40.78, 35.0], [40.8, 33.6], [40.75, 31.16], [40.75, 30.0], [40.78, 28.6], [40.6, 27.1],
    ],
  },
  {
    id: "DAF",
    name: "Doğu Anadolu Fay Zonu",
    coords: [
      [39.27, 41.0], [38.7, 39.8], [38.35, 38.31], [38.0, 37.6], [37.49, 37.29],
      [37.17, 36.73], [36.7, 36.3],
    ],
  },
  {
    id: "ODF",
    name: "Ölü Deniz Fay Zonu (kuzey uzanım)",
    coords: [[36.7, 36.3], [36.2, 36.16], [35.7, 36.05]],
  },
];

/** YZ tahmin katmanı — CON-007 gereği yalnız gösterim, karar insan onayına bağlı. */
export const GIS_AI_ZONES = [
  {
    id: "AIZ-1",
    label: "YZ: YBÜ Aşım Riski",
    kind: "rect" as const,
    bounds: [[36.55, 34.95], [37.45, 37.05]],
    color: C.ai,
  },
  {
    id: "AIZ-2",
    label: "Su Açığı Riski",
    kind: "circle" as const,
    lat: 36.30,
    lng: 36.30,
    radius: 85000,
    color: C.warning,
  },
];

/** Başlangıç görünümü — Türkiye + Akdeniz havzası (SW, NE köşeleri). */
export const MAP_BOUNDS: [[number, number], [number, number]] = [
  [31.0, 13.5],
  [43.0, 45.0],
];

/** Operasyon bölgesine odaklanmış ikincil görünüm (Doğu Akdeniz). */
export const MAP_FOCUS: { center: [number, number]; zoom: number } = {
  center: [36.95, 35.60],
  zoom: 7,
};

// ===== SAFE NODE ENVANTERİ (PF-GET07 / PF-GET08) =====
export const safeNodeInventory = [
  { id: "SN-01", loc: "Adana – Sarıçam", water: 72, food: 68, medical: 85, tents: 60, days: 8, priority: "medium" },
  { id: "SN-03", loc: "Hatay – Kumlu", water: 28, food: 45, medical: 40, tents: 35, days: 3, priority: "critical" },
  { id: "SN-05", loc: "Mersin – Tarsus", water: 88, food: 82, medical: 90, tents: 75, days: 14, priority: "low" },
  { id: "SN-07", loc: "Gaziantep", water: 15, food: 38, medical: 55, tents: 42, days: 2, priority: "critical" },
  { id: "SN-09", loc: "Osmaniye", water: 65, food: 70, medical: 72, tents: 68, days: 10, priority: "low" },
];

export const depots = [
  { name: "Adıyaman Merkez Depo", region: "Güneydoğu", stock: 88, cover: "142K kişi", prep: 76, status: "online" },
  { name: "Gaziantep Lojistik Üssü", region: "Güneydoğu", stock: 72, cover: "98K kişi", prep: 68, status: "online" },
  { name: "Ankara Ulusal Rezerv", region: "İç Anadolu", stock: 95, cover: "Ulusal", prep: 94, status: "online" },
  { name: "Mersin Liman Deposu", region: "Akdeniz", stock: 61, cover: "65K kişi", prep: 55, status: "degraded" },
  { name: "İskenderun Deniz Üssü", region: "Akdeniz", stock: 45, cover: "40K kişi", prep: 42, status: "degraded" },
  { name: "Konya Orta Anadolu", region: "İç Anadolu", stock: 80, cover: "55K kişi", prep: 82, status: "online" },
];

export const internationalFlows = [
  { country: "Yunanistan", flag: "🇬🇷", type: "Gelen", resource: "12 arama-kurtarma uzmanı + ekipman", eta: "Mevcut", status: "online" },
  { country: "Almanya", flag: "🇩🇪", type: "Gelen", resource: "THW teknik yardım ekibi (28 kişi)", eta: "4 saat", status: "online" },
  { country: "Fransa", flag: "🇫🇷", type: "Gelen", resource: "Tıbbi malzeme 8 ton + 2 doktor", eta: "6 saat", status: "degraded" },
  { country: "İtalya", flag: "🇮🇹", type: "Gelen", resource: "USAR ekibi (15 kişi)", eta: "8 saat", status: "online" },
  { country: "AB Fonu", flag: "🇪🇺", type: "Gelen", resource: "Acil insani yardım €2.4M", eta: "Onay bekliyor", status: "degraded" },
  { country: "Türkiye → Suriye", flag: "🇸🇾", type: "Giden", resource: "İnsani yardım konvoyu 3 TIR", eta: "Yolda", status: "online" },
];

export const platformUsers = [
  { name: "Gen. Yılmaz K.", email: "y.kurt@afad.gov.tr", role: "AFAD", title: "Ulusal Koordinatör", mfa: true, last: "Bugün 08:14", status: "online" },
  { name: "Dr. Özlem S.", email: "o.sahin@saglik.gov.tr", role: "MOH", title: "Tıbbi Koordinatör", mfa: true, last: "Bugün 09:32", status: "online" },
  { name: "Uzm. Mert A.", email: "m.acar@medaigency.gov.tr", role: "ADMIN", title: "Sistem Yöneticisi", mfa: true, last: "Bugün 11:05", status: "online" },
  { name: "Kdr. Fatih D.", email: "f.demir@112.gov.tr", role: "E112", title: "Sevk Amiri", mfa: true, last: "Bugün 13:44", status: "online" },
  { name: "Uzm. Elif D.", email: "e.demir@kizilay.org.tr", role: "KIZILAY", title: "Lojistik Sorumlusu", mfa: true, last: "Bugün 12:20", status: "online" },
  { name: "Uzm. Asiye K.", email: "a.kaya@afad.gov.tr", role: "AFAD", title: "Veri Analisti", mfa: false, last: "Dün 17:22", status: "offline" },
];

// ===== PF-DAT — VERİ TOPLAMA KAYNAK DURUMU =====
export const dataSources = [
  { pf: "PF-DAT01", name: "Stok Noktası Konumları", provider: "AFAD · Kızılay", gateway: "Koordinasyon", records: "1.284 nokta", freq: "5 dk", lastSync: "12 sn önce", status: "online", latency: 210 },
  { pf: "PF-DAT02", name: "Kaynak Miktarları", provider: "AFAD · Kızılay", gateway: "Koordinasyon", records: "18.940 kalem", freq: "5 dk", lastSync: "12 sn önce", status: "online", latency: 340 },
  { pf: "PF-DAT03", name: "Gözlemevi Verisi (Kandilli)", provider: "Kandilli API", gateway: "Doğrudan API", records: "428 olay/24s", freq: "30 sn", lastSync: "8 sn önce", status: "online", latency: 120 },
  { pf: "PF-DAT04", name: "Bina Maruziyet Verisi", provider: "AFAD", gateway: "Koordinasyon", records: "6.2M yapı", freq: "Günlük", lastSync: "4 sa önce", status: "online", latency: 1840 },
  { pf: "PF-DAT05", name: "Bina Kırılganlık Verisi", provider: "AFAD", gateway: "Koordinasyon", records: "142 eğri seti", freq: "Haftalık", lastSync: "2 gün önce", status: "degraded", latency: 2600 },
  { pf: "PF-DAT06", name: "OSM Harita / Yol Ağı", provider: "Admin (OSM Servisi)", gateway: "Backoffice", records: "PostGIS 4.8 GB", freq: "Manuel", lastSync: "18 sa önce", status: "online", latency: 0 },
  { pf: "PF-EMG01", name: "Hastane Acil Servis Doluluğu", provider: "Sağlık Bakanlığı", gateway: "Acil Durum", records: "1.140 tesis", freq: "60 sn", lastSync: "22 sn önce", status: "online", latency: 480 },
  { pf: "PF-EMG02", name: "Acil Olay / İhbar Noktaları", provider: "112", gateway: "Acil Durum", records: "3.812 aktif", freq: "Anlık", lastSync: "2 sn önce", status: "online", latency: 90 },
  { pf: "PF-EMG03", name: "Ambulans Koordinatları", provider: "112", gateway: "Acil Durum", records: "642 araç", freq: "Anlık", lastSync: "1 sn önce", status: "online", latency: 60 },
];

// ===== PF-AI / PF-GET — MODEL ORKESTRASYONU =====
export type ModelDef = {
  pf: string;
  getPf: string[];
  name: string;
  engine: string;
  subsystem: string;
  actor: string;
  inputs: string[];
  desc: string;
  lastRun: string;
  duration: string;
  status: "idle" | "ready" | "stale";
  color: string;
};

export const models: ModelDef[] = [
  {
    pf: "PF-AI01",
    getPf: ["PF-GET01"],
    name: "Hazard Modeli",
    engine: "OpenQuake Hazard",
    subsystem: "Dağıtım Sistemi",
    actor: "AFAD",
    inputs: ["PF-DAT03"],
    desc: "Gözlemevi ve sismotektonik girdilerle sismik tehlike dağılımı üretir.",
    lastRun: "Bugün 06:42",
    duration: "8 dk 12 sn",
    status: "ready",
    color: C.warning,
  },
  {
    pf: "PF-AI02",
    getPf: ["PF-GET02"],
    name: "Risk Modeli",
    engine: "OpenQuake Risk",
    subsystem: "Dağıtım Sistemi",
    actor: "AFAD",
    inputs: ["PF-GET01", "PF-DAT04", "PF-DAT05"],
    desc: "Hazard çıktısını maruziyet ve kırılganlıkla birleştirip bina hasarı ve kayıp tahmini üretir.",
    lastRun: "Bugün 07:05",
    duration: "14 dk 40 sn",
    status: "ready",
    color: C.danger,
  },
  {
    pf: "PF-AI03",
    getPf: ["PF-GET03"],
    name: "Yol Riski Modeli",
    engine: "Road Risk Service",
    subsystem: "Dağıtım Sistemi",
    actor: "AFAD",
    inputs: ["PF-GET02", "PF-DAT06", "PF-RSK01"],
    desc: "Bina hasar tahmini, OSM yol verisi ve saha girdisinden yol/altyapı riskini türetir.",
    lastRun: "Bugün 07:31",
    duration: "3 dk 55 sn",
    status: "stale",
    color: C.critical,
  },
  {
    pf: "PF-AI04",
    getPf: ["PF-GET07", "PF-GET08"],
    name: "Yerel Optimizasyon",
    engine: "RL Optimizasyon Servisi",
    subsystem: "Sistem Alt Sistemi",
    actor: "AFAD",
    inputs: ["PF-DAT01", "PF-DAT02", "PF-GET03"],
    desc: "Ülke içi kaynak tahsisi ve ön konuşlanmayı stok, talep ve risk çıktılarına göre optimize eder.",
    lastRun: "Bugün 08:00",
    duration: "6 dk 20 sn",
    status: "ready",
    color: C.ai,
  },
  {
    pf: "PF-AI05",
    getPf: [],
    name: "Küresel (Çok-Etmenli) Optimizasyon",
    engine: "Multi-Agent RL",
    subsystem: "Sistem Alt Sistemi",
    actor: "Admin",
    inputs: ["PF-AI04", "DEP-007"],
    desc: "Sınır ötesi kaynak paylaşımı ve uluslararası yardım akışlarını koordine eder.",
    lastRun: "Dün 22:10",
    duration: "22 dk 05 sn",
    status: "idle",
    color: C.gis,
  },
  {
    pf: "PF-AI06",
    getPf: [],
    name: "Acil Gerçek Zamanlı YZ",
    engine: "A* Koordinasyon YZ",
    subsystem: "Emergency Service",
    actor: "112",
    inputs: ["PF-EMG01", "PF-EMG02", "PF-EMG03", "PF-GET03"],
    desc: "Canlı olay, ambulans ve kapasite verisine tepki vererek sevk ve yönlendirmeyi destekler.",
    lastRun: "Sürekli",
    duration: "~1.8 sn/istek",
    status: "ready",
    color: C.info,
  },
];

// ===== PF-EMG — SEVK & YÖNLENDİRME =====
export const incidents = [
  { id: "INC-4471", loc: "Hatay – Antakya, Cumhuriyet Mah.", type: "Enkaz altı", sev: "critical", time: "14:32", persons: 4, assigned: "AMB-118" },
  { id: "INC-4470", loc: "Adana – Seyhan, Barış Mah.", type: "Yaralı", sev: "high", time: "14:28", persons: 2, assigned: "AMB-072" },
  { id: "INC-4468", loc: "Osmaniye – Merkez", type: "Tıbbi tahliye", sev: "high", time: "14:19", persons: 1, assigned: "AMB-045" },
  { id: "INC-4465", loc: "Mersin – Tarsus Sanayi", type: "Yangın / duman", sev: "medium", time: "14:02", persons: 6, assigned: "AMB-091" },
  { id: "INC-4461", loc: "Gaziantep – Şahinbey", type: "Yaralı", sev: "medium", time: "13:47", persons: 1, assigned: "—" },
];

export const ambulances = [
  { id: "AMB-118", crew: "Ekip 4", status: "Görevde", dest: "Hatay Devlet Hastanesi", eta: "6 dk", route: "D-817 (alternatif)", risk: "high" },
  { id: "AMB-072", crew: "Ekip 1", status: "Görevde", dest: "Adana Şehir Hastanesi", eta: "11 dk", route: "C-01", risk: "low" },
  { id: "AMB-045", crew: "Ekip 7", status: "Görevde", dest: "Gaziantep Tıp Merkezi", eta: "18 dk", route: "C-03", risk: "medium" },
  { id: "AMB-091", crew: "Ekip 2", status: "Yolda", dest: "Mersin Eğitim Hastanesi", eta: "9 dk", route: "C-02 kapalı → D-400", risk: "high" },
  { id: "AMB-133", crew: "Ekip 9", status: "Müsait", dest: "—", eta: "—", route: "—", risk: "low" },
];

// ===== PF-RSK01 — SAHA YOL HASARI KAYITLARI =====
export const roadDamageEntries = [
  { id: "RD-0142", segment: "E-90 / Km 214 (Mersin–Hatay)", type: "Köprü hasarı", severity: "impassable", entered: "AFAD · 13:12", note: "Viyadük orta ayak çatlağı, tam kapalı.", consumedBy: "PF-AI03" },
  { id: "RD-0141", segment: "D-817 / Km 38 (Kırıkhan)", type: "Yüzey çökmesi", severity: "restricted", entered: "AFAD · 12:48", note: "Tek şerit geçiş, ağır tonaj yasak.", consumedBy: "PF-AI03" },
  { id: "RD-0139", segment: "O-52 / Adana Çevre Yolu", type: "Enkaz / moloz", severity: "restricted", entered: "AFAD · 11:20", note: "Sağ şerit kapalı, temizleme sürüyor.", consumedBy: "PF-AI03" },
  { id: "RD-0136", segment: "D-400 / Osmaniye girişi", type: "Heyelan", severity: "passable", entered: "AFAD · 09:55", note: "Yol açıldı, hız sınırı 40 km/s.", consumedBy: "PF-AI03" },
];

// ===== PF-SYS02 — BİLDİRİMLER =====
export const notifications = [
  { id: 1, sev: "critical", title: "YBÜ kapasite eşiği aşıldı", body: "Hatay Devlet Hastanesi YBÜ doluluğu %112. Tahliye planı gerekli.", time: "14:33", pf: "PF-EMG01", read: false },
  { id: 2, sev: "critical", title: "Koridor C-02 riskli duruma geçti", body: "Yol riski modeli C-02 için risk skorunu %82'ye çıkardı.", time: "14:21", pf: "PF-GET03", read: false },
  { id: 3, sev: "high", title: "SN-07 su stoğu kritik", body: "Gaziantep güvenli düğümünde kalan su ≤ 2 gün.", time: "13:58", pf: "PF-GET08", read: false },
  { id: 4, sev: "medium", title: "Kırılganlık verisi bayatladı", body: "PF-DAT05 son senkron 2 gün önce. AFAD besleme gecikmesi.", time: "12:40", pf: "PF-DAT05", read: true },
  { id: 5, sev: "low", title: "Yerel Optimizasyon tamamlandı", body: "PF-AI04 çalıştırması 6 dk 20 sn'de tamamlandı, sonuçlar hazır.", time: "08:06", pf: "PF-AI04", read: true },
  { id: 6, sev: "low", title: "OSM veri güncellemesi uygulandı", body: "Admin tarafından yol ağı güncellendi, PostGIS senkronize.", time: "06:12", pf: "PF-DAT06", read: true },
];

// ===== PF-SYS04 — DENETİM KAYDI =====
export const auditLog = [
  { time: "14:32:18", user: "Gen. Yılmaz K.", role: "AFAD", action: "YZ Tavsiyesi Onaylandı", detail: "YBÜ yeniden konuşlanması — Adana", type: "approval", pf: "PF-AI04" },
  { time: "14:28:05", user: "Uzm. Elif D.", role: "KIZILAY", action: "Kaynak Tahsisi Değiştirildi", detail: "Su tankeri kapasitesi x8'e çıkarıldı", type: "change", pf: "PF-GET08" },
  { time: "14:15:42", user: "Uzm. Mert A.", role: "ADMIN", action: "OSM Katmanı Güncellendi", detail: "Yol ağı verisi PostGIS'e yazıldı", type: "update", pf: "PF-DAT06" },
  { time: "14:01:30", user: "Sistem", role: "—", action: "Otomatik Veri Yenileme", detail: "AFAD entegrasyonu senkronize edildi", type: "system", pf: "PF-DAT01" },
  { time: "13:58:22", user: "Kdr. Fatih D.", role: "E112", action: "Giriş", detail: "Çok faktörlü doğrulama ile giriş yapıldı", type: "auth", pf: "PF-SYS01" },
  { time: "13:45:10", user: "Uzm. Mert A.", role: "ADMIN", action: "Log Dışa Aktarıldı", detail: "Günlük operasyon denetim kaydı indirildi", type: "export", pf: "PF-SYS04" },
  { time: "13:12:04", user: "Gen. Yılmaz K.", role: "AFAD", action: "Saha Verisi Girildi", detail: "RD-0142 E-90 köprü hasarı kaydı", type: "change", pf: "PF-RSK01" },
];

// ===== PF-SYS03 — VAULT =====
export const vaultEntries = [
  { key: "afad/integration/api-key", scope: "Koordinasyon Gateway", type: "API Anahtarı", rotated: "12 gün önce", ttl: "90 gün", status: "online" },
  { key: "kizilay/integration/api-key", scope: "Koordinasyon Gateway", type: "API Anahtarı", rotated: "12 gün önce", ttl: "90 gün", status: "online" },
  { key: "moh/fhir/client-secret", scope: "Acil Durum Gateway", type: "OAuth Sırrı", rotated: "44 gün önce", ttl: "90 gün", status: "online" },
  { key: "e112/dispatch/mtls-cert", scope: "Acil Durum Gateway", type: "mTLS Sertifikası", rotated: "78 gün önce", ttl: "90 gün", status: "degraded" },
  { key: "postgis/primary/credentials", scope: "Dağıtım Sistemi", type: "DB Kimlik Bilgisi", rotated: "5 gün önce", ttl: "30 gün", status: "online" },
  { key: "redis/stream/auth-token", scope: "Olay Akış Çekirdeği", type: "Token", rotated: "91 gün önce", ttl: "90 gün", status: "offline" },
  { key: "jwt/signing/rsa-private", scope: "Auth Servisi", type: "İmzalama Anahtarı", rotated: "20 gün önce", ttl: "180 gün", status: "online" },
];
