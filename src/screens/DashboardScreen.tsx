import React, { useState } from "react";
import { View, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, RADIUS, loadColor } from "../theme/tokens";
import { Screen, Cols } from "../components/Screen";
import {
  Txt, Row, Grid, Card, KPICard, SectionHeader, ScreenHeader, Bar, PFBadge,
} from "../components/ui";
import { OperationalMap } from "../components/OperationalMap";
import { AIRecCard } from "../components/AIRecCard";
import { aiRecs, hospitalRows, GIS_SAFE_NODES, resourceItems } from "../data/mock";

/**
 * SRS §3.1.1 — Operasyon Paneli (Figure 3-1).
 * Üst seviye operasyonel göstergeler, etkilenen bölgenin GIS haritası,
 * YZ Karar Destek Merkezi ve tıbbi kapasite / Güvenli Düğüm envanteri /
 * kaynak hazırlığı / simülasyon çıktısı özet panelleri.
 */
export function DashboardScreen() {
  const [expanded, setExpanded] = useState<number | null>(1);
  const [banner, setBanner] = useState(true);
  const { width } = useWindowDimensions();

  // Salt-okunur konsol: öneriler karara bağlanmadığı için tümü açık sayılır.
  const pending = aiRecs.length;
  const mapHeight = width >= 1000 ? 430 : width >= 700 ? 360 : 300;

  return (
    <View style={{ flex: 1 }}>
      {banner && (
        <View style={s.banner}>
          <Feather name="alert-triangle" size={14} color="#fff" />
          <Txt size={11} weight="700" color="#fff" style={{ flex: 1 }}>
            KRİTİK: Adana ve Hatay illerinde YBÜ kapasitesi 8 saat içinde aşılacak — Lojistik koridor C-02 riskli —
            Acil kaynak hareketi gerekiyor
          </Txt>
          <Pressable onPress={() => setBanner(false)} hitSlop={8}>
            <Feather name="x" size={15} color="#fff" />
          </Pressable>
        </View>
      )}

      <Screen>
        <ScreenHeader
          title="Operasyon Panosu"
          subtitle="Birleşik operasyonel görünüm — hastane yükü, kaynak hazırlığı, koridor sağlığı ve YZ karar desteği"
          pfs={["PF-SYS02", "PF-EMG01", "PF-GET07", "PF-GET08", "PF-AI04"]}
          note="Veriler AFAD, Kızılay, Sağlık Bakanlığı ve 112 arayüzlerinden Redis akış çekirdeği üzerinden gelir (DSN-001)."
        />

        {/* KPI şeridi */}
        <Grid gap={10}>
          <KPICard label="Hastane Yük Endeksi" value="%91" trend={9} color={C.danger} icon="heart" minWidth={140} />
          <KPICard label="Kaynak Hazırlık" value="%73" sub="hedef ≥%85" trend={-4} color={C.warning} icon="package" minWidth={140} />
          <KPICard label="Güvenli Düğüm" value="12/18" sub="hazır" color={C.success} icon="shield" minWidth={140} />
          <KPICard label="Koridor Sağlığı" value="%68" trend={-8} color={C.critical} icon="git-branch" minWidth={140} />
          <KPICard label="Uluslararası Yardım" value="7 Ülke" sub="aktif" color={C.gis} icon="globe" minWidth={140} />
          <KPICard label="Tahmin Güveni" value="%91" color={C.ai} icon="cpu" minWidth={140} />
          <KPICard label="YZ Öneri" value={String(pending)} sub="aktif tavsiye" color={C.ai} icon="zap" minWidth={140} />
          <KPICard label="Veri Senkron." value="12sn" color={C.success} icon="refresh-cw" minWidth={140} />
        </Grid>

        {/* Harita + YZ karar destek */}
        <Cols min={380}>
          <Card style={{ height: mapHeight, overflow: "hidden" }}>
            <OperationalMap
              compact
              layers={{
                hospitals: true,
                safeNodes: true,
                warehouses: true,
                corridors: true,
                resourceFlow: true,
                aiOverlay: true,
                medicalDemand: true,
              }}
            />
          </Card>

          <View style={{ gap: 8 }}>
            <Row gap={7}>
              <View style={[s.aiIcon, { backgroundColor: alpha(C.ai, 0.15) }]}>
                <Feather name="cpu" size={11} color={C.ai} />
              </View>
              <Txt size={12} weight="700" color={C.txt} style={{ flex: 1 }}>
                YZ Karar Destek Merkezi
              </Txt>
              <View style={[s.pendingChip, { backgroundColor: alpha(C.ai, 0.16) }]}>
                <Txt size={9.5} weight="700" color={C.ai}>
                  {`${pending} TAVSİYE`}
                </Txt>
              </View>
            </Row>
            {aiRecs.map((rec) => (
              <AIRecCard
                key={rec.id}
                rec={rec}
                expanded={expanded === rec.id}
                onToggle={() => setExpanded(expanded === rec.id ? null : rec.id)}
              />
            ))}
          </View>
        </Cols>

        {/* Özet paneller */}
        <Cols min={250}>
          <Card padded>
            <SectionHeader title="Tıbbi Kapasite" subtitle="YBÜ doluluk özeti" right={<PFBadge id="PF-EMG01" />} />
            {hospitalRows.slice(0, 5).map((h) => (
              <Row key={h.name} gap={7} style={{ marginBottom: 7 }}>
                <View style={[s.dot, { backgroundColor: loadColor(h.load) }]} />
                <Txt size={11} color={C.txt2} numberOfLines={1} style={{ flex: 1 }}>
                  {h.name.split(" ").slice(0, 2).join(" ")}
                </Txt>
                <Bar pct={h.load} color={loadColor(h.load)} style={{ width: 52 }} />
                <Txt size={10} color={loadColor(h.load)} mono style={{ width: 34, textAlign: "right" }}>
                  %{h.load}
                </Txt>
              </Row>
            ))}
          </Card>

          <Card padded>
            <SectionHeader title="Güvenli Düğüm Envanteri" subtitle="Stok · kalan gün" right={<PFBadge id="PF-GET08" />} />
            {GIS_SAFE_NODES.map((n) => {
              const cc = n.days <= 3 ? C.danger : n.days <= 7 ? C.warning : C.gis;
              return (
                <Row key={n.id} gap={7} style={{ marginBottom: 7 }}>
                  <View style={[s.dot, { backgroundColor: cc }]} />
                  <Txt size={10} weight="700" color={C.blue} mono style={{ width: 44 }}>
                    {n.id}
                  </Txt>
                  <Bar pct={n.water} color={cc} style={{ flex: 1 }} />
                  <Txt size={10} color={cc} mono style={{ width: 26, textAlign: "right" }}>
                    {n.days}g
                  </Txt>
                </Row>
              );
            })}
          </Card>

          <Card padded>
            <SectionHeader title="Kaynak Hazırlık" subtitle="Stok / talep" right={<PFBadge id="PF-GET08" />} />
            {resourceItems.map((r) => {
              const col = r.pct < 72 ? C.danger : r.pct < 80 ? C.warning : C.success;
              return (
                <Row key={r.name} gap={7} style={{ marginBottom: 7 }}>
                  <Txt size={11} color={C.txt2} style={{ width: 54 }}>
                    {r.name}
                  </Txt>
                  <Bar pct={r.pct} color={col} style={{ flex: 1 }} />
                  <Txt size={10} color={col} mono style={{ width: 34, textAlign: "right" }}>
                    %{r.pct}
                  </Txt>
                </Row>
              );
            })}
          </Card>

          <View style={{ gap: 10 }}>
            <Card padded>
              <Txt size={11} weight="600" color={C.txt} style={{ marginBottom: 8 }}>
                Simülasyon Çıktısı
              </Txt>
              {[
                { label: "Tahmini Kayıp", val: "780", color: C.danger },
                { label: "Hastane Doygunluğu", val: "%112", color: C.warning },
                { label: "Çadır Talebi", val: "12.000", color: C.ai },
                { label: "Su Talebi", val: "420K L", color: C.info },
              ].map(({ label, val, color }) => (
                <Row key={label} style={{ justifyContent: "space-between", marginBottom: 4 }}>
                  <Txt size={11} color={C.muted}>
                    {label}
                  </Txt>
                  <Txt size={11} weight="700" color={color} mono>
                    {val}
                  </Txt>
                </Row>
              ))}
            </Card>

            <Card padded>
              <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <Txt size={11} weight="600" color={C.txt}>
                  Uluslararası Yardım
                </Txt>
                <PFBadge id="PF-AI05" color={C.gis} />
              </Row>
              {[
                ["🇩🇪 Almanya", "Yolda · 4s"],
                ["🇬🇷 Yunanistan", "Mevcut"],
                ["🇪🇺 AB Fonu", "Onay sürecinde"],
              ].map(([c, st]) => (
                <Row key={c} style={{ justifyContent: "space-between", marginBottom: 4 }}>
                  <Txt size={11} color={C.txt2}>
                    {c}
                  </Txt>
                  <Txt size={10} color={C.muted}>
                    {st}
                  </Txt>
                </Row>
              ))}
            </Card>

            <Card padded>
              <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <Txt size={11} weight="600" color={C.txt}>
                  Son Sismik Olaylar
                </Txt>
                <PFBadge id="PF-DAT03" color={C.warning} />
              </Row>
              {[
                { t: "06:17", r: "Kahramanmaraş", m: "Mw 7.2", sev: C.danger },
                { t: "09:32", r: "Hatay – Asi", m: "Mw 5.4", sev: C.warning },
                { t: "11:05", r: "Adana – Seyhan", m: "Mw 4.1", sev: C.info },
              ].map((e) => (
                <Row key={e.t} gap={7} style={{ marginBottom: 4 }}>
                  <View style={[s.dot, { backgroundColor: e.sev }]} />
                  <Txt size={10} color={C.muted} mono>
                    {e.t}
                  </Txt>
                  <Txt size={10} color={C.txt2} numberOfLines={1} style={{ flex: 1 }}>
                    {e.r}
                  </Txt>
                  <Txt size={10} color={e.sev} mono weight="700">
                    {e.m}
                  </Txt>
                </Row>
              ))}
            </Card>
          </View>
        </Cols>
      </Screen>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: C.critical,
  },
  aiIcon: { width: 21, height: 21, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  pendingChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
