import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ROLE_BY_ID, type Role } from "../auth/roles";
import { api, onSessionChange } from "../api/client";
import { JOB_POLL_MS, NOTIFICATION_POLL_MS } from "../api/config";
import type {
  ModelId,
  ModelJob,
  NewRoadDamage,
  Notification,
  Recommendation,
  RoadDamage,
  Session,
} from "../api/types";

/**
 * Uygulama oturum ve operasyon durumu.
 *
 * Tüm okuma ve yazma işlemleri API katmanından geçer; denetim kaydı sunucu
 * tarafında tutulur, istemci yalnızca sonucu gösterir. YZ önerileri tavsiye
 * niteliğindedir ve ancak yetkili karar vericinin onayıyla uygulamaya geçer.
 */

export type Credentials = { email: string; password: string; otp: string };

type Ctx = {
  session: Session | null;
  role: Role | null;
  login: (role: Role, creds: Credentials) => Promise<void>;
  logout: () => Promise<void>;

  notifications: Notification[];
  markRead: (id: number) => void;
  markAllRead: () => void;
  unreadCount: number;

  recommendations: Recommendation[];
  decide: (id: number, decision: "approved" | "rejected", reason?: string) => Promise<void>;
  recompute: (id: number) => Promise<void>;

  roadDamage: RoadDamage[];
  addRoadDamage: (e: NewRoadDamage) => Promise<RoadDamage>;

  jobs: Partial<Record<ModelId, ModelJob>>;
  triggerModel: (model: ModelId) => Promise<void>;
  /** Girdisi değiştiği için yeniden çalıştırılması gereken modeller. */
  stale: Partial<Record<ModelId, boolean>>;

  /** Sunucudaki denetim kaydı değiştiğinde artar; denetim ekranı buna göre yenilenir. */
  auditVersion: number;
  bumpAudit: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [roadDamage, setRoadDamage] = useState<RoadDamage[]>([]);
  const [jobs, setJobs] = useState<Partial<Record<ModelId, ModelJob>>>({});
  const [stale, setStale] = useState<Partial<Record<ModelId, boolean>>>({});
  const [auditVersion, setAuditVersion] = useState(0);
  const bumpAudit = useCallback(() => setAuditVersion((v) => v + 1), []);

  const role = session ? ROLE_BY_ID[session.actor] : null;

  const reset = useCallback(() => {
    setNotifications([]);
    setRecommendations([]);
    setRoadDamage([]);
    setJobs({});
    setStale({});
  }, []);

  // Oturum sunucu tarafında sonlanırsa (yenileme reddi, iptal) uygulama giriş ekranına döner.
  useEffect(
    () =>
      onSessionChange((s) => {
        setSession(s);
        if (!s) reset();
      }),
    [reset]
  );

  const login = useCallback(async (r: Role, creds: Credentials) => {
    await api.auth.login({ actor: r.id, ...creds });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Sunucuya ulaşılamasa da yerel oturum kapanır.
    }
  }, []);

  /* ── Oturum açıldığında ilk yükleme ── */
  useEffect(() => {
    if (!session) return;
    api.notifications.list().then(setNotifications).catch(() => {});
    api.recommendations.list().then(setRecommendations).catch(() => {});
    api.roadDamage.list().then(setRoadDamage).catch(() => {});
    bumpAudit();
  }, [session?.actor]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Bildirimler ── */
  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => {
      api.notifications.list().then(setNotifications).catch(() => {});
    }, NOTIFICATION_POLL_MS);
    return () => clearInterval(t);
  }, [session?.actor]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = useCallback((id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    api.notifications.markRead(id).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api.notifications.markAllRead().catch(() => {});
  }, []);

  /* ── YZ önerileri ── */
  const decide = useCallback(
    async (id: number, decision: "approved" | "rejected", reason?: string) => {
      const updated = await api.recommendations.decide(id, decision, reason);
      setRecommendations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      bumpAudit();
    },
    [bumpAudit]
  );

  const recompute = useCallback(
    async (id: number) => {
      const updated = await api.recommendations.recompute(id);
      setRecommendations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      bumpAudit();
    },
    [bumpAudit]
  );

  const anyRecomputing = recommendations.some((r) => r.status === "recomputing");
  useEffect(() => {
    if (!anyRecomputing) return;
    const t = setInterval(() => {
      api.recommendations.list().then(setRecommendations).catch(() => {});
    }, 800);
    return () => clearInterval(t);
  }, [anyRecomputing]);

  /* ── Saha yol hasarı ── */
  const addRoadDamage = useCallback(
    async (e: NewRoadDamage) => {
      const entry = await api.roadDamage.create(e);
      setRoadDamage((prev) => [entry, ...prev]);
      // Yol riski modeli yeni girdiyle bayatlar; yeniden çalıştırılana kadar uyarı gösterilir.
      setStale((prev) => ({ ...prev, roadRisk: true }));
      bumpAudit();
      return entry;
    },
    [bumpAudit]
  );

  /* ── Model işleri ── */
  const triggerModel = useCallback(
    async (model: ModelId) => {
      const job = await api.models.trigger(model);
      setJobs((prev) => ({ ...prev, [model]: job }));
      bumpAudit();
    },
    [bumpAudit]
  );

  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;
  const activeJobs = Object.values(jobs).filter((j) => j && (j.status === "queued" || j.status === "running")).length;

  useEffect(() => {
    if (!activeJobs) return;
    const t = setInterval(async () => {
      const active = Object.values(jobsRef.current).filter(
        (j): j is ModelJob => !!j && (j.status === "queued" || j.status === "running")
      );
      for (const j of active) {
        try {
          const next = await api.models.job(j.jobId);
          setJobs((prev) => ({ ...prev, [next.model]: next }));
          if (next.status === "done") {
            setStale((prev) => ({ ...prev, [next.model]: false }));
            bumpAudit();
            api.notifications.list().then(setNotifications).catch(() => {});
          }
        } catch {
          setJobs((prev) => ({ ...prev, [j.model]: { ...j, status: "failed", error: "Durum alınamadı." } }));
        }
      }
    }, JOB_POLL_MS);
    return () => clearInterval(t);
  }, [activeJobs, bumpAudit]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo<Ctx>(
    () => ({
      session,
      role,
      login,
      logout,
      notifications,
      markRead,
      markAllRead,
      unreadCount,
      recommendations,
      decide,
      recompute,
      roadDamage,
      addRoadDamage,
      jobs,
      triggerModel,
      stale,
      auditVersion,
      bumpAudit,
    }),
    [
      session, role, login, logout, notifications, markRead, markAllRead, unreadCount,
      recommendations, decide, recompute, roadDamage, addRoadDamage, jobs, triggerModel,
      stale, auditVersion, bumpAudit,
    ]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp, AppProvider içinde kullanılmalıdır.");
  return ctx;
}
