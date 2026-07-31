import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { C, alpha, RADIUS } from "../theme/tokens";
import { buildMapHtml } from "./leaflet/mapHtml";
import { MapFrame } from "./leaflet/MapFrame";
import { Txt } from "./ui";

/**
 * Operasyonel GIS haritası — SRS §3.1.1 (Operasyon Paneli / GIS İstihbaratı),
 * CON-005 (geospatial görselleştirme), DSN-002 (OSM Servisi + PostGIS).
 *
 * Altlık, OpenStreetMap verisinden üretilen karolarla Leaflet üzerinde çizilir
 * (bkz. leaflet/mapHtml.ts); görünüm Türkiye ile birlikte Akdeniz havzasını
 * kapsar, böylece INTL yardım koridoru gerçek denizyolu üzerinde görünür.
 * Operasyonel katmanlar bunun üzerine enlem/boylam ile bindirilir — daha önceki
 * yüzde tabanlı SVG şeması yerine gerçek WGS84 koordinatları kullanılır.
 *
 * Bu bileşen yalnızca harita çerçevesini yönetir; işaretçi/koridor çizimi harita
 * belgesinin içindedir. Sembollerin ne anlama geldiği haritanın *altındaki*
 * MapLegend bloğunda anlatılır — haritanın üstünde artık gösterge kutusu yoktur.
 */

export type GISLayers = {
  hospitals: boolean;
  safeNodes: boolean;
  warehouses: boolean;
  corridors: boolean;
  resourceFlow: boolean;
  international: boolean;
  aiOverlay: boolean;
  faults: boolean;
  medicalDemand: boolean;
  resourceDeficit: boolean;
  population: boolean;
  seismicRisk: boolean;
};

/**
 * Isı haritaları birbirini örttüğü için tek seçimlidir; GISScreen bu listeyi
 * radyo grubu olarak sunar ve aynı anda yalnızca biri açık kalır.
 */
export const HEAT_LAYERS = ["medicalDemand", "resourceDeficit", "population", "seismicRisk"] as const;
export type HeatLayer = (typeof HEAT_LAYERS)[number];

/**
 * Başlangıçta yalnızca çekirdek operasyon resmi açıktır — analiz katmanları
 * (ısı haritaları, YZ tahmini, fay hatları) kullanıcı isteğiyle eklenir.
 * Böylece harita ilk açılışta okunabilir kalır.
 */
export const DEFAULT_LAYERS: GISLayers = {
  hospitals: true,
  safeNodes: true,
  warehouses: false,
  corridors: true,
  resourceFlow: true,
  international: false,
  aiOverlay: false,
  faults: false,
  medicalDemand: false,
  resourceDeficit: false,
  population: false,
  seismicRisk: false,
};

const LAYER_KEYS = Object.keys(DEFAULT_LAYERS) as (keyof GISLayers)[];

export function OperationalMap({
  layers,
  compact = false,
  minRank = 0,
}: {
  layers: Partial<GISLayers>;
  compact?: boolean;
  /** Önem filtresi eşiği: 0 tümü, 1 yüksek ve üzeri, 2 yalnız kritik. */
  minRank?: number;
}) {
  // Harita belgesi yalnızca `compact` değişince yeniden üretilir; katman
  // değişiklikleri mesajla iletildiği için harita sıfırlanmaz.
  const html = useMemo(() => buildMapHtml(compact), [compact]);

  // Eksik anahtarlar false'a indirgenir — MapFrame'e kararlı bir nesne gider.
  const resolved = useMemo(
    () => Object.fromEntries(LAYER_KEYS.map((k) => [k, !!layers[k]])) as Record<string, boolean>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    LAYER_KEYS.map((k) => !!layers[k])
  );

  const filters = useMemo(() => ({ minRank }), [minRank]);

  return (
    <View style={[st.wrap, compact && { borderRadius: RADIUS.lg }]}>
      <MapFrame html={html} layers={resolved} filters={filters} />

      {/* ── YÜZEN KATMANLAR ── */}
      <View style={st.liveBadge} pointerEvents="none">
        <View style={st.dot} />
        <Txt size={9} weight="700" color={C.txt}>
          CANLI · 5sn · Operasyonel
        </Txt>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#07101f", overflow: "hidden" },
  liveBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: alpha(C.card, 0.93),
    borderWidth: 1,
    borderColor: C.border,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
});
