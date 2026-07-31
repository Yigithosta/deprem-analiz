import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, RADIUS, loadColor, readyColor, riskColor } from "../theme/tokens";
import { Screen, Cols } from "../components/Screen";
import {
  Txt, Row, Grid, Card, KPICard, SectionHeader, ScreenHeader, Bar,
  StatusBadge, PFBadge, PFBadgeRow, Table, AdvisoryNotice, Divider, type Col,
} from "../components/ui";
import { AreaChart } from "../components/charts";
import {
  hospitalRows, forecastData, safeNodeInventory, resourceItems, depots,
  incidents, ambulances, GIS_CORRIDORS,
} from "../data/mock";

/* ══════════════════ TIBBİ KAPASİTE — PF-EMG01 / PF-EMG05 ══════════════════ */

export function MedicalScreen() {
  const cols: Col[] = [
    { key: "name", label: "Hastane", width: 200 },
    { key: "cap", label: "Kapasite", width: 85 },
    { key: "icu", label: "YBÜ", width: 65 },
    { key: "load", label: "Mevcut Yük", width: 145 },
    { key: "forecast", label: "Tahmini Yük", width: 105 },
    { key: "risk", label: "Risk", width: 90 },
  ];

  return (
    <Screen>
      <ScreenHeader
        title="Tıbbi Kapasite İstihbaratı"
        subtitle="Hastane kapasitesi, YBÜ doluluk, acil servis yükü ve talep tahmini"
        pfs={["PF-EMG01", "PF-EMG05"]}
        note="Doluluk oranları Sağlık Bakanlığı'ndan Acil Durum Gateway üzerinden 60 sn'de bir alınır (DEP-002)."
      />

      <Grid>
        <KPICard label="Toplam Yatak" value="12.840" color={C.blue} icon="monitor" />
        <KPICard label="YBÜ Doluluk" value="%94" sub="kritik ≥%85" trend={9} color={C.danger} icon="activity" />
        <KPICard label="Acil Servis Yükü" value="%88" trend={6} color={C.warning} icon="heart" />
        <KPICard label="Tahmini Yük (8s)" value="%108" sub="YBÜ aşımı" color={C.critical} icon="trending-up" />
      </Grid>

      <Card>
        <Row style={s.cardHead}>
          <Txt size={13} weight="600" color={C.txt} style={{ flex: 1 }}>
            Tesis Yük & Kapasite Durumu
          </Txt>
          <PFBadgeRow ids={["PF-EMG05"]} />
        </Row>
        <Table
          cols={cols}
          rows={hospitalRows}
          keyExtractor={(r) => r.name}
          renderCell={(row, key) => {
            if (key === "name") return <Txt size={11.5} weight="500" color={C.txt}>{row.name}</Txt>;
            if (key === "cap") return <Txt size={11} color={C.txt2} mono>{row.cap}</Txt>;
            if (key === "icu") return <Txt size={11} color={C.txt2} mono>{row.icu}</Txt>;
            if (key === "load")
              return (
                <Row gap={7}>
                  <Bar pct={row.load} color={loadColor(row.load)} style={{ width: 60 }} />
                  <Txt size={11} color={loadColor(row.load)} mono>%{row.load}</Txt>
                </Row>
              );
            if (key === "forecast")
              return (
                <Txt size={11} color={row.forecast > 100 ? C.critical : C.txt2} mono>
                  %{row.forecast}
                </Txt>
              );
            return <StatusBadge status={row.risk} />;
          }}
        />
      </Card>

      <Cols min={330}>
        <Card padded>
          <SectionHeader title="7 Günlük Tıbbi Talep Tahmini" subtitle="Yerel Optimizasyon modeli çıktısı" right={<PFBadge id="PF-AI04" color={C.ai} />} />
          <AreaChart data={forecastData} series={[{ key: "med", label: "Tıbbi Talep %", color: C.blue }]} height={185} />
        </Card>

        <Card padded>
          <SectionHeader title="YZ Tıbbi Önerileri" right={<PFBadge id="PF-AI06" color={C.info} />} />
          <AdvisoryNotice />
          <View style={{ marginTop: 10 }}>
            {[
              { id: "med-1", title: "Adana → Ankara hasta transferi", detail: "32 kritik hasta için tahliye önerisi", conf: 94 },
              { id: "med-2", title: "Hatay'a 2 mobil triaj ünitesi", detail: "Saha kapasitesini artır", conf: 87 },
              { id: "med-3", title: "A+ kan bankası ikmali — Hatay", detail: "Kritik eşikte, acil tedarik", conf: 91 },
            ].map((r) => (
              <MiniAdvisory key={r.id} title={r.title} detail={r.detail} conf={r.conf} />
            ))}
          </View>
        </Card>
      </Cols>
    </Screen>
  );
}

/* ══════════════ ACİL SEVK & YÖNLENDİRME — PF-EMG02/03/04, PF-AI06 ══════════════ */

export function DispatchScreen() {
  const incCols: Col[] = [
    { key: "id", label: "Olay", width: 95 },
    { key: "loc", label: "Konum", width: 230 },
    { key: "type", label: "Tür", width: 120 },
    { key: "persons", label: "Kişi", width: 55 },
    { key: "time", label: "Saat", width: 65 },
    { key: "assigned", label: "Atanan", width: 95 },
    { key: "sev", label: "Öncelik", width: 90 },
  ];

  const ambCols: Col[] = [
    { key: "id", label: "Araç", width: 90 },
    { key: "crew", label: "Ekip", width: 70 },
    { key: "status", label: "Durum", width: 85 },
    { key: "dest", label: "Önerilen Hastane", width: 205 },
    { key: "route", label: "Güzergah", width: 175 },
    { key: "eta", label: "ETA", width: 60 },
    { key: "risk", label: "Yol Riski", width: 90 },
  ];

  return (
    <Screen>
      <ScreenHeader
        title="Acil Sevk & Yönlendirme"
        subtitle="112 olay noktaları, canlı ambulans konumları ve gerçek zamanlı YZ güzergah önerileri"
        pfs={["PF-EMG02", "PF-EMG03", "PF-EMG04", "PF-AI06"]}
        note="PER-004 — Güzergah istekleri normal yükte ≤ 10 sn içinde optimize güzergah döndürür."
      />

      <Grid>
        <KPICard label="Aktif Olay" value="3.812" trend={12} color={C.danger} icon="alert-circle" />
        <KPICard label="Görevdeki Ambulans" value="418/642" color={C.warning} icon="navigation" />
        <KPICard label="Ort. Yanıt Süresi" value="8.4 dk" trend={-6} color={C.success} icon="clock" />
        <KPICard label="Güzergah Yanıtı" value="1.8 sn" sub="hedef ≤10 sn" color={C.info} icon="zap" />
      </Grid>

      <AdvisoryNotice />

      <Card>
        <Row style={s.cardHead}>
          <Txt size={13} weight="600" color={C.txt} style={{ flex: 1 }}>
            Acil Olay / İhbar Noktaları
          </Txt>
          <PFBadgeRow ids={["PF-EMG02"]} />
        </Row>
        <Table
          cols={incCols}
          rows={incidents}
          keyExtractor={(r) => r.id}
          renderCell={(row, key) => {
            if (key === "id") return <Txt size={11} weight="700" color={C.blue} mono>{row.id}</Txt>;
            if (key === "sev") return <StatusBadge status={row.sev} />;
            if (key === "persons") return <Txt size={11} color={C.txt2} mono>{row.persons}</Txt>;
            if (key === "assigned")
              return (
                <Txt size={11} color={row.assigned === "—" ? C.danger : C.txt2} mono>
                  {row.assigned}
                </Txt>
              );
            return <Txt size={11} color={key === "loc" ? C.txt : C.txt2}>{row[key]}</Txt>;
          }}
        />
      </Card>

      <Card>
        <Row style={s.cardHead}>
          <Txt size={13} weight="600" color={C.txt} style={{ flex: 1 }}>
            Ambulans Konumları & Önerilen Güzergahlar
          </Txt>
          <PFBadgeRow ids={["PF-EMG03", "PF-EMG04"]} />
        </Row>
        <Table
          cols={ambCols}
          rows={ambulances}
          keyExtractor={(r) => r.id}
          renderCell={(row, key) => {
            if (key === "id") return <Txt size={11} weight="700" color={C.blue} mono>{row.id}</Txt>;
            if (key === "risk") return <StatusBadge status={row.risk} />;
            if (key === "status")
              return (
                <Txt size={11} color={row.status === "Müsait" ? C.success : C.txt2}>
                  {row.status}
                </Txt>
              );
            if (key === "route")
              return (
                <Txt size={10.5} color={row.route.includes("kapalı") ? C.warning : C.txt2} mono>
                  {row.route}
                </Txt>
              );
            if (key === "eta") return <Txt size={11} color={C.txt2} mono>{row.eta}</Txt>;
            return <Txt size={11} color={C.txt2}>{row[key]}</Txt>;
          }}
        />
      </Card>

      <Cols min={330}>
        <Card padded>
          <SectionHeader
            title="Hastane Uygunluk Görünümü"
            subtitle="112'ye sunulan karar-hazır kapasite özeti"
            right={<PFBadge id="PF-EMG05" />}
          />
          {hospitalRows.map((h) => (
            <Row key={h.name} gap={8} style={{ marginBottom: 8 }}>
              <View style={[s.dot, { backgroundColor: loadColor(h.load) }]} />
              <Txt size={11} color={C.txt2} numberOfLines={1} style={{ flex: 1 }}>
                {h.name}
              </Txt>
              <Txt size={10} color={C.muted} mono>
                {h.icu} YBÜ
              </Txt>
              <Txt size={11} weight="700" color={loadColor(h.load)} mono style={{ width: 40, textAlign: "right" }}>
                %{h.load}
              </Txt>
            </Row>
          ))}
        </Card>

        <Card padded>
          <SectionHeader
            title="Koridor Yol Riski"
            subtitle="Güzergah önerisini besleyen yol riski çıktısı"
            right={<PFBadge id="PF-GET03" color={C.gis} />}
          />
          {GIS_CORRIDORS.filter((c) => !c.international).map((c) => (
            <Row key={c.id} gap={8} style={{ marginBottom: 8 }}>
              <View style={{ width: 16, height: 3, borderRadius: 2, backgroundColor: c.color }} />
              <Txt size={11} color={C.txt2} mono style={{ width: 46 }}>
                {c.id}
              </Txt>
              <Bar pct={c.risk} color={c.color} style={{ flex: 1 }} />
              <Txt size={10} weight="700" color={c.color} mono style={{ width: 56, textAlign: "right" }}>
                risk %{c.risk}
              </Txt>
            </Row>
          ))}
        </Card>
      </Cols>
    </Screen>
  );
}

/* ═══════════ GÜVENLİ DÜĞÜM & KORİDOR — PF-GET07 / PF-GET08 ═══════════ */

export function LogisticsScreen() {
  const cols: Col[] = [
    { key: "id", label: "Düğüm", width: 80 },
    { key: "loc", label: "Konum", width: 155 },
    { key: "tents", label: "Çadır", width: 115 },
    { key: "water", label: "Su", width: 115 },
    { key: "food", label: "Gıda", width: 115 },
    { key: "medical", label: "Tıbbi", width: 115 },
    { key: "days", label: "Kalan Gün", width: 85 },
    { key: "priority", label: "Öncelik", width: 90 },
  ];

  const stockCell = (v: number) => (
    <Row gap={6}>
      <Bar pct={v} color={v < 30 ? C.danger : v < 60 ? C.warning : C.success} style={{ width: 46 }} />
      <Txt size={10} color={v < 30 ? C.danger : v < 60 ? C.warning : C.txt2} mono>
        %{v}
      </Txt>
    </Row>
  );

  return (
    <Screen>
      <ScreenHeader
        title="Güvenli Düğüm & Lojistik Koridor İstihbaratı"
        subtitle="Stok envanteri, ikmal önceliği, koridor güvenilirliği ve transport riski"
        pfs={["PF-GET07", "PF-GET08", "PF-DAT01", "PF-DAT02"]}
        note="SRS Figure 3-2 — Güvenli Düğüm & Lojistik Koridor ekranı. CON-017 uyarınca konumlar işlevsel kategori olarak tutulur."
      />

      <Grid>
        <KPICard label="Aktif Güvenli Düğüm" value="12/18" color={C.success} icon="shield" />
        <KPICard label="İkmal Öncelikli" value="2 düğüm" sub="≤3 gün stok" color={C.danger} icon="alert-triangle" />
        <KPICard label="Koridor Güvenilirliği" value="%65" trend={-8} color={C.warning} icon="git-branch" />
        <KPICard label="Açık Koridor" value="2/5" color={C.critical} icon="x-circle" />
      </Grid>

      <Card>
        <Row style={s.cardHead}>
          <Txt size={13} weight="600" color={C.txt} style={{ flex: 1 }}>
            Güvenli Düğüm Stok Envanteri
          </Txt>
          <PFBadgeRow ids={["PF-GET08"]} />
        </Row>
        <Table
          cols={cols}
          rows={safeNodeInventory}
          keyExtractor={(r) => r.id}
          renderCell={(row, key) => {
            if (key === "id") return <Txt size={11} weight="700" color={C.blue} mono>{row.id}</Txt>;
            if (key === "loc") return <Txt size={11} color={C.txt2}>{row.loc}</Txt>;
            if (["tents", "water", "food", "medical"].includes(key)) return stockCell(row[key]);
            if (key === "days")
              return (
                <Txt size={11} weight="700" mono color={row.days <= 3 ? C.danger : row.days <= 7 ? C.warning : C.success}>
                  {row.days}g
                </Txt>
              );
            return <StatusBadge status={row.priority} />;
          }}
        />
      </Card>

      <Card padded>
        <SectionHeader
          title="YZ Lojistik Güzergah Önerileri"
          subtitle="Yerel Optimizasyon modeli · insan onayı bekliyor"
          right={<PFBadge id="PF-AI04" color={C.ai} />}
        />
        <AdvisoryNotice />
        <View style={{ marginTop: 10 }}>
          {[
            { id: "log-1", title: "Su Tankeri x8 — Adıyaman → SN-07", detail: "C-04 üzerinden · kapsama 2 → 10 gün", conf: 91, sev: "critical" },
            { id: "log-2", title: "Gıda 12t + Çadır 200 — Konya → SN-03", detail: "C-04 + C-01 üzerinden · kapsama 3 → 9 gün", conf: 87, sev: "high" },
          ].map((r) => (
            <MiniAdvisory key={r.id} title={r.title} detail={r.detail} conf={r.conf} sev={r.sev} />
          ))}
        </View>
      </Card>

      <Card padded>
        <SectionHeader title="Koridor Güvenilirliği" subtitle="Yük ve risk skorları" right={<PFBadge id="PF-GET03" color={C.gis} />} />
        {GIS_CORRIDORS.map((c) => (
          <View key={c.id} style={{ marginBottom: 11 }}>
            <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <Row gap={7}>
                <View style={{ width: 16, height: 3, borderRadius: 2, backgroundColor: c.color }} />
                <Txt size={11} color={C.txt}>
                  {c.label}
                </Txt>
              </Row>
              <StatusBadge
                status={c.status === "operational" ? "online" : c.status === "risky" ? "critical" : "degraded"}
                label={c.status === "operational" ? "OPERASYONEL" : c.status === "risky" ? "RİSKLİ" : "KISITLI"}
              />
            </Row>
            <Row gap={8}>
              <Txt size={9} color={C.muted} style={{ width: 34 }}>
                Yük
              </Txt>
              <Bar pct={c.load} color={c.color} style={{ flex: 1 }} />
              <Txt size={10} color={c.color} mono style={{ width: 34, textAlign: "right" }}>
                %{c.load}
              </Txt>
            </Row>
            <Row gap={8} style={{ marginTop: 3 }}>
              <Txt size={9} color={C.muted} style={{ width: 34 }}>
                Risk
              </Txt>
              <Bar pct={c.risk} color={c.risk > 70 ? C.danger : c.risk > 40 ? C.warning : C.success} style={{ flex: 1 }} />
              <Txt size={10} color={C.muted} mono style={{ width: 34, textAlign: "right" }}>
                %{c.risk}
              </Txt>
            </Row>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

/* ═══════════════ KAYNAK OPTİMİZASYONU — PF-AI04 / PF-GET08 ═══════════════ */

export function AllocationScreen() {
  return (
    <Screen>
      <ScreenHeader
        title="Kaynak Tahsis Optimizasyonu"
        subtitle="Arz, talep, açık analizi ve YZ yeniden dağıtım planları"
        pfs={["PF-AI04", "PF-GET07", "PF-GET08"]}
        note="Yerel Optimizasyon modeli, güncel stok (PF-DAT02), talep tahmini ve risk çıktılarını birlikte değerlendirir."
      />

      <Grid>
        {resourceItems.map((r) => {
          const col = r.pct < 72 ? C.danger : r.pct < 80 ? C.warning : C.success;
          return (
            <View key={r.name} style={[s.resCard, { flexBasis: 150, flexGrow: 1 }]}>
              <Txt size={12} weight="600" color={C.txt}>
                {r.name}
              </Txt>
              <Txt size={19} weight="700" color={col} mono style={{ marginTop: 5 }}>
                %{r.pct}
              </Txt>
              <Bar pct={r.pct} color={col} style={{ marginTop: 6 }} />
              <Row style={{ justifyContent: "space-between", marginTop: 5 }}>
                <Txt size={9} color={C.muted} mono>
                  {r.stock.toLocaleString("tr-TR")}
                </Txt>
                <Txt size={9} color={C.muted} mono>
                  {r.demand.toLocaleString("tr-TR")} {r.unit}
                </Txt>
              </Row>
            </View>
          );
        })}
      </Grid>

      <Card padded>
        <SectionHeader
          title="YZ Yeniden Dağıtım Planı"
          subtitle="%89 optimize · her kalem ayrı onay gerektirir"
          right={<PFBadge id="PF-AI04" color={C.ai} />}
        />
        <AdvisoryNotice />
        <View style={{ marginTop: 10 }}>
          {[
            { id: "alloc-1", title: "Su Tankeri x8 — Adıyaman → Hatay (12 düğüm)", detail: "45.000 kişi için 12 gün kapsama", conf: 94, sev: "critical" },
            { id: "alloc-2", title: "120 YBÜ Yatağı — Ankara Merkez → Adana", detail: "Kapasite aşımını önler", conf: 92, sev: "critical" },
            { id: "alloc-3", title: "Yakıt 40.000L — Gaziantep → C-02 Koridoru", detail: "48 saat operasyon güvencesi", conf: 86, sev: "high" },
          ].map((r) => (
            <MiniAdvisory key={r.id} title={r.title} detail={r.detail} conf={r.conf} sev={r.sev} />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

/* ══════════ STRATEJİK ÖN KONUŞLANMA — SRS Figure 3-3 ══════════ */

export function PrepositioningScreen() {
  return (
    <Screen>
      <ScreenHeader
        title="Stratejik Afet Öncesi Ön Konuşlanma"
        subtitle="YZ destekli optimal kaynak yerleşimi, hazırlık skoru ve senaryo hazırlığı"
        pfs={["PF-AI04", "PF-GET07", "PF-DAT01"]}
        note="SRS Figure 3-3 — Stratejik Ön Konuşlanma ekranı."
      />

      <Grid>
        <KPICard label="Genel Hazırlık Skoru" value="%74" sub="hedef ≥%85" trend={-3} color={C.warning} icon="shield" />
        <KPICard label="Ön Konuşlanan Varlık" value="2.840" color={C.blue} icon="box" />
        <KPICard label="Kritik Depo" value="2/6" color={C.danger} icon="alert-triangle" />
        <KPICard label="Kapsanan Nüfus" value="400K" color={C.success} icon="users" />
      </Grid>

      <Grid>
        {depots.map((d) => (
          <Card key={d.name} padded style={{ flexBasis: 260, flexGrow: 1 }}>
            <Row style={{ alignItems: "flex-start", justifyContent: "space-between", marginBottom: 11 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Txt size={12.5} weight="600" color={C.txt}>
                  {d.name}
                </Txt>
                <Txt size={10.5} color={C.muted} style={{ marginTop: 2 }}>
                  {d.region} · {d.cover}
                </Txt>
              </View>
              <StatusBadge status={d.status} />
            </Row>
            {[
              { label: "Stok", val: d.stock },
              { label: "Hazırlık", val: d.prep },
            ].map(({ label, val }) => (
              <View key={label} style={{ marginBottom: 7 }}>
                <Row style={{ justifyContent: "space-between", marginBottom: 3 }}>
                  <Txt size={10.5} color={C.muted}>
                    {label}
                  </Txt>
                  <Txt size={10.5} weight="700" color={readyColor(val)} mono>
                    %{val}
                  </Txt>
                </Row>
                <Bar pct={val} color={readyColor(val)} />
              </View>
            ))}
          </Card>
        ))}
      </Grid>

      <Card padded>
        <SectionHeader title="Senaryo Hazırlığı" subtitle="Temsili afet senaryolarına karşı hazırlık derecesi" />
        {[
          { scenario: "Büyük Kentsel Maruziyet", readiness: 74, gap: "Tıbbi malzeme ve çadır açığı" },
          { scenario: "Geniş Alan Lojistik Stres", readiness: 61, gap: "C-02 ve C-05 risk altında" },
          { scenario: "Çoklu Bölge Eş Zamanlı", readiness: 52, gap: "Rezerv depo kapasitesi yetersiz" },
          { scenario: "Uzun Süreli (14+ gün)", readiness: 68, gap: "Su ikmal sürdürülebilirliği kritik" },
        ].map((sc) => (
          <View key={sc.scenario} style={{ marginBottom: 12 }}>
            <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <Txt size={11.5} weight="500" color={C.txt} style={{ flex: 1 }}>
                {sc.scenario}
              </Txt>
              <Txt size={11.5} weight="700" color={readyColor(sc.readiness)} mono>
                %{sc.readiness}
              </Txt>
            </Row>
            <Bar pct={sc.readiness} color={readyColor(sc.readiness)} height={7} />
            <Txt size={10} color={C.muted} style={{ marginTop: 4 }}>
              {sc.gap}
            </Txt>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

/* ═══════════════════ Ortak: küçük tavsiye kartı ═══════════════════ */

/**
 * CON-007 — YZ önerisi tavsiye niteliğindedir. Konsol salt-okunur olduğundan
 * kart yalnızca öneriyi ve güven skorunu gösterir; onay/ret kararı burada
 * verilmez.
 */
export function MiniAdvisory({
  title,
  detail,
  conf,
  sev,
}: {
  title: string;
  detail: string;
  conf: number;
  sev?: string;
}) {
  return (
    <View style={[s.mini, sev === "critical" && { borderColor: alpha(C.danger, 0.35) }]}>
      <Row style={{ alignItems: "flex-start", justifyContent: "space-between" }} gap={8}>
        <View style={{ flex: 1 }}>
          <Row gap={6} wrap>
            {!!sev && <StatusBadge status={sev} />}
            <Txt size={11.5} weight="600" color={C.txt} style={{ flexShrink: 1 }}>
              {title}
            </Txt>
          </Row>
          <Txt size={10.5} color={C.muted} style={{ marginTop: 3 }}>
            {detail}
          </Txt>
        </View>
        <View style={[s.confChip, { backgroundColor: alpha(C.ai, 0.15) }]}>
          <Txt size={9.5} weight="700" color={C.ai} mono>
            %{conf}
          </Txt>
        </View>
      </Row>

      {/* Salt-okunur konsol: öneri yalnızca gösterilir, karar sistem dışında verilir. */}
      <Row gap={6} style={{ marginTop: 9 }}>
        <Feather name="info" size={12} color={C.warning} />
        <Txt size={10.5} color={C.warning} style={{ flex: 1 }}>
          Tavsiye niteliğindedir · karar yetkili personelce verilir
        </Txt>
      </Row>
    </View>
  );
}

const s = StyleSheet.create({
  cardHead: {
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  resCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  mini: {
    backgroundColor: C.cardEl,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.md,
    padding: 11,
    marginBottom: 9,
  },
  confChip: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
});
