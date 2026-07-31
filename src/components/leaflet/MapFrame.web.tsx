import React, { useEffect, useRef, useState } from "react";

/**
 * Web köprüsü — Leaflet belgesi sandbox'lı bir <iframe srcDoc> içinde çalışır.
 * react-native-web zaten React DOM üzerinde koştuğu için doğrudan DOM elemanı
 * kullanılabilir; böylece web'de react-native-webview bağımlılığı devreye girmez.
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
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);

  // Belge "ready" dediğinde katman gönderimi başlar.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!ref.current || e.source !== ref.current.contentWindow) return;
      try {
        if (JSON.parse(e.data)?.type === "ready") setReady(true);
      } catch {}
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Yeniden yükleme yapılmaz — kaydırma/yakınlaştırma durumu korunsun diye
  // katman durumu mesajla iletilir.
  useEffect(() => {
    if (!ready) return;
    ref.current?.contentWindow?.postMessage(JSON.stringify({ type: "layers", layers }), "*");
  }, [ready, layers]);

  // Önem filtresi ayrı kanaldan gider — katman durumunu sıfırlamaz.
  useEffect(() => {
    if (!ready || !filters) return;
    ref.current?.contentWindow?.postMessage(JSON.stringify({ type: "filters", filters }), "*");
  }, [ready, filters]);

  return (
    <iframe
      ref={ref}
      srcDoc={html}
      title="MEDAIGENCY operasyonel harita"
      sandbox="allow-scripts"
      style={{ width: "100%", height: "100%", border: "none", display: "block", background: "#07101f" }}
    />
  );
}
