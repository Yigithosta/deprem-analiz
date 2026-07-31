import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Polygon, Circle, Rect, Line } from "react-native-svg";
import { C, alpha, RADIUS, hazardColor } from "../theme/tokens";
import { Txt, Row } from "./ui";
import { HEAT_LAYERS, type GISLayers, type HeatLayer } from "./OperationalMap";

/**
 * Harita Anahtarı — haritanın *altında* duran, haritayı örtmeyen açıklama bloğu.
 *
 * Önceki yüzen gösterge kutusu yalnızca renkleri listeliyordu; işaretçi
 * şekillerinin, halkaların ve çizgi türlerinin ne anlama geldiği hiçbir yerde
 * yazmıyordu. Burada her sembol, haritadaki biçiminin aynısıyla çizilir ve
 * yanına ne anlattığı düz Türkçeyle yazılır.
 *
 * Yalnızca **açık olan** katmanların sembolleri gösterilir; kapalı katmanın
 * anahtarı yer kaplamaz.
 */

/* ── Haritadaki işaretçilerin birebir küçük kopyaları ── */

function HospitalGlyph({ color = C.critical }: { color?: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={11} stroke="#1e3a5f" strokeWidth={2.5} fill="none" />
      <Circle
        cx={13}
        cy={13}
        r={11}
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeDasharray={`${2 * Math.PI * 11 * 0.72} ${2 * Math.PI * 11}`}
        transform="rotate(-90 13 13)"
      />
      <Rect x={5.5} y={5.5} width={15} height={15} rx={3.5} fill={color} />
      <Line x1={9.5} y1={10} x2={9.5} y2={16} stroke="#fff" strokeWidth={2} />
      <Line x1={16.5} y1={10} x2={16.5} y2={16} stroke="#fff" strokeWidth={2} />
      <Line x1={9.5} y1={13} x2={16.5} y2={13} stroke="#fff" strokeWidth={2} />
    </Svg>
  );
}

function SafeNodeGlyph({ color = C.gis }: { color?: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={11} stroke="#1e3a5f" strokeWidth={2.5} fill="none" />
      <Circle
        cx={13}
        cy={13}
        r={11}
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeDasharray={`${2 * Math.PI * 11 * 0.6} ${2 * Math.PI * 11}`}
        transform="rotate(-90 13 13)"
      />
      <Polygon
        points="13,5 20,9 20,17 13,21 6,17 6,9"
        fill={alpha(color, 0.18)}
        stroke={color}
        strokeWidth={1.4}
      />
    </Svg>
  );
}

function WarehouseGlyph() {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Rect x={5} y={5} width={16} height={16} rx={3.5} fill={alpha(C.ai, 0.18)} stroke={C.ai} strokeWidth={1.4} />
      <Line x1={9} y1={13} x2={17} y2={13} stroke={C.ai} strokeWidth={2} />
      <Line x1={13} y1={9} x2={13} y2={17} stroke={C.ai} strokeWidth={2} />
    </Svg>
  );
}

function PortGlyph() {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Polygon points="13,4 22,13 13,22 4,13" fill={alpha(C.info, 0.2)} stroke={C.info} strokeWidth={1.4} />
      <Circle cx={13} cy={13} r={2.6} fill={C.info} />
    </Svg>
  );
}

/** Koridor çizgisi — durum kesikli desenle ayrışır. */
function LineGlyph({ color, dash }: { color: string; dash?: string }) {
  return (
    <Svg width={26} height={12} viewBox="0 0 26 12">
      <Line x1={1} y1={6} x2={25} y2={6} stroke={color} strokeWidth={2.6} strokeDasharray={dash} strokeLinecap="round" />
    </Svg>
  );
}

function FlowGlyph() {
  return (
    <Svg width={26} height={12} viewBox="0 0 26 12">
      <Line x1={1} y1={6} x2={25} y2={6} stroke={C.ai} strokeWidth={2.6} strokeLinecap="round" opacity={0.35} />
      {[5, 13, 21].map((cx, i) => (
        <Circle key={cx} cx={cx} cy={6} r={2.4} fill={C.ai} opacity={0.95 - i * 0.22} />
      ))}
    </Svg>
  );
}

/* ── Anahtar içeriği ── */

type Entry = { glyph: React.ReactNode; title: string; desc: string };

const HEAT_SCALE: Record<HeatLayer, { title: string; desc: string; col?: string; hazard?: boolean }> = {
  medicalDemand: {
    title: "Tıbbi talep yoğunluğu",
    desc: "Koyu alan, o bölgede beklenen hasta sayısının yüksek olduğunu gösterir.",
    col: C.danger,
  },
  resourceDeficit: {
    title: "Kaynak açığı",
    desc: "Koyu alan, stokun ihtiyacı karşılamadığı bölgedir.",
    col: C.ai,
  },
  population: {
    title: "Nüfus yoğunluğu",
    desc: "Koyu alan, daha kalabalık yerleşimi gösterir.",
    col: C.blue,
  },
  seismicRisk: {
    title: "Deprem risk skoru",
    desc: "Renk, 475 yıllık dönüş periyoduna göre beklenen sarsıntı şiddetini gösterir.",
    hazard: true,
  },
};

export function MapLegend({ layers }: { layers: Partial<GISLayers> }) {
  const marks: Entry[] = [];
  if (layers.hospitals)
    marks.push({
      glyph: <HospitalGlyph />,
      title: "Hastane",
      desc: "Çevresindeki halka yoğun bakım doluluğunu gösterir; halka tamamlandıkça hastane dolar.",
    });
  if (layers.safeNodes)
    marks.push({
      glyph: <SafeNodeGlyph />,
      title: "Güvenli düğüm",
      desc: "Altıgen içindeki sayı, mevcut stokun kaç gün yeteceğidir. Halka stok doluluğudur.",
    });
  if (layers.warehouses)
    marks.push({ glyph: <WarehouseGlyph />, title: "İkmal deposu", desc: "Bölgeye malzeme besleyen ana depo." });
  if (layers.international)
    marks.push({
      glyph: <PortGlyph />,
      title: "Uluslararası giriş",
      desc: "Dış yardımın ülkeye girdiği liman veya sınır kapısı.",
    });

  const lines: Entry[] = [];
  if (layers.corridors) {
    lines.push({ glyph: <LineGlyph color={C.success} />, title: "Açık koridor", desc: "Trafik normal akıyor." });
    lines.push({
      glyph: <LineGlyph color={C.warning} dash="7,4" />,
      title: "Kısıtlı koridor",
      desc: "Geçiş var ama kapasite düşük.",
    });
    lines.push({
      glyph: <LineGlyph color={C.danger} dash="3,3" />,
      title: "Riskli koridor",
      desc: "Kesilme ihtimali yüksek, alternatif planlayın.",
    });
  }
  if (layers.resourceFlow)
    lines.push({ glyph: <FlowGlyph />, title: "Kaynak akışı", desc: "Hareketli noktalar sevkiyatın yönünü gösterir." });
  if (layers.international)
    lines.push({
      glyph: <LineGlyph color={C.gis} dash="6,4" />,
      title: "Uluslararası yardım hattı",
      desc: "Akdeniz üzerinden gelen yardım güzergâhı.",
    });
  if (layers.faults)
    lines.push({ glyph: <LineGlyph color="#F87171" />, title: "Diri fay", desc: "Aktif fay zonunun yüzey izi." });

  const activeHeat = HEAT_LAYERS.find((k) => layers[k]);
  const hasStatus = !!(layers.hospitals || layers.safeNodes);

  if (marks.length === 0 && lines.length === 0 && !activeHeat) return null;

  return (
    <View style={s.wrap}>
      <Row gap={7} style={{ marginBottom: 3 }}>
        <Txt size={11.5} weight="700" color={C.txt}>
          Harita Anahtarı
        </Txt>
        <Txt size={10} color={C.muted}>
          haritadaki simge ve renklerin anlamı
        </Txt>
      </Row>

      <View style={s.cols}>
        {marks.length > 0 && (
          <Block title="Simgeler">
            {marks.map((e) => (
              <EntryRow key={e.title} {...e} />
            ))}
          </Block>
        )}

        {lines.length > 0 && (
          <Block title="Çizgiler">
            {lines.map((e) => (
              <EntryRow key={e.title} {...e} />
            ))}
          </Block>
        )}

        {hasStatus && (
          <Block title="Renkler">
            <Txt size={10} color={C.muted} style={{ marginBottom: 6 }}>
              Simgenin rengi durumun aciliyetini anlatır:
            </Txt>
            {[
              { col: C.critical, label: "Kırmızı — Kritik", desc: "Hemen müdahale gerekir." },
              { col: C.warning, label: "Turuncu — Yüksek", desc: "Yakından izleyin." },
              { col: C.success, label: "Yeşil — Normal", desc: "Durum sınırlar içinde." },
            ].map(({ col, label, desc }) => (
              <Row key={label} gap={8} style={{ marginBottom: 5 }}>
                <View style={[s.swatch, { backgroundColor: col }]} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt size={10.5} weight="600" color={C.txt}>
                    {label}
                  </Txt>
                  <Txt size={9.5} color={C.muted}>
                    {desc}
                  </Txt>
                </View>
              </Row>
            ))}
          </Block>
        )}

        {!!activeHeat && (
          <Block title="Isı haritası">
            <Txt size={10.5} weight="600" color={C.txt} style={{ marginBottom: 5 }}>
              {HEAT_SCALE[activeHeat].title}
            </Txt>
            <Row style={{ borderRadius: 3, overflow: "hidden" }}>
              {(HEAT_SCALE[activeHeat].hazard ? [15, 45, 62, 78, 95] : [0.14, 0.3, 0.5, 0.72, 1]).map((v, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 9,
                    backgroundColor: HEAT_SCALE[activeHeat].hazard
                      ? hazardColor(v)
                      : alpha(HEAT_SCALE[activeHeat].col!, v),
                  }}
                />
              ))}
            </Row>
            <Row style={{ justifyContent: "space-between", marginTop: 3, marginBottom: 5 }}>
              <Txt size={9} color={C.muted}>
                Az
              </Txt>
              <Txt size={9} color={C.muted}>
                Çok
              </Txt>
            </Row>
            <Txt size={9.5} color={C.muted}>
              {HEAT_SCALE[activeHeat].desc}
            </Txt>
          </Block>
        )}
      </View>

      <Txt size={9} color={C.muted} style={{ marginTop: 9 }}>
        Harita altlığı: OpenStreetMap katkıcıları · ODbL lisansı
      </Txt>
    </View>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.block}>
      <Txt size={9} weight="700" color={C.muted} upper style={{ marginBottom: 7 }}>
        {title}
      </Txt>
      {children}
    </View>
  );
}

function EntryRow({ glyph, title, desc }: Entry) {
  return (
    <Row gap={8} style={{ marginBottom: 7, alignItems: "flex-start" }}>
      <View style={s.glyphBox}>{glyph}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={10.5} weight="600" color={C.txt}>
          {title}
        </Txt>
        <Txt size={9.5} color={C.muted}>
          {desc}
        </Txt>
      </View>
    </Row>
  );
}

const s = StyleSheet.create({
  wrap: {
    padding: 12,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  // Dar ekranda sütunlar alt alta sarar; genişte yan yana dizilir.
  cols: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  block: { flexGrow: 1, flexBasis: 210, minWidth: 190, maxWidth: 320 },
  glyphBox: { width: 26, alignItems: "center", justifyContent: "center", paddingTop: 1 },
  swatch: { width: 13, height: 13, borderRadius: 3, marginTop: 1 },
});
