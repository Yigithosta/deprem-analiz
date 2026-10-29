import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { applyTheme, themeMode, themeVersion, type ThemeMode } from "./tokens";

/**
 * Tema seçimi. Varsayılan koyu temadır; kullanıcının seçimi cihazda saklanır.
 * Tema değiştiğinde `version` artar ve görsel ağaç bu anahtarla yeniden çizilir;
 * oturum ve uygulama durumu korunur.
 */

const STORAGE_KEY = "medaigency.theme";

type ThemeCtx = { mode: ThemeMode; version: number; setMode: (m: ThemeMode) => void };

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(themeMode());
  const [version, setVersion] = useState(themeVersion());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!alive) return;
        if (stored === "light" || stored === "dark") {
          applyTheme(stored);
          setModeState(stored);
          setVersion(themeVersion());
        }
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    applyTheme(m);
    setModeState(m);
    setVersion(themeVersion());
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const value = useMemo(() => ({ mode, version, setMode }), [mode, version, setMode]);

  // Kayıtlı tema okunana kadar çizim yapılmaz; yanlış temanın bir an görünmesi önlenir.
  if (!ready) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme, ThemeProvider içinde kullanılmalıdır.");
  return ctx;
}
