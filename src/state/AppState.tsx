import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Role } from "../auth/roles";
import {
  auditLog as seedAudit,
  notifications as seedNotifications,
  roadDamageEntries as seedRoadDamage,
  models,
} from "../data/mock";

/**
 * Uygulama oturum ve karar durumu.
 *
 * Bu katman SRS'in üç bağlayıcı davranışını gerçekler:
 *  • CON-007 / SEC-008 — konsol salt-okunurdur; YZ önerileri yalnızca
 *    gösterilir, onay/ret kararı sistem dışında verilir.
 *  • CON-004 / SEC-006 — kimlik doğrulama, veri değişikliği ve operasyonel
 *    kararlar denetim kaydına yazılır.
 *  • CON-008 / QLT-006 — her kayıt, ilgili ürün fonksiyonunu (PF) taşır.
 */


export type AuditEntry = {
  time: string;
  user: string;
  role: string;
  action: string;
  detail: string;
  type: string;
  pf: string;
};

export type RoadDamage = {
  id: string;
  segment: string;
  type: string;
  severity: string;
  entered: string;
  note: string;
  consumedBy: string;
};

export type ModelRun = {
  status: "idle" | "running" | "done";
  progress: number;
  finishedAt?: string;
};

type Ctx = {
  role: Role | null;
  login: (role: Role) => void;
  logout: () => void;

  audit: AuditEntry[];
  log: (action: string, detail: string, type: string, pf: string) => void;

  notifications: typeof seedNotifications;
  markRead: (id: number) => void;
  markAllRead: () => void;
  unreadCount: number;

  roadDamage: RoadDamage[];
  addRoadDamage: (e: Omit<RoadDamage, "id" | "entered" | "consumedBy">) => void;

  runs: Record<string, ModelRun>;
  triggerModel: (pf: string) => void;
};

const AppCtx = createContext<Ctx | null>(null);

const now = () =>
  new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>(seedAudit);
  const [notifs, setNotifs] = useState(seedNotifications);
  const [roadDamage, setRoadDamage] = useState<RoadDamage[]>(seedRoadDamage);
  const [runs, setRuns] = useState<Record<string, ModelRun>>({});

  const log = useCallback(
    (action: string, detail: string, type: string, pf: string) => {
      setAudit((prev) => [
        {
          time: now(),
          user: role?.demoUser.name ?? "Sistem",
          role: role?.id ?? "—",
          action,
          detail,
          type,
          pf,
        },
        ...prev,
      ]);
    },
    [role]
  );

  const login = useCallback((r: Role) => {
    setRole(r);
    setAudit((prev) => [
      {
        time: now(),
        user: r.demoUser.name,
        role: r.id,
        action: "Giriş",
        detail: `${r.name} rolüyle çok faktörlü doğrulamadan geçildi (${r.gateway})`,
        type: "auth",
        pf: "PF-SYS01",
      },
      ...prev,
    ]);
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    setRuns({});
  }, []);

  const markRead = useCallback((id: number) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // PF-RSK01 — AFAD saha girişi; Yol Riski modeli (PF-AI03) tarafından tüketilir.
  const addRoadDamage = useCallback(
    (e: Omit<RoadDamage, "id" | "entered" | "consumedBy">) => {
      const id = `RD-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      setRoadDamage((prev) => [
        { ...e, id, entered: `${role?.short ?? "AFAD"} · ${now().slice(0, 5)}`, consumedBy: "PF-AI03" },
        ...prev,
      ]);
      log("Saha Verisi Girildi", `${id} — ${e.segment} (${e.type})`, "change", "PF-RSK01");
      // Yol riski modeli yeni girdiyle bayat duruma düşer.
      setRuns((prev) => ({ ...prev, "PF-AI03": { status: "idle", progress: 0 } }));
    },
    [log, role]
  );

  // PF-AI01…06 — model tetikleme. Gerçekte Dağıtım Sistemi'ne gRPC/Redis Stream
  // üzerinden iletilir (SRS §3.1.4); burada ilerleme simüle edilir.
  const triggerModel = useCallback(
    (pf: string) => {
      const model = models.find((m) => m.pf === pf);
      setRuns((prev) => ({ ...prev, [pf]: { status: "running", progress: 0 } }));
      log("Model Çalıştırma Tetiklendi", `${model?.name ?? pf} — ${model?.engine ?? ""}`, "update", pf);

      const timer = setInterval(() => {
        setRuns((prev) => {
          const cur = prev[pf];
          if (!cur || cur.status !== "running") {
            clearInterval(timer);
            return prev;
          }
          const next = cur.progress + 8;
          if (next >= 100) {
            clearInterval(timer);
            return { ...prev, [pf]: { status: "done", progress: 100, finishedAt: now() } };
          }
          return { ...prev, [pf]: { ...cur, progress: next } };
        });
      }, 140);
    },
    [log]
  );

  const unreadCount = notifs.filter((n) => !n.read).length;

  const value = useMemo<Ctx>(
    () => ({
      role,
      login,
      logout,
      audit,
      log,
      notifications: notifs,
      markRead,
      markAllRead,
      unreadCount,
      roadDamage,
      addRoadDamage,
      runs,
      triggerModel,
    }),
    [
      role, login, logout, audit, log, notifs,
      markRead, markAllRead, unreadCount, roadDamage, addRoadDamage, runs, triggerModel,
    ]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp, AppProvider içinde kullanılmalıdır.");
  return ctx;
}
