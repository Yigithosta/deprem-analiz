import type { ActorId, Permission } from "../auth/roles";

/**
 * API sözleşmesi — istemci ile gateway'ler arasındaki veri biçimleri.
 *
 * Gerçek sunucu ile sahte sunucu aynı tipleri döndürür; ekranlar hangisinin
 * çalıştığını bilmez.
 */

/* ───────────── Kimlik doğrulama ───────────── */

export type Session = {
  accessToken: string;
  refreshToken: string;
  /** Erişim token'ının bitiş zamanı (epoch ms). */
  expiresAt: number;
  actor: ActorId;
  permissions: Permission[];
  user: { name: string; title: string; email: string };
};

export type LoginRequest = { actor: ActorId; email: string; password: string; otp: string };

/* ───────────── Bildirim ve denetim ───────────── */

export type Severity = "critical" | "high" | "medium" | "low";

export type Notification = {
  id: number;
  sev: Severity;
  title: string;
  body: string;
  time: string;
  /** Bildirimi üreten kurum veya servis. */
  source: string;
  read: boolean;
};

export type AuditType = "approval" | "rejection" | "change" | "update" | "system" | "auth" | "export";

export type AuditEntry = {
  time: string;
  user: string;
  role: string;
  action: string;
  detail: string;
  type: AuditType;
  /** İşlemin ait olduğu modül (ör. "Oturum", "YZ Önerisi"). */
  module: string;
};

export type LogExport = { filename: string; mime: string; content: string; records: number };

/* ───────────── YZ modelleri ───────────── */

export type ModelId = "hazard" | "risk" | "roadRisk" | "localOptimization" | "globalOptimization" | "emergency";

export type JobStatus = "queued" | "running" | "done" | "failed";

export type ModelJob = {
  jobId: string;
  model: ModelId;
  status: JobStatus;
  progress: number;
  startedAt: string;
  finishedAt?: string;
  error?: string;
};

export type ResultRow = { label: string; value: string; tone?: "danger" | "warning" | "success" | "info" };

export type ModelResult = {
  model: ModelId;
  title: string;
  generatedAt: string;
  jobId: string | null;
  summary: ResultRow[];
  /** Sonucu üreten girdi verileri. */
  inputs: string[];
};

/** Dağıtım Sistemi'nde tutulan girdi veri kümeleri. */
export type DistributionDataset = "observatory" | "exposure" | "fragility";

export type DatasetSnapshot = {
  dataset: DistributionDataset;
  title: string;
  source: string;
  updatedAt: string;
  columns: string[];
  rows: string[][];
};

/* ───────────── YZ önerileri ───────────── */

export type RecommendationStatus = "pending" | "approved" | "rejected" | "recomputing";

export type Decision = {
  status: "approved" | "rejected";
  by: string;
  at: string;
  reason?: string;
};

export type Recommendation = {
  id: number;
  sev: Severity;
  conf: number;
  title: string;
  area: string;
  impact: string;
  action: string;
  evidence: string[];
  reasoning: string;
  model: string;
  inputs: string[];
  status: RecommendationStatus;
  decision?: Decision;
};

/* ───────────── Saha verisi, harita, vault ───────────── */

export type RoadDamage = {
  id: string;
  segment: string;
  type: string;
  severity: "passable" | "restricted" | "impassable";
  entered: string;
  note: string;
  consumedBy: string;
};

export type NewRoadDamage = Pick<RoadDamage, "segment" | "type" | "severity" | "note">;

export type OsmUpdate = { jobId: string; region: string; status: JobStatus; finishedAt?: string };

export type VaultEntry = {
  key: string;
  scope: string;
  type: string;
  rotated: string;
  ttl: string;
  status: "online" | "degraded" | "offline";
};

/* ───────────── Hata ───────────── */

export type ApiErrorBody = { code: string; message: string };
