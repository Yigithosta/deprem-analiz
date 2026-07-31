import React, { useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, RADIUS, riskColor } from "../theme/tokens";
import { Txt, Row, Card, Checkbox, Bar, PFBadge } from "../components/ui";
import {
  OperationalMap,
  DEFAULT_LAYERS,
  HEAT_LAYERS,
  type GISLayers,
  type HeatLayer,
} from "../components/OperationalMap";
import { MapLegend } from "../components/MapLegend";
import { GIS_CORRIDORS, GIS_HOSPITALS, GIS_SAFE_NODES } from "../data/mock";

/**
 * SRS §3.1.1 — GIS İstihbaratı.
 * CON-005 (geospatial görselleştirme), DSN-002 (OSM Servisi + PostGIS),
 * PF-GET03 (yol riski sonuçları harita üzerinde), PF-DAT06 (harita verisi).
 *
 * Ekran iki soruya indirgenmiştir: **"neye bakıyorum?"** (görünüm) ve
 * **"ne kadarını görmek istiyorum?"** (önem eşiği). Tekil katman anahtarları
 * varsayılan kapalı "Gelişmiş" bölümünde durur; kriz anındaki kullanıcı bunlara
 * hiç dokunmadan çalışabilir.
 *
 * Haritadaki simgelerin ve renklerin anlamı, haritayı örtmeyecek biçimde
 * haritanın altındaki MapLegend bloğunda yazılıdır.
 */

type LayerKey = keyof GISLayers;

/** Gelişmiş bölümdeki tekil anahtarların etiketleri — günlük dilde. */
const LAYER_META: Record<LayerKey, { label: string; color: string }> = {
  hospitals: { label: "Hastaneler", color: C.critical },
  safeNodes: { label: "Güvenli düğümler", color: C.gis },
  warehouses: { label: "İkmal depoları", color: C.ai },
  corridors: { label: "Lojistik koridorlar", color: C.success },
  resourceFlow: { label: "Kaynak akışı", color: C.ai },
  international: { label: "Uluslararası giriş noktaları", color: C.info },
  aiOverlay: { label: "YZ tahmin bölgeleri", color: C.ai },
  faults: { label: "Diri fay hatları", color: "#F87171" },
  medicalDemand: { label: "Tıbbi talep", color: C.danger },
  resourceDeficit: { label: "Kaynak açığı", color: C.ai },
  population: { label: "Nüfus yoğunluğu", color: C.blue },
  seismicRisk: { label: "Deprem risk modeli", color: "#EF4444" },
};

/** Gelişmiş bölümde tek tek açılabilen katmanlar (ısı haritaları hariç). */
const TOGGLE_KEYS: LayerKey[] = [
  "hospitals",
  "safeNodes",
  "warehouses",
  "corridors",
  "resourceFlow",
  "international",
  "aiOverlay",
  "faults",
];

const OFF = Object.fromEntries(Object.keys(DEFAULT_LAYERS).map((k) => [k, false])) as GISLayers;

/**
 * Görünümler — kullanıcının tek ana kararı. Her biri bir soruyu yanıtlar,
 * açıklaması da yanında yazar; böylece hangisini seçeceğini tahmin etmek
 * zorunda kalmaz.
 */
const VIEWS: { id: string; label: string; desc: string; icon: keyof typeof Feather.glyphMap; layers: GISLayers }[] = [
  {
    id: "Operasyonel",
    label: "Operasyon durumu",
    desc: "Hastaneler, güvenli düğümler ve koridorlar — anlık saha resmi.",
    icon: "activity",
    layers: { ...OFF, hospitals: true, safeNodes: true, corridors: true, resourceFlow: true },
  },
  {
    id: "Maruziyet",
    label: "Deprem riski",
    desc: "Fay hatları ve risk skoru; hangi bölge daha çok sarsılır.",
    icon: "alert-triangle",
    layers: { ...OFF, hospitals: true, safeNodes: true, faults: true, seismicRisk: true },
  },
  {
    id: "Kaynak Akışı",
    label: "Kaynak akışı",
    desc: "Depolar, limanlar ve sevkiyat hatları; malzeme nereden nereye gidiyor.",
    icon: "truck",
    layers: {
      ...OFF,
      safeNodes: true,
      warehouses: true,
      corridors: true,
      resourceFlow: true,
      international: true,
      resourceDeficit: true,
    },
  },
  {
    id: "Tahmin",
    label: "YZ tahmini",
    desc: "Modelin önümüzdeki saatler için işaret ettiği baskı bölgeleri.",
    icon: "cpu",
    layers: { ...OFF, hospitals: true, corridors: true, aiOverlay: true, medicalDemand: true },
  },
];

const HEAT_OPTIONS: { key: HeatLayer | "none"; label: string }[] = [
  { key: "none", label: "Yok" },
  { key: "seismicRisk", label: "Deprem risk modeli" },
  { key: "medicalDemand", label: "Tıbbi talep" },
  { key: "resourceDeficit", label: "Kaynak açığı" },
  { key: "population", label: "Nüfus yoğunluğu" },
];

/** Önem eşiği — "hepsi" ile "sadece sorunlu" arasında iki uçlu sade seçim. */
const SEVERITY: { label: string; hint: string; rank: number; color: string }[] = [
  { label: "Hepsi", hint: "Tüm kayıtlar haritada", rank: 0, color: C.txt2 },
  { label: "Sadece sorunlu", hint: "Yüksek ve kritik durumlar", rank: 1, color: C.warning },
];

const hospitalRank = (risk: string) => (risk === "critical" ? 2 : risk === "high" ? 1 : 0);
const nodeRank = (days: number) => (days <= 3 ? 2 : days <= 7 ? 1 : 0);
const corridorRank = (status: string) => (status === "risky" ? 2 : status === "constrained" ? 1 : 0);

export function GISScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 1100;

  const [layers, setLayers] = useState<GISLayers>(VIEWS[0].layers);
  const [view, setView] = useState("Operasyonel");
  const [minRank, setMinRank] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const activeHeat = (HEAT_LAYERS.find((k) => layers[k]) ?? "none") as HeatLayer | "none";

  /** Elle yapılan her değişiklik hazır görünümden ayrılır. */
  const toggle = (key: LayerKey, value: boolean) => {
    setLayers((l) => ({ ...l, [key]: value }));
    setView("Özel");
  };

  /** Isı haritaları birbirini örttüğü için tek seçimlidir. */
  const pickHeat = (key: HeatLayer | "none") => {
    setLayers((l) => {
      const next = { ...l };
      HEAT_LAYERS.forEach((k) => (next[k] = k === key));
      return next;
    });
    setView("Özel");
  };

  const applyView = (v: (typeof VIEWS)[number]) => {
    setView(v.id);
    setLayers(v.layers);
  };

  // Önem eşiği haritayla aynı değeri kullanır; listeler ve harita ayrışmaz.
  const hospitals = useMemo(() => GIS_HOSPITALS.filter((h) => hospitalRank(h.risk) >= minRank), [minRank]);
  const safeNodes = useMemo(() => GIS_SAFE_NODES.filter((n) => nodeRank(n.days) >= minRank), [minRank]);
  const corridors = useMemo(
    () => GIS_CORRIDORS.filter((c) => !c.international && corridorRank(c.status) >= minRank),
    [minRank]
  );

  const ControlPanel = (
    <ScrollView style={wide ? s.leftPanel : undefined} contentContainerStyle={{ padding: 12 }}>
      {/* ── 1. NEYE BAKIYORUM? ── */}
      <Txt size={11.5} weight="700" color={C.txt} style={{ marginBottom: 2 }}>
        Görünüm
      </Txt>
      <Txt size={9.5} color={C.muted} style={{ marginBottom: 9 }}>
        Haritanın neyi göstereceğini seçin.
      </Txt>

      {VIEWS.map((v) => {
        const sel = view === v.id;
        return (
          <Pressable
            key={v.id}
            onPress={() => applyView(v)}
            style={[s.viewCard, sel && { borderColor: alpha(C.blue, 0.6), backgroundColor: alpha(C.blue, 0.12) }]}
          >
            <Row gap={8}>
              <Feather name={v.icon} size={13} color={sel ? C.blue : C.muted} />
              <Txt size={11.5} weight={sel ? "700" : "600"} color={sel ? C.blue : C.txt2} style={{ flex: 1 }}>
                {v.label}
              </Txt>
              {sel && <Feather name="check" size={13} color={C.blue} />}
            </Row>
            <Txt size={9.5} color={C.muted} style={{ marginTop: 3 }}>
              {v.desc}
            </Txt>
          </Pressable>
        );
      })}

      {view === "Özel" && (
        <Row gap={6} style={{ marginTop: 2, marginBottom: 4 }}>
          <Feather name="sliders" size={11} color={C.muted} />
          <Txt size={9.5} color={C.muted} style={{ flex: 1 }}>
            Katmanları elle değiştirdiniz.
          </Txt>
          <Pressable onPress={() => applyView(VIEWS[0])} hitSlop={6}>
            <Txt size={9.5} weight="600" color={C.blue}>
              Sıfırla
            </Txt>
          </Pressable>
        </Row>
      )}

      <View style={s.panelDivider} />

      {/* ── 2. NE KADARINI GÖREYİM? ── */}
      <Txt size={11.5} weight="700" color={C.txt} style={{ marginBottom: 2 }}>
        Kapsam
      </Txt>
      <Txt size={9.5} color={C.muted} style={{ marginBottom: 8 }}>
        Kalabalık gelirse sadece sorunlu olanları gösterin.
      </Txt>
      <Row style={s.segment}>
        {SEVERITY.map((sv) => (
          <Pressable
            key={sv.label}
            onPress={() => setMinRank(sv.rank)}
            style={[s.segBtn, minRank === sv.rank && { backgroundColor: alpha(sv.color, 0.2) }]}
          >
            <Txt size={10} weight={minRank === sv.rank ? "700" : "400"} color={minRank === sv.rank ? sv.color : C.muted}>
              {sv.label}
            </Txt>
          </Pressable>
        ))}
      </Row>
      <Txt size={9.5} color={C.muted} style={{ marginTop: 6 }}>
        {minRank === 0
          ? SEVERITY[0].hint
          : `${hospitals.length} hastane · ${safeNodes.length} düğüm · ${corridors.length} koridor gösteriliyor.`}
      </Txt>

      <View style={s.panelDivider} />

      {/* ── 3. GELİŞMİŞ — varsayılan kapalı ── */}
      <Pressable onPress={() => setAdvanced(!advanced)} style={s.advHead}>
        <Feather name="layers" size={12} color={C.muted} />
        <Txt size={10.5} weight="600" color={C.txt2} style={{ flex: 1 }}>
          Gelişmiş katmanlar
        </Txt>
        <Feather name={advanced ? "chevron-up" : "chevron-down"} size={13} color={C.muted} />
      </Pressable>

      {advanced && (
        <View style={{ marginTop: 8 }}>
          <Txt size={9.5} color={C.muted} style={{ marginBottom: 7 }}>
            Katmanları tek tek açıp kapatabilirsiniz.
          </Txt>
          {TOGGLE_KEYS.map((k) => (
            <Checkbox
              key={k}
              checked={layers[k]}
              color={LAYER_META[k].color}
              label={LAYER_META[k].label}
              onChange={(v) => toggle(k, v)}
            />
          ))}

          <Txt size={9} weight="700" color={C.muted} upper style={{ marginTop: 11, marginBottom: 5 }}>
            Isı haritası · tek seçim
          </Txt>
          {HEAT_OPTIONS.map(({ key, label }) => {
            const sel = activeHeat === key;
            const col = key === "none" ? C.muted : LAYER_META[key].color;
            return (
              <Pressable key={key} onPress={() => pickHeat(key)} style={s.radioRow}>
                <View style={[s.radio, { borderColor: sel ? col : C.border }]}>
                  {sel && <View style={[s.radioDot, { backgroundColor: col }]} />}
                </View>
                <Txt size={10.5} color={sel ? C.txt : C.muted} style={{ flex: 1 }}>
                  {label}
                </Txt>
              </Pressable>
            );
          })}

          <Row gap={5} style={{ marginTop: 10, flexWrap: "wrap" }}>
            <PFBadge id="PF-DAT06" />
            <PFBadge id="PF-GET03" />
            <PFBadge id="PF-AI02" />
          </Row>
        </View>
      )}
    </ScrollView>
  );

  const IntelPanel = (
    <ScrollView style={wide ? s.rightPanel : undefined} contentContainerStyle={{ padding: 12 }}>
      <Txt size={11.5} weight="700" color={C.txt}>
        Durum Özeti
      </Txt>
      <Txt size={9.5} color={C.muted} style={{ marginBottom: 11 }}>
        {minRank === 0 ? "Haritadaki tüm kayıtlar" : "Yalnızca sorunlu kayıtlar"}
      </Txt>

      <PanelSection title="Hastaneler" hint="yoğun bakım doluluğu" pf="PF-EMG01">
        {hospitals.length === 0 && <FilteredOut />}
        {hospitals.map((h) => {
          const rc = riskColor(h.risk);
          return (
            <Row key={h.id} gap={7} style={{ marginBottom: 7 }}>
              <View style={[s.hBox, { backgroundColor: alpha(rc, 0.14), borderColor: rc }]}>
                <Txt size={8.5} weight="700" color={rc}>
                  H
                </Txt>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt size={10.5} color={C.txt2} numberOfLines={1}>
                  {h.short}
                </Txt>
                <Bar pct={h.load} color={rc} height={3} style={{ marginTop: 3 }} />
              </View>
              <Txt size={10} weight="700" color={rc} mono>
                %{h.load}
              </Txt>
            </Row>
          );
        })}
      </PanelSection>

      <PanelSection title="Güvenli düğümler" hint="stok kaç gün yeter" pf="PF-GET07">
        {safeNodes.length === 0 && <FilteredOut />}
        {safeNodes.map((n) => {
          const cc = n.days <= 3 ? C.danger : n.days <= 7 ? C.warning : C.gis;
          const minStock = Math.min(n.water, n.food, n.tents);
          return (
            <Row key={n.id} gap={7} style={{ marginBottom: 7 }}>
              <View style={[s.dot, { backgroundColor: cc }]} />
              <Txt size={10.5} color={C.txt2} mono style={{ flex: 1 }}>
                {n.id}
              </Txt>
              <Bar pct={minStock} color={cc} height={3} style={{ width: 40 }} />
              <Txt size={10} weight="700" color={cc} mono style={{ width: 30, textAlign: "right" }}>
                {n.days} gün
              </Txt>
            </Row>
          );
        })}
      </PanelSection>

      <PanelSection title="Koridorlar" hint="hat kullanım oranı" pf="PF-GET03" last>
        {corridors.length === 0 && <FilteredOut />}
        {corridors.map((c) => (
          <Row key={c.id} gap={7} style={{ marginBottom: 7 }}>
            <View style={{ width: 14, height: 2.5, borderRadius: 2, backgroundColor: c.color }} />
            <Txt size={10.5} color={C.txt2} mono style={{ flex: 1 }}>
              {c.id}
            </Txt>
            <Bar pct={c.load} color={c.color} height={3} style={{ width: 34 }} />
            <Txt size={10} color={c.color} mono style={{ width: 32, textAlign: "right" }}>
              %{c.load}
            </Txt>
          </Row>
        ))}
      </PanelSection>
    </ScrollView>
  );

  if (wide) {
    return (
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: C.bg }}>
        {ControlPanel}
        {/* Harita kalan yüksekliği doldurur, anahtarı hemen altında sabit durur —
            gösterge haritanın üstünü örtmez. */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flex: 1 }}>
            <OperationalMap layers={layers} minRank={minRank} />
          </View>
          <MapLegend layers={layers} />
        </View>
        {IntelPanel}
      </View>
    );
  }

  // Dar ekran: harita → anahtar → kontroller → durum özeti.
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 12, gap: 12 }}>
      <Card style={{ overflow: "hidden" }}>
        <View style={{ height: 340 }}>
          <OperationalMap layers={layers} minRank={minRank} />
        </View>
        <MapLegend layers={layers} />
      </Card>
      <Card>
        <Pressable onPress={() => setPanelOpen(!panelOpen)} style={s.collapseHead}>
          <Feather name="sliders" size={13} color={C.blue} />
          <Txt size={12} weight="600" color={C.txt} style={{ flex: 1 }}>
            Görünüm ve kapsam
          </Txt>
          <Feather name={panelOpen ? "chevron-up" : "chevron-down"} size={14} color={C.muted} />
        </Pressable>
        {panelOpen && ControlPanel}
      </Card>
      <Card>{IntelPanel}</Card>
    </ScrollView>
  );
}

/** Önem eşiği bir bölümü tamamen boşalttığında gösterilir. */
function FilteredOut() {
  return (
    <Txt size={9.5} color={C.muted} style={{ paddingVertical: 4 }}>
      Bu eşiği geçen kayıt yok.
    </Txt>
  );
}

function PanelSection({
  title,
  hint,
  pf,
  children,
  last,
}: {
  title: string;
  hint: string;
  pf: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View style={[s.section, last && { borderBottomWidth: 0, marginBottom: 0 }]}>
      <Row style={{ justifyContent: "space-between" }}>
        <Txt size={10.5} weight="700" color={C.txt}>
          {title}
        </Txt>
        <PFBadge id={pf} />
      </Row>
      <Txt size={9} color={C.muted} style={{ marginBottom: 8 }}>
        {hint}
      </Txt>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  // flexGrow/flexShrink sabitlenmezse panel, içeriğin doğal genişliğine yayılır.
  leftPanel: {
    width: 224,
    maxWidth: 224,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: C.sidebar,
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  rightPanel: {
    width: 236,
    maxWidth: 236,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: C.sidebar,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },
  panelDivider: { height: 1, backgroundColor: C.border, marginVertical: 13 },
  viewCard: {
    padding: 9,
    marginBottom: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardEl,
  },
  advHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  radioRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  radio: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 6, height: 6, borderRadius: 3 },
  segment: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
    backgroundColor: C.cardEl,
  },
  segBtn: { flex: 1, alignItems: "center", paddingVertical: 6 },
  section: { borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 12, marginBottom: 12 },
  hBox: {
    width: 19,
    height: 19,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  collapseHead: { flexDirection: "row", alignItems: "center", gap: 8, padding: 13 },
});
