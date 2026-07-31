import React, { useCallback, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

/**
 * iOS / Android köprüsü — Leaflet belgesi react-native-webview içinde çalışır.
 * Web karşılığı için MapFrame.web.tsx'e bakınız (Metro uzantıya göre seçer).
 */
export function MapFrame({
  html,
  layers,
  filters,
}: {
  html: string;
  layers: Record<string, boolean>;
  filters?: { minRank: number };
}) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);

  const push = useCallback((next: Record<string, boolean>) => {
    ref.current?.injectJavaScript(
      `window.__setLayers && window.__setLayers(${JSON.stringify(next)}); true;`
    );
  }, []);

  // Katman durumu değiştiğinde yeniden yükleme yapmadan gönderilir; böylece
  // kullanıcının kaydırma/yakınlaştırma konumu korunur.
  React.useEffect(() => {
    if (ready) push(layers);
  }, [ready, layers, push]);

  // Önem filtresi ayrı kanaldan gider — katman durumunu sıfırlamaz.
  React.useEffect(() => {
    if (!ready || !filters) return;
    ref.current?.injectJavaScript(
      `window.__setFilters && window.__setFilters(${JSON.stringify(filters)}); true;`
    );
  }, [ready, filters]);

  return (
    <WebView
      ref={ref}
      style={st.web}
      originWhitelist={["*"]}
      source={{ html }}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      overScrollMode="never"
      setSupportMultipleWindows={false}
      allowsInlineMediaPlayback
      androidLayerType="hardware"
      onMessage={(e) => {
        try {
          if (JSON.parse(e.nativeEvent.data)?.type === "ready") setReady(true);
        } catch {}
      }}
    />
  );
}

const st = StyleSheet.create({
  web: { flex: 1, backgroundColor: "#07101f" },
});
