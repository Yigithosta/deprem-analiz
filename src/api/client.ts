import { API_BASE_URL } from "./config";
import { ApiError, HttpTransport, type Method, type Transport } from "./http";
import { MockTransport } from "./mockServer";
import type {
  AuditEntry,
  DatasetSnapshot,
  DistributionDataset,
  LogExport,
  LoginRequest,
  ModelId,
  ModelJob,
  ModelResult,
  NewRoadDamage,
  Notification,
  OsmUpdate,
  Recommendation,
  RoadDamage,
  Session,
  VaultEntry,
} from "./types";

/**
 * MEDAIGENCY API istemcisi.
 *
 * Kurumlar üç gateway üzerinden bağlanır: Koordinasyon (AFAD, Kızılay), Acil
 * Durum (Sağlık Bakanlığı, 112) ve Backoffice (yönetim). İstemci erişim
 * token'ını taşır, süresi dolmak üzereyken yeniler ve sunucu "süre doldu"
 * dediğinde isteği bir kez tekrarlar.
 */

const transport: Transport = API_BASE_URL ? new HttpTransport(API_BASE_URL) : new MockTransport();

/** Erişim token'ı bu kadar süre içinde dolacaksa istekten önce yenilenir. */
const REFRESH_MARGIN_MS = 30_000;

/** Model tetikleme ve sonuç alma çağrılarının geçtiği gateway. */
const MODEL_GATEWAY: Record<ModelId, "coordination" | "emergency" | "backoffice"> = {
  hazard: "coordination",
  risk: "coordination",
  roadRisk: "coordination",
  localOptimization: "coordination",
  globalOptimization: "backoffice",
  emergency: "emergency",
};

let session: Session | null = null;
let refreshing: Promise<void> | null = null;
let listener: ((s: Session | null) => void) | null = null;

function setSession(next: Session | null) {
  session = next;
  listener?.(next);
}

/** Oturum dışarıdan sonlandığında (yenileme reddi gibi) uygulamayı haberdar eder. */
export function onSessionChange(fn: (s: Session | null) => void) {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

async function refresh() {
  if (!session) return;
  if (!refreshing) {
    const refreshToken = session.refreshToken;
    refreshing = transport
      .send<Session>({ method: "POST", path: "/auth/refresh", body: { refreshToken } })
      .then((s) => setSession(s))
      .catch((e) => {
        setSession(null);
        throw e;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  await refreshing;
}

async function call<T>(method: Method, path: string, body?: unknown, retry = true): Promise<T> {
  if (session && session.expiresAt - Date.now() < REFRESH_MARGIN_MS) await refresh();
  try {
    return await transport.send<T>({ method, path, body, token: session?.accessToken });
  } catch (e) {
    if (retry && session && e instanceof ApiError && e.status === 401 && e.code === "token_expired") {
      await refresh();
      return call<T>(method, path, body, false);
    }
    if (session && e instanceof ApiError && e.status === 401) setSession(null);
    throw e;
  }
}

const enc = encodeURIComponent;

export const api = {
  auth: {
    async login(req: LoginRequest): Promise<Session> {
      const s = await transport.send<Session>({ method: "POST", path: "/auth/login", body: req });
      setSession(s);
      return s;
    },
    async logout(): Promise<void> {
      if (!session) return;
      const refreshToken = session.refreshToken;
      try {
        await call<void>("POST", "/auth/logout", { refreshToken });
      } finally {
        setSession(null);
      }
    },
  },

  notifications: {
    list: () => call<Notification[]>("GET", "/notifications"),
    markRead: (id: number) => call<void>("POST", `/notifications/${id}/read`),
    markAllRead: () => call<void>("POST", "/notifications/read-all"),
  },

  recommendations: {
    list: () => call<Recommendation[]>("GET", "/backoffice/recommendations"),
    decide: (id: number, decision: "approved" | "rejected", reason?: string) =>
      call<Recommendation>("POST", `/backoffice/recommendations/${id}/decision`, { decision, reason }),
    recompute: (id: number) => call<Recommendation>("POST", `/backoffice/recommendations/${id}/recompute`),
  },

  models: {
    trigger: (model: ModelId) => call<ModelJob>("POST", `/${MODEL_GATEWAY[model]}/models/${model}/jobs`),
    job: (jobId: string) => call<ModelJob>("GET", `/jobs/${enc(jobId)}`),
    results: (model: ModelId) => call<ModelResult>("GET", `/${MODEL_GATEWAY[model]}/models/${model}/results`),
  },

  datasets: {
    get: (dataset: DistributionDataset) => call<DatasetSnapshot>("GET", `/coordination/datasets/${dataset}`),
  },

  roadDamage: {
    list: () => call<RoadDamage[]>("GET", "/coordination/road-damage"),
    create: (entry: NewRoadDamage) => call<RoadDamage>("POST", "/coordination/road-damage", entry),
  },

  osm: {
    start: (region: string) => call<OsmUpdate>("POST", "/backoffice/osm/updates", { region }),
    status: (jobId: string) => call<OsmUpdate>("GET", `/backoffice/osm/updates/${enc(jobId)}`),
  },

  audit: {
    list: () => call<AuditEntry[]>("GET", "/backoffice/audit"),
    export: () => call<LogExport>("GET", "/backoffice/audit/export?format=csv"),
  },

  vault: {
    list: () => call<VaultEntry[]>("GET", "/backoffice/vault"),
    rotate: (key: string) => call<VaultEntry>("POST", "/backoffice/vault/rotate", { key }),
    /** Yeni değer yalnızca sunucuya gönderilir; istemcide saklanmaz. */
    update: (key: string, value: string) => call<VaultEntry>("PUT", "/backoffice/vault/value", { key, value }),
  },
};

/** Hata nesnesinden kullanıcıya gösterilecek metni çıkarır. */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Beklenmeyen bir hata oluştu.";
}
