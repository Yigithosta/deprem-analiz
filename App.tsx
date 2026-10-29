import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { C, themed } from "./src/theme/tokens";
import { AppProvider, useApp } from "./src/state/AppState";
import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import { Shell } from "./src/navigation/Shell";
import type { ScreenId } from "./src/navigation/registry";

import { LoginScreen } from "./src/screens/LoginScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { GISScreen } from "./src/screens/GISScreen";
import {
  MedicalScreen,
  DispatchScreen,
  LogisticsScreen,
  AllocationScreen,
  PrepositioningScreen,
} from "./src/screens/CapacityScreens";
import {
  DataAcquisitionScreen,
  OrchestrationScreen,
  FieldEntryScreen,
  ForecastingScreen,
} from "./src/screens/PlanningScreens";
import {
  InternationalScreen,
  NotificationsScreen,
  ReportingScreen,
  AuditScreen,
  UsersScreen,
  VaultScreen,
  SettingsScreen,
} from "./src/screens/AdminScreens";

/**
 * MEDAIGENCY — Lot C operasyon konsolu (React Native / Expo).
 *
 *  • Menü grupları rol tabanlı konsol yerleşimini izler.
 *  • Erişim, her kurumun rolüne tanımlı izinlerle sınırlıdır (en az yetki).
 *  • Tüm veri ve işlemler API katmanından geçer (src/api).
 *  • YZ çıktıları tavsiye niteliğindedir ve yetkili onayı gerektirir.
 */

const SCREENS: Record<ScreenId, React.ComponentType> = {
  dashboard: DashboardScreen,
  gis: GISScreen,
  notifications: NotificationsScreen,
  medical: MedicalScreen,
  dispatch: DispatchScreen,
  logistics: LogisticsScreen,
  allocation: AllocationScreen,
  prepositioning: PrepositioningScreen,
  dataacq: DataAcquisitionScreen,
  orchestration: OrchestrationScreen,
  fieldentry: FieldEntryScreen,
  forecasting: ForecastingScreen,
  international: InternationalScreen,
  reporting: ReportingScreen,
  audit: AuditScreen,
  users: UsersScreen,
  vault: VaultScreen,
  settings: SettingsScreen,
};

function Root() {
  const { role } = useApp();
  const { version } = useTheme();
  const [screen, setScreen] = useState<ScreenId>("dashboard");

  // Rol değiştiğinde önceki rolün açtığı ekranda kalınmaz.
  useEffect(() => {
    setScreen("dashboard");
  }, [role?.id]);

  // Tema değiştiğinde görsel ağaç yeniden çizilir; oturum ve açık ekran korunur.
  if (!role) return <LoginScreen key={version} />;

  const Current = SCREENS[screen];
  return (
    <Shell key={version} screen={screen} onNavigate={setScreen}>
      <Current />
    </Shell>
  );
}

function Frame() {
  const { mode } = useTheme();
  return (
    <SafeAreaProvider>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        <View style={s.root}>
          <AppProvider>
            <Root />
          </AppProvider>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Frame />
    </ThemeProvider>
  );
}

const s = themed(() => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.card },
  root: { flex: 1, backgroundColor: C.bg },
}));
