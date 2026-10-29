import {
  DATASET_PERMISSION,
  MODEL_RESULT_PERMISSION as RESULT_PERMISSION,
  MODEL_RUN_PERMISSION as RUN_PERMISSION,
  ROLE_BY_ID,
  type ActorId,
  type Permission,
} from "../auth/roles";
import {
  aiRecs,
  auditLog as seedAudit,
  models as modelDefs,
  notifications as seedNotifications,
  roadDamageEntries,
  vaultEntries as seedVault,
} from "../data/mock";
import { ApiError, type ApiRequest, type Transport } from "./http";
import type {
  AuditEntry,
  AuditType,
  DatasetSnapshot,
  DistributionDataset,
  LogExport,
  LoginRequest,
  ModelId,
  ModelJob,
  ModelResult,
  Notification,
  NewRoadDamage,
  OsmUpdate,
  Recommendation,
  ResultRow,
  RoadDamage,
  Session,
  VaultEntry,
} from "./types";

/**
 * Cihaz içi sahte sunucu.
 *
 * Gerçek gateway'lerin sözleşmesini birebir uygular: token doğrulama ve
 * yenileme, rol tabanlı yetki kontrolü, asenkron model işleri, sunucu tarafında
 * tutulan denetim kaydı. Ağ gecikmesi taklit edilir. Arka uç hazır olduğunda
 * `EXPO_PUBLIC_API_URL` tanımlanır ve bu dosya devreden çıkar; ekran kodunda
 * değişiklik gerekmez.
 */

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 8 * 60 * 60 * 1000;

/** Her modelin taklit edilen çalışma süresi. */
const JOB_DURATION_MS: Record<ModelId, number> = {
  hazard: 6000,
  risk: 8000,
  roadRisk: 4000,
  localOptimization: 5000,
  globalOptimization: 7000,
  emergency: 1500,
};

const clock = () => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const randomId = (len = 24) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

/* ───────────────────────── Durum ───────────────────────── */

type TokenInfo = { actor: ActorId; exp: number; kind: "access" | "refresh" };
type JobRecord = { job: ModelJob; startMs: number; durationMs: number };
type Caller = { actor: ActorId; name: string };

const tokens = new Map<string, TokenInfo>();
const jobs = new Map<string, JobRecord>();
const osmJobs = new Map<string, { update: OsmUpdate; startMs: number }>();
const recomputeUntil = new Map<number, number>();

let notifications: Notification[] = seedNotifications.map((n) => ({ ...n, sev: n.sev as Notification["sev"] }));
let audit: AuditEntry[] = seedAudit.map((a) => ({ ...a, type: a.type as AuditType }));
let roadDamage: RoadDamage[] = roadDamageEntries.map((r) => ({ ...r, severity: r.severity as RoadDamage["severity"] }));
let vault: VaultEntry[] = seedVault.map((v) => ({ ...v, status: v.status as VaultEntry["status"] }));
let recommendations: Recommendation[] = aiRecs.map((r) => ({ ...r, sev: r.sev as Recommendation["sev"], status: "pending" }));

const results: Partial<Record<ModelId, ModelResult>> = {
  hazard: {
    model: "hazard",
    title: "Sismik tehlike dağılımı",
    generatedAt: "Bugün 06:42",
    jobId: null,
    inputs: ["Gözlemevi verisi (Kandilli)", "Sismotektonik kaynak modeli"],
    summary: [
      { label: "Senaryo", value: "Mw 7.2 · Pazarcık" },
      { label: "En yüksek PGA (475 yıl)", value: "0.62 g", tone: "danger" },
      { label: "PGA ≥ 0.4 g olan alan", value: "18.400 km²", tone: "warning" },
      { label: "Etkilenen il", value: "11" },
      { label: "Hesap ızgarası", value: "2 km · 142.000 nokta" },
    ],
  },
  risk: {
    model: "risk",
    title: "Bina hasarı ve kayıp tahmini",
    generatedAt: "Bugün 07:05",
    jobId: null,
    inputs: ["Tehlike sonuçları", "Bina maruziyet verisi", "Bina kırılganlık verisi"],
    summary: [
      { label: "Ağır hasarlı bina", value: "38.200", tone: "danger" },
      { label: "Orta hasarlı bina", value: "71.500", tone: "warning" },
      { label: "Tahmini can kaybı (baz senaryo)", value: "780", tone: "danger" },
      { label: "Yerinden edilen", value: "41.000" },
      { label: "Ekonomik kayıp", value: "₺412 milyar" },
    ],
  },
  localOptimization: {
    model: "localOptimization",
    title: "Stok noktası ve miktar planı",
    generatedAt: "Bugün 08:00",
    jobId: null,
    inputs: ["Stok noktaları", "Stok miktarları", "Yol riski sonuçları"],
    summary: [
      { label: "Önerilen sevkiyat", value: "14 rota" },
      { label: "Kapsama artışı", value: "+%23", tone: "success" },
      { label: "Kritik düğüm", value: "SN-03 · SN-07", tone: "danger" },
      { label: "Stok noktası", value: "1.284" },
      { label: "Optimize edilen kaynak kalemi", value: "18.940" },
    ],
  },
};

let roadRiskGeneratedAt = "Bugün 07:31";
let roadRiskJobId: string | null = null;

/** Yol riski sonucu, en son çalıştırmada girilmiş saha kayıtlarından türetilir. */
let roadRiskSnapshot = roadDamage.slice();
function roadRiskResult(): ModelResult {
  const closed = roadRiskSnapshot.filter((r) => r.severity === "impassable").length;
  const restricted = roadRiskSnapshot.filter((r) => r.severity === "restricted").length;
  const pending = roadDamage.length - roadRiskSnapshot.length;
  const summary: ResultRow[] = [
    { label: "Riskli koridor", value: "C-02 · C-05", tone: "danger" },
    { label: "Kapalı yol kesimi", value: String(closed), tone: closed ? "danger" : "success" },
    { label: "Kısıtlı yol kesimi", value: String(restricted), tone: restricted ? "warning" : "success" },
    { label: "Ortalama koridor riski", value: `%${38 + closed * 3 + restricted}` },
    { label: "Alternatif güzergah", value: "D-817 · D-400" },
  ];
  if (pending > 0) {
    summary.push({ label: "Henüz işlenmemiş saha kaydı", value: String(pending), tone: "warning" });
  }
  return {
    model: "roadRisk",
    title: "Yol ve altyapı riski",
    generatedAt: roadRiskGeneratedAt,
    jobId: roadRiskJobId,
    inputs: ["Risk sonuçları", "OSM yol ağı", `Saha yol hasarı kayıtları (${roadRiskSnapshot.length})`],
    summary,
  };
}

const datasets: Record<DistributionDataset, DatasetSnapshot> = {
  observatory: {
    dataset: "observatory",
    title: "Son deprem olayları",
    source: "Kandilli Rasathanesi",
    updatedAt: "8 sn önce",
    columns: ["Zaman", "Konum", "Büyüklük", "Derinlik"],
    rows: [
      ["11:05:12", "Adana – Seyhan", "Mw 4.1", "9.8 km"],
      ["09:32:40", "Hatay – Asi", "Mw 5.4", "11.2 km"],
      ["08:14:03", "Malatya – Pütürge", "Mw 3.8", "7.1 km"],
      ["07:51:27", "Kahramanmaraş – Elbistan", "Mw 4.6", "8.4 km"],
      ["06:17:35", "Kahramanmaraş – Pazarcık", "Mw 7.2", "10.0 km"],
    ],
  },
  exposure: {
    dataset: "exposure",
    title: "Bina maruziyet envanteri",
    source: "AFAD",
    updatedAt: "4 sa önce",
    columns: ["İl", "Bina", "Betonarme", "Yığma", "Nüfus"],
    rows: [
      ["Hatay", "412.300", "%71", "%24", "1.69 M"],
      ["Kahramanmaraş", "298.100", "%68", "%27", "1.18 M"],
      ["Gaziantep", "486.700", "%79", "%17", "2.15 M"],
      ["Adana", "601.900", "%82", "%14", "2.27 M"],
      ["Osmaniye", "158.400", "%66", "%29", "0.56 M"],
    ],
  },
  fragility: {
    dataset: "fragility",
    title: "Bina kırılganlık eğrileri (medyan PGA)",
    source: "AFAD",
    updatedAt: "2 gün önce",
    columns: ["Yapı tipi", "Hafif", "Orta", "Ağır", "Göçme"],
    rows: [
      ["Betonarme çerçeve · 1–3 kat", "0.18 g", "0.31 g", "0.52 g", "0.84 g"],
      ["Betonarme çerçeve · 4–7 kat", "0.14 g", "0.26 g", "0.44 g", "0.71 g"],
      ["Betonarme perde · 8+ kat", "0.20 g", "0.38 g", "0.63 g", "1.02 g"],
      ["Yığma · 1–2 kat", "0.11 g", "0.19 g", "0.33 g", "0.55 g"],
      ["Prefabrik endüstri yapısı", "0.16 g", "0.29 g", "0.49 g", "0.80 g"],
    ],
  },
};

/* ───────────────────────── Yardımcılar ───────────────────────── */

function fail(status: number, code: string, message: string): never {
  throw new ApiError(status, code, message);
}

function authenticate(token: string | null | undefined): Caller {
  if (!token) fail(401, "unauthenticated", "Oturum açmanız gerekiyor.");
  const info = tokens.get(token);
  if (!info || info.kind !== "access") fail(401, "invalid_token", "Oturum geçersiz. Lütfen yeniden giriş yapın.");
  if (info.exp < Date.now()) fail(401, "token_expired", "Oturum süresi doldu.");
  return { actor: info.actor, name: ROLE_BY_ID[info.actor].demoUser.name };
}

function authorize(caller: Caller, permission: Permission) {
  const role = ROLE_BY_ID[caller.actor];
  if (role.id === "ADMIN" || role.permissions.includes(permission)) return;
  fail(403, "forbidden", "Bu işlem için rolünüzün yetkisi yok.");
}

function record(caller: Caller | null, action: string, detail: string, type: AuditType, module: string) {
  audit = [
    { time: clock(), user: caller?.name ?? "Sistem", role: caller?.actor ?? "—", action, detail, type, module },
    ...audit,
  ];
}

function notify(n: Omit<Notification, "id" | "time" | "read">) {
  const id = notifications.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  notifications = [{ ...n, id, time: clock().slice(0, 5), read: false }, ...notifications];
}

function issueSession(actor: ActorId): Session {
  const accessToken = `mock-at-${randomId()}`;
  const refreshToken = `mock-rt-${randomId()}`;
  const expiresAt = Date.now() + ACCESS_TTL_MS;
  tokens.set(accessToken, { actor, exp: expiresAt, kind: "access" });
  tokens.set(refreshToken, { actor, exp: Date.now() + REFRESH_TTL_MS, kind: "refresh" });
  const role = ROLE_BY_ID[actor];
  return {
    accessToken,
    refreshToken,
    expiresAt,
    actor,
    permissions: role.permissions,
    user: { name: role.demoUser.name, title: role.demoUser.title, email: role.demoUser.email },
  };
}

const modelName = (id: ModelId) => modelDefs.find((m) => m.id === id)?.name ?? id;

/** İşin ilerlemesini geçen süreye göre günceller; biten işin sonuçlarını yayımlar. */
function advance(rec: JobRecord): ModelJob {
  const { job } = rec;
  if (job.status === "done" || job.status === "failed") return job;
  const elapsed = Date.now() - rec.startMs;
  if (elapsed < 300) {
    rec.job = { ...job, status: "queued", progress: 0 };
    return rec.job;
  }
  const progress = Math.min(100, Math.round((elapsed / rec.durationMs) * 100));
  if (progress < 100) {
    rec.job = { ...job, status: "running", progress };
    return rec.job;
  }

  const finishedAt = clock();
  rec.job = { ...job, status: "done", progress: 100, finishedAt };
  publishResult(job.model, job.jobId, finishedAt);
  record(null, "Model Çalıştırması Tamamlandı", `${modelName(job.model)} · ${job.jobId}`, "system", "YZ Modeli");
  notify({
    sev: "low",
    title: `${modelName(job.model)} tamamlandı`,
    body: "Çalıştırma bitti; sonuçlar alınmaya hazır.",
    source: modelDefs.find((m) => m.id === job.model)?.subsystem ?? "Dağıtım Sistemi",
  });
  return rec.job;
}

function publishResult(model: ModelId, jobId: string, finishedAt: string) {
  const at = `Bugün ${finishedAt.slice(0, 5)}`;
  if (model === "roadRisk") {
    roadRiskSnapshot = roadDamage.slice();
    roadRiskGeneratedAt = at;
    roadRiskJobId = jobId;
    return;
  }
  const prev = results[model];
  if (prev) results[model] = { ...prev, generatedAt: at, jobId };
}

function resultFor(model: ModelId): ModelResult | undefined {
  return model === "roadRisk" ? roadRiskResult() : results[model];
}

function settleRecommendations() {
  const now = Date.now();
  recommendations = recommendations.map((r) => {
    const until = recomputeUntil.get(r.id);
    if (r.status !== "recomputing" || !until || until > now) return r;
    recomputeUntil.delete(r.id);
    const conf = Math.max(60, Math.min(99, r.conf + Math.round(Math.random() * 6 - 3)));
    return { ...r, status: "pending", conf, decision: undefined };
  });
}

/* ───────────────────────── Yönlendirme ───────────────────────── */

type Handler = (ctx: { req: ApiRequest; params: string[]; query: URLSearchParams }) => unknown;

const routes: [string, RegExp, Handler][] = [
  /* Kimlik doğrulama */
  ["POST", /^\/auth\/login$/, ({ req }) => {
    const body = req.body as LoginRequest;
    const role = ROLE_BY_ID[body?.actor];
    if (!role) fail(400, "bad_request", "Geçersiz kurum seçimi.");
    if (body.email.trim().toLowerCase() !== role.demoUser.email) fail(401, "bad_credentials", "E-posta veya şifre hatalı.");
    if (!body.password) fail(401, "bad_credentials", "E-posta veya şifre hatalı.");
    if (!/^\d{6}$/.test(body.otp ?? "")) fail(401, "bad_otp", "Doğrulama kodu 6 haneli olmalıdır.");
    const session = issueSession(role.id);
    record({ actor: role.id, name: role.demoUser.name }, "Giriş", `Çok faktörlü doğrulama ile giriş (${role.gateway})`, "auth", "Oturum");
    return session;
  }],
  ["POST", /^\/auth\/refresh$/, ({ req }) => {
    const { refreshToken } = (req.body ?? {}) as { refreshToken?: string };
    const info = refreshToken ? tokens.get(refreshToken) : undefined;
    if (!info || info.kind !== "refresh" || info.exp < Date.now()) fail(401, "invalid_refresh", "Oturum yenilenemedi. Lütfen yeniden giriş yapın.");
    tokens.delete(refreshToken!);
    return issueSession(info.actor);
  }],
  ["POST", /^\/auth\/logout$/, ({ req }) => {
    const caller = authenticate(req.token);
    const { refreshToken } = (req.body ?? {}) as { refreshToken?: string };
    tokens.delete(req.token!);
    if (refreshToken) tokens.delete(refreshToken);
    record(caller, "Çıkış", "Oturum sonlandırıldı, token'lar iptal edildi", "auth", "Oturum");
    return undefined;
  }],

  /* Bildirimler */
  ["GET", /^\/notifications$/, ({ req }) => {
    authorize(authenticate(req.token), "notifications.view");
    return notifications;
  }],
  ["POST", /^\/notifications\/read-all$/, ({ req }) => {
    authorize(authenticate(req.token), "notifications.view");
    notifications = notifications.map((n) => ({ ...n, read: true }));
    return undefined;
  }],
  ["POST", /^\/notifications\/(\d+)\/read$/, ({ req, params }) => {
    authorize(authenticate(req.token), "notifications.view");
    const id = Number(params[0]);
    notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    return undefined;
  }],

  /* YZ önerileri */
  ["GET", /^\/backoffice\/recommendations$/, ({ req }) => {
    authenticate(req.token);
    settleRecommendations();
    return recommendations;
  }],
  ["POST", /^\/backoffice\/recommendations\/(\d+)\/decision$/, ({ req, params }) => {
    const caller = authenticate(req.token);
    authorize(caller, "recommendations.decide");
    settleRecommendations();
    const id = Number(params[0]);
    const rec = recommendations.find((r) => r.id === id) ?? fail(404, "not_found", "Öneri bulunamadı.");
    if (rec.status !== "pending") fail(409, "conflict", "Bu öneri için karar zaten verilmiş.");
    const { decision, reason } = (req.body ?? {}) as { decision?: "approved" | "rejected"; reason?: string };
    if (decision !== "approved" && decision !== "rejected") fail(400, "bad_request", "Geçersiz karar.");
    if (decision === "rejected" && !reason?.trim()) fail(400, "reason_required", "Ret kararı için gerekçe zorunludur.");
    const updated: Recommendation = {
      ...rec,
      status: decision,
      decision: { status: decision, by: caller.name, at: clock(), reason: reason?.trim() || undefined },
    };
    recommendations = recommendations.map((r) => (r.id === id ? updated : r));
    record(
      caller,
      decision === "approved" ? "YZ Önerisi Onaylandı" : "YZ Önerisi Reddedildi",
      `${rec.title}${reason?.trim() ? ` — gerekçe: ${reason.trim()}` : ""}`,
      decision === "approved" ? "approval" : "rejection",
      "YZ Önerisi"
    );
    return updated;
  }],
  ["POST", /^\/backoffice\/recommendations\/(\d+)\/recompute$/, ({ req, params }) => {
    const caller = authenticate(req.token);
    authorize(caller, "recommendations.decide");
    const id = Number(params[0]);
    const rec = recommendations.find((r) => r.id === id) ?? fail(404, "not_found", "Öneri bulunamadı.");
    recomputeUntil.set(id, Date.now() + 2500);
    const updated: Recommendation = { ...rec, status: "recomputing", decision: undefined };
    recommendations = recommendations.map((r) => (r.id === id ? updated : r));
    record(caller, "YZ Önerisi Yeniden Hesaplatıldı", rec.title, "update", "YZ Önerisi");
    return updated;
  }],

  /* Model işleri ve sonuçları */
  ["POST", /^\/(?:coordination|emergency|backoffice)\/models\/(\w+)\/jobs$/, ({ req, params }) => {
    const caller = authenticate(req.token);
    const model = params[0] as ModelId;
    if (!(model in RUN_PERMISSION)) fail(404, "not_found", "Model bulunamadı.");
    authorize(caller, RUN_PERMISSION[model]);
    const running = [...jobs.values()].find((j) => j.job.model === model && advance(j).status !== "done" && j.job.status !== "failed");
    if (running) fail(409, "already_running", "Bu model zaten çalışıyor.");
    const job: ModelJob = { jobId: `JOB-${randomId(6).toUpperCase()}`, model, status: "queued", progress: 0, startedAt: clock() };
    jobs.set(job.jobId, { job, startMs: Date.now(), durationMs: JOB_DURATION_MS[model] });
    record(caller, "Model Çalıştırma Tetiklendi", `${modelName(model)} · ${job.jobId}`, "update", "YZ Modeli");
    return job;
  }],
  ["GET", /^\/jobs\/([\w-]+)$/, ({ req, params }) => {
    authenticate(req.token);
    const rec = jobs.get(params[0]) ?? fail(404, "not_found", "İş bulunamadı.");
    return advance(rec);
  }],
  ["GET", /^\/(?:coordination|emergency|backoffice)\/models\/(\w+)\/results$/, ({ req, params }) => {
    const caller = authenticate(req.token);
    const model = params[0] as ModelId;
    const permission = RESULT_PERMISSION[model] ?? fail(404, "no_results", "Bu model için alınabilir sonuç kümesi yok.");
    authorize(caller, permission);
    jobs.forEach((j) => advance(j));
    const result = resultFor(model) ?? fail(404, "no_results", "Sonuç bulunamadı.");
    record(caller, "Model Sonuçları Alındı", `${modelName(model)} · ${result.generatedAt}`, "system", "YZ Modeli");
    return result;
  }],

  /* Dağıtım Sistemi veri kümeleri */
  ["GET", /^\/coordination\/datasets\/(\w+)$/, ({ req, params }) => {
    const caller = authenticate(req.token);
    const ds = params[0] as DistributionDataset;
    const permission = DATASET_PERMISSION[ds] ?? fail(404, "not_found", "Veri kümesi bulunamadı.");
    authorize(caller, permission);
    return datasets[ds];
  }],

  /* Saha yol hasarı */
  ["GET", /^\/coordination\/road-damage$/, ({ req }) => {
    authenticate(req.token);
    return roadDamage;
  }],
  ["POST", /^\/coordination\/road-damage$/, ({ req }) => {
    const caller = authenticate(req.token);
    authorize(caller, "roadDamage.submit");
    const body = req.body as NewRoadDamage;
    if (!body?.segment?.trim()) fail(400, "bad_request", "Yol kesimi boş olamaz.");
    const id = `RD-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const entry: RoadDamage = {
      id,
      segment: body.segment.trim(),
      type: body.type,
      severity: body.severity,
      note: body.note?.trim() || "—",
      entered: `${ROLE_BY_ID[caller.actor].short} · ${clock().slice(0, 5)}`,
      consumedBy: "Yol Riski Modeli",
    };
    roadDamage = [entry, ...roadDamage];
    record(caller, "Saha Verisi Girildi", `${id} — ${entry.segment} (${entry.type})`, "change", "Saha Verisi");
    return entry;
  }],

  /* Harita / yol ağı güncellemesi */
  ["POST", /^\/backoffice\/osm\/updates$/, ({ req }) => {
    const caller = authenticate(req.token);
    authorize(caller, "osm.update");
    const { region } = (req.body ?? {}) as { region?: string };
    const update: OsmUpdate = { jobId: `OSM-${randomId(6).toUpperCase()}`, region: region || "Türkiye", status: "running" };
    osmJobs.set(update.jobId, { update, startMs: Date.now() });
    record(caller, "Harita Güncellemesi Başlatıldı", `${update.region} OSM yol ağı · ${update.jobId}`, "update", "Harita Verisi");
    return update;
  }],
  ["GET", /^\/backoffice\/osm\/updates\/([\w-]+)$/, ({ req, params }) => {
    authenticate(req.token);
    const rec = osmJobs.get(params[0]) ?? fail(404, "not_found", "Güncelleme bulunamadı.");
    if (rec.update.status === "running" && Date.now() - rec.startMs > 3500) {
      rec.update = { ...rec.update, status: "done", finishedAt: clock() };
      record(null, "Harita Güncellemesi Tamamlandı", `${rec.update.region} · PostGIS senkronize edildi`, "system", "Harita Verisi");
      notify({ sev: "low", title: "OSM veri güncellemesi uygulandı", body: `${rec.update.region} yol ağı PostGIS'e yazıldı.`, source: "OSM Servisi" });
    }
    return rec.update;
  }],

  /* Denetim kaydı ve log dışa aktarma */
  ["GET", /^\/backoffice\/audit$/, ({ req }) => {
    authorize(authenticate(req.token), "logs.export");
    return audit;
  }],
  ["GET", /^\/backoffice\/audit\/export$/, ({ req }) => {
    const caller = authenticate(req.token);
    authorize(caller, "logs.export");
    const header = "zaman;kullanici;rol;islem;detay;tur;modul";
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = audit.map((a) => [a.time, a.user, a.role, a.action, a.detail, a.type, a.module].map(esc).join(";"));
    const date = new Date().toISOString().slice(0, 10);
    const exp: LogExport = {
      filename: `medaigency-denetim-${date}.csv`,
      mime: "text/csv",
      content: [header, ...lines].join("\n"),
      records: audit.length,
    };
    record(caller, "Log Dışa Aktarıldı", `${exp.records} kayıt · ${exp.filename}`, "export", "Log Servisi");
    return exp;
  }],

  /* Vault */
  ["GET", /^\/backoffice\/vault$/, ({ req }) => {
    authorize(authenticate(req.token), "vault.manage");
    return vault;
  }],
  ["POST", /^\/backoffice\/vault\/rotate$/, ({ req }) => {
    const caller = authenticate(req.token);
    authorize(caller, "vault.manage");
    const { key } = (req.body ?? {}) as { key?: string };
    const entry = vault.find((v) => v.key === key) ?? fail(404, "not_found", "Vault girdisi bulunamadı.");
    vault = vault.map((v) => (v.key === entry.key ? { ...v, rotated: "Az önce", status: "online" } : v));
    record(caller, "Vault Anahtarı Döndürüldü", `${entry.key} rotasyona alındı`, "change", "Vault");
    return vault.find((v) => v.key === entry.key);
  }],
  ["PUT", /^\/backoffice\/vault\/value$/, ({ req }) => {
    const caller = authenticate(req.token);
    authorize(caller, "vault.manage");
    const { key, value } = (req.body ?? {}) as { key?: string; value?: string };
    const entry = vault.find((v) => v.key === key) ?? fail(404, "not_found", "Vault girdisi bulunamadı.");
    if (!value || value.length < 8) fail(400, "weak_value", "Yeni değer en az 8 karakter olmalıdır.");
    // Değerin kendisi hiçbir yerde saklanmaz veya kaydedilmez; yalnızca meta veri güncellenir.
    vault = vault.map((v) => (v.key === entry.key ? { ...v, rotated: "Az önce", status: "online" } : v));
    record(caller, "Vault Değeri Değiştirildi", `${entry.key} yeni değerle güncellendi`, "change", "Vault");
    return vault.find((v) => v.key === entry.key);
  }],
];

/** Sahte sunucuya bağlanan taşıyıcı. */
export class MockTransport implements Transport {
  async send<T>(req: ApiRequest): Promise<T> {
    await new Promise((r) => setTimeout(r, 120 + Math.random() * 230));
    const [pathname, search = ""] = req.path.split("?");
    for (const [method, pattern, handler] of routes) {
      if (method !== req.method) continue;
      const m = pattern.exec(pathname);
      if (!m) continue;
      // Yanıtın kopyası döndürülür; ekranlar sunucu durumunu doğrudan değiştiremez.
      const out = handler({ req, params: m.slice(1), query: new URLSearchParams(search) });
      return (out === undefined ? undefined : JSON.parse(JSON.stringify(out))) as T;
    }
    fail(404, "not_found", `Uç nokta bulunamadı: ${req.method} ${pathname}`);
  }
}
