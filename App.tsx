import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { C } from "./src/theme/tokens";
import { AppProvider, useApp } from "./src/state/AppState";
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
  TraceabilityScreen,
  UsersScreen,
  VaultScreen,
  SettingsScreen,
} from "./src/screens/AdminScreens";

/**
 * MEDAIGENCY — Lot C operasyon konsolu (React Native / Expo).
 *
 * Yapı, "AI-Driven Disaster Resilience, Medical Response, and Multi-Purpose
 * Resource Logistics Management System" SRS V1.0 dokümanına göre düzenlenmiştir:
 *  • Menü grupları SRS §3.1.1'deki rol tabanlı yerleşimle aynıdır.
 *  • Her ekran gerçeklediği ürün fonksiyonlarını (PF) rozetlerle gösterir (CON-008).
 *  • Erişim, SRS §2.3'teki aktör–fonksiyon eşleşmesine göre kısıtlanır (SEC-009).
 *  • Tüm YZ çıktıları tavsiye niteliğindedir ve insan onayı gerektirir (CON-007).
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
  traceability: TraceabilityScreen,
  users: UsersScreen,
  vault: VaultScreen,
  settings: SettingsScreen,
};

function Root() {
  const { role } = useApp();
  const [screen, setScreen] = useState<ScreenId>("dashboard");

  // SEC-009 — rol değiştiğinde, önceki rolün açtığı ekranda kalınmaz.
  useEffect(() => {
    setScreen("dashboard");
  }, [role?.id]);

  if (!role) return <LoginScreen />;

  const Current = SCREENS[screen];
  return (
    <Shell screen={screen} onNavigate={setScreen}>
      <Current />
    </Shell>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.sidebar },
  root: { flex: 1, backgroundColor: C.bg },
});
