import React, { useEffect, useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, FONT, RADIUS, readyColor } from "../theme/tokens";
import { Screen, Cols } from "../components/Screen";
import {
  Txt, Row, Grid, Card, KPICard, SectionHeader, ScreenHeader, Bar, Btn,
  StatusBadge, PFBadge, PFBadgeRow, Table, AdvisoryNotice, Divider,
  type Col,
} from "../components/ui";
import { AreaChart, BarChart } from "../components/charts";
import { dataSources, models, forecastData, roadDamageEntries } from "../data/mock";
import { useApp } from "../state/AppState";

/* ═══════════ VERİ TOPLAMA DURUMU — PF-DAT01…06, PF-EMG01…03 ═══════════ */

export function DataAcquisitionScreen() {
  const cols: Col[] = [
    { key: "pf", label: "Fonksiyon", width: 100 },
    { key: "name", label: "Veri Kaynağı", width: 230 },
    { key: "provider", label: "Sağlayıcı", width: 150 },
    { key: "gateway", label: "Gateway", width: 115 },
    { key: "records", label: "Kayıt", width: 110 },
    { key: "freq", label: "Sıklık", width: 80 },
    { key: "lastSync", label: "Son Senkron", width: 110 },
    { key: "latency", label: "Gecikme", width: 85 },
    { key: "status", label: "Durum", width: 100 },
  ];

  const online = dataSources.filter((d) => d.status === "online").length;

  return (
    <Screen>
      <ScreenHeader
        title="Veri Toplama Durumu"
        subtitle="Dış sağlayıcı entegrasyonlarının canlı sağlık durumu, senkron sıklığı ve gecikmesi"
        pfs={["PF-DAT01", "PF-DAT02", "PF-DAT03", "PF-DAT04", "PF-DAT05", "PF-DAT06"]}
        note="PER-007 — Yüksek hacimli veri alımı, alt servisler doygun olduğunda Redis Stream'de tamponlanarak veri kaybı olmadan sürdürülür."
      />

      <Grid>
        <KPICard label="Aktif Kaynak" value={`${online}/${dataSources.length}`} color={C.success} icon="database" />
        <KPICard label="Kesintisiz Alım" value="%99.4" sub="son 24 saat" color={C.gis} icon="activity" />
        <KPICard label="Ort. Gecikme" value="640 ms" sub="hedef ≤1 sn" color={C.info} icon="clock" />
        <KPICard label="Bayat Kaynak" value="1" sub="PF-DAT05" trend={1} color={C.warning} icon="alert-triangle" />
      </Grid>

      <Card>
        <Row style={s.cardHead}>
          <View style={{ flex: 1 }}>
            <Txt size={13} weight="600" color={C.txt}>
              Dış Sağlayıcı Arayüzleri
            </Txt>
            <Txt size={10.5} color={C.muted} style={{ marginTop: 2 }}>
              CON-002 — tüm entegrasyonlar belgelenmiş API'ler üzerinden · DSN-004
            </Txt>
          </View>
        </Row>
        <Table
          cols={cols}
          rows={dataSources}
          keyExtractor={(r) => r.pf}
          renderCell={(row, key) => {
            if (key === "pf") return <PFBadge id={row.pf} />;
            if (key === "status") return <StatusBadge status={row.status} />;
            if (key === "name") return <Txt size={11.5} weight="500" color={C.txt}>{row.name}</Txt>;
            if (key === "latency")
              return (
                <Txt size={11} mono color={row.latency > 1000 ? C.warning : C.txt2}>
                  {row.latency ? `${row.latency} ms` : "—"}
                </Txt>
              );
            if (key === "lastSync")
              return (
                <Txt size={11} mono color={row.status === "degraded" ? C.warning : C.txt2}>
                  {row.lastSync}
                </Txt>
              );
            return <Txt size={11} color={C.txt2} mono={key === "records"}>{row[key]}</Txt>;
          }}
        />
      </Card>

      <Cols min={330}>
        <Card padded>
          <SectionHeader
            title="Bağımlılıklar"
            subtitle="SRS §2.5.2 — dış bağımlılıklar ve karşılık gelen kaynaklar"
          />
          {[
            { id: "DEP-001", text: "Afet izleme kuruluşlarının afet verisi", ok: true },
            { id: "DEP-002", text: "Sağlık kurumlarının kapasite verisi", ok: true },
            { id: "DEP-003", text: "İnsani yardım envanter bilgisi", ok: true },
            { id: "DEP-004", text: "Geospatial veri, harita servisleri, altyapı bilgisi", ok: true },
            { id: "DEP-005", text: "Acil müdahale kuruluşlarının operasyonel verisi", ok: true },
            { id: "DEP-006", text: "İletişim ağları ve destek altyapısı", ok: true },
            { id: "DEP-007", text: "Uluslararası yardım verisi (ulusal otoriteler üzerinden)", ok: true },
            { id: "DEP-008", text: "AFAD yapısal maruziyet / kırılganlık verisi", ok: false },
            { id: "DEP-009", text: "Güncel deprem verisi (Kandilli API)", ok: true },
          ].map((d) => (
            <Row key={d.id} gap={8} style={{ marginBottom: 8, alignItems: "flex-start" }}>
              <Feather
                name={d.ok ? "check-circle" : "alert-circle"}
                size={12}
                color={d.ok ? C.success : C.warning}
                style={{ marginTop: 2 }}
              />
              <Txt size={10} weight="700" color={d.ok ? C.success : C.warning} mono style={{ width: 62 }}>
                {d.id}
              </Txt>
              <Txt size={11} color={C.txt2} style={{ flex: 1 }}>
                {d.text}
              </Txt>
            </Row>
          ))}
        </Card>

        <Card padded>
          <SectionHeader title="Alım Hacmi" subtitle="Son 7 gün · bin kayıt/gün" />
          <BarChart
            data={forecastData.map((d, i) => ({ day: d.day, vol: [42, 51, 78, 96, 88, 72, 64][i] }))}
            series={{ key: "vol", label: "Alınan kayıt (bin)", color: C.gis }}
            height={185}
          />
          <Divider style={{ marginVertical: 12 }} />
          <Txt size={10.5} color={C.muted}>
            PF-DAT03 (Kandilli gözlemevi) aktör etkileşimi olmadan otomatik tüketilir; kaynak kullanıcı değil, veri
            beslemesi olarak ele alınır.
          </Txt>
        </Card>
      </Cols>
    </Screen>
  );
}

/* ══════ YZ MODEL ORKESTRASYONU — PF-AI01…06 + PF-GET01…08 ══════ */

export function OrchestrationScreen() {
  const { runs, triggerModel, role } = useApp();

  return (
    <Screen>
      <ScreenHeader
        title="YZ Model Orkestrasyonu"
        subtitle="Dağıtım Sistemi ve Optimizasyon Servisi modellerinin tetiklenmesi ve sonuçlarının alınması"
        pfs={["PF-AI01", "PF-AI02", "PF-AI03", "PF-AI04", "PF-AI05", "PF-AI06"]}
        note="Tetikleme Redis Stream üzerinden asenkron yayılır; sonuç alma çağrıları gRPC ile senkron yapılır (SRS §3.1.4)."
      />

      <AdvisoryNotice />

      <Grid>
        {models.map((m) => {
          const run = runs[m.pf];
          const running = run?.status === "running";
          const done = run?.status === "done";
          // SEC-009 — model yalnızca SRS §2.3'te tanımlı aktörü tarafından tetiklenebilir.
          const allowed = role?.id === "ADMIN" || role?.functions.includes(m.pf);

          return (
            <Card key={m.pf} padded style={{ flexBasis: 330, flexGrow: 1 }}>
              <Row style={{ alignItems: "flex-start", justifyContent: "space-between" }} gap={8}>
                <Row gap={9} style={{ flex: 1 }}>
                  <View style={[s.modelIcon, { backgroundColor: alpha(m.color, 0.15) }]}>
                    <Feather name="cpu" size={14} color={m.color} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt size={12.5} weight="700" color={C.txt}>
                      {m.name}
                    </Txt>
                    <Txt size={10} color={C.muted} mono>
                      {m.engine} · {m.subsystem}
                    </Txt>
                  </View>
                </Row>
                <StatusBadge status={done ? "ready" : running ? "idle" : m.status} label={running ? "ÇALIŞIYOR" : undefined} />
              </Row>

              <Txt size={11} color={C.txt2} style={{ marginTop: 9, lineHeight: 16 }}>
                {m.desc}
              </Txt>

              <View style={{ marginTop: 10 }}>
                <Txt size={9} weight="700" color={C.muted} upper>
                  Girdiler
                </Txt>
                <Row gap={4} wrap style={{ marginTop: 4 }}>
                  {m.inputs.map((i) => (
                    <PFBadge key={i} id={i} color={C.gis} />
                  ))}
                </Row>
              </View>

              {!!m.getPf.length && (
                <View style={{ marginTop: 8 }}>
                  <Txt size={9} weight="700" color={C.muted} upper>
                    Sonuç Alma
                  </Txt>
                  <Row gap={4} wrap style={{ marginTop: 4 }}>
                    {m.getPf.map((i) => (
                      <PFBadge key={i} id={i} color={C.blue} />
                    ))}
                  </Row>
                </View>
              )}

              <Divider style={{ marginVertical: 11 }} />

              <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <Txt size={10} color={C.muted}>
                  Son çalıştırma
                </Txt>
                <Txt size={10} color={C.txt2} mono>
                  {done ? `Az önce (${run?.finishedAt})` : m.lastRun} · {m.duration}
                </Txt>
              </Row>

              {running && (
                <View style={{ marginBottom: 9 }}>
                  <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
                    <Txt size={10} color={C.muted}>
                      Çalışıyor…
                    </Txt>
                    <Txt size={10} color={m.color} mono>
                      %{run.progress}
                    </Txt>
                  </Row>
                  <Bar pct={run.progress} color={m.color} />
                </View>
              )}

              <Row gap={6}>
                <Btn
                  label={running ? "Çalışıyor…" : `${m.pf} Tetikle`}
                  icon="play"
                  small
                  color={m.color}
                  disabled={running || !allowed}
                  onPress={() => triggerModel(m.pf)}
                  style={{ flex: 1 }}
                />
                <Btn
                  label="Sonuçları Al"
                  icon="download"
                  small
                  variant="outline"
                  color={C.blue}
                  disabled={!m.getPf.length}
                  style={{ flex: 1 }}
                />
              </Row>

              {!allowed && (
                <Txt size={9.5} color={C.warning} style={{ marginTop: 7 }}>
                  SEC-009 — Bu model yalnızca {m.actor} tarafından tetiklenebilir.
                </Txt>
              )}
            </Card>
          );
        })}
      </Grid>
    </Screen>
  );
}

/* ══════════ SAHA VERİ GİRİŞİ — PF-RSK01 ══════════ */

export function FieldEntryScreen() {
  const { roadDamage, addRoadDamage, role } = useApp();
  const [segment, setSegment] = useState("");
  const [type, setType] = useState("Enkaz / moloz");
  const [severity, setSeverity] = useState("restricted");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const canEnter = role?.id === "AFAD" || role?.id === "ADMIN";

  function submit() {
    if (!segment.trim()) return;
    addRoadDamage({ segment: segment.trim(), type, severity, note: note.trim() || "—" });
    setSegment("");
    setNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2600);
  }

  const cols: Col[] = [
    { key: "id", label: "Kayıt", width: 85 },
    { key: "segment", label: "Yol Kesimi", width: 235 },
    { key: "type", label: "Hasar Türü", width: 130 },
    { key: "severity", label: "Erişilebilirlik", width: 120 },
    { key: "entered", label: "Giren", width: 115 },
    { key: "note", label: "Not", width: 240 },
    { key: "consumedBy", label: "Tüketen", width: 100 },
  ];

  return (
    <Screen>
      <ScreenHeader
        title="Saha Veri Girişi — Yol Hasarı & Erişim Kısıtı"
        subtitle="Afet sonrası yol hasarları, kapalı güzergahlar ve erişilebilirlik kısıtlarının sisteme girilmesi"
        pfs={["PF-RSK01"]}
        note="Girilen veri Yol Riski modeli (PF-AI03), güzergah optimizasyonu ve lojistik planlama modülleri tarafından tüketilir."
      />

      <Cols min={330}>
        <Card padded>
          <SectionHeader
            title="Yeni Hasar Kaydı"
            subtitle="Koordinasyon Gateway üzerinden iletilir"
            right={<PFBadge id="PF-RSK01" color={C.warning} />}
          />

          {!canEnter && (
            <View style={s.denied}>
              <Feather name="lock" size={13} color={C.danger} />
              <Txt size={10.5} color={C.danger} style={{ flex: 1 }}>
                SEC-009 — Bu fonksiyon yalnızca AFAD rolüne atanmıştır. Kayıtları görüntüleyebilir, ancak yeni giriş
                yapamazsınız.
              </Txt>
            </View>
          )}

          <Txt size={11} weight="500" color={C.txt2} style={{ marginBottom: 6, marginTop: 4 }}>
            Yol Kesimi
          </Txt>
          <TextInput
            value={segment}
            onChangeText={setSegment}
            editable={canEnter}
            placeholder="Örn. E-90 / Km 214 (Mersin–Hatay)"
            placeholderTextColor={C.muted}
            style={[s.input, !canEnter && { opacity: 0.5 }]}
          />

          <Txt size={11} weight="500" color={C.txt2} style={{ marginTop: 13, marginBottom: 6 }}>
            Hasar Türü
          </Txt>
          <Row gap={6} wrap>
            {["Köprü hasarı", "Yüzey çökmesi", "Enkaz / moloz", "Heyelan", "Su baskını"].map((t) => (
              <Pressable
                key={t}
                disabled={!canEnter}
                onPress={() => setType(t)}
                style={[s.chip, type === t && { backgroundColor: alpha(C.blue, 0.16), borderColor: C.blue }]}
              >
                <Txt size={10.5} color={type === t ? C.blue : C.txt2} weight={type === t ? "600" : "400"}>
                  {t}
                </Txt>
              </Pressable>
            ))}
          </Row>

          <Txt size={11} weight="500" color={C.txt2} style={{ marginTop: 13, marginBottom: 6 }}>
            Erişilebilirlik
          </Txt>
          <Row gap={6} wrap>
            {[
              { k: "passable", l: "Geçilebilir", c: C.success },
              { k: "restricted", l: "Kısıtlı", c: C.warning },
              { k: "impassable", l: "Geçilemez", c: C.critical },
            ].map((o) => (
              <Pressable
                key={o.k}
                disabled={!canEnter}
                onPress={() => setSeverity(o.k)}
                style={[
                  s.chip,
                  severity === o.k && { backgroundColor: alpha(o.c, 0.16), borderColor: o.c },
                ]}
              >
                <Txt size={10.5} color={severity === o.k ? o.c : C.txt2} weight={severity === o.k ? "600" : "400"}>
                  {o.l}
                </Txt>
              </Pressable>
            ))}
          </Row>

          <Txt size={11} weight="500" color={C.txt2} style={{ marginTop: 13, marginBottom: 6 }}>
            Saha Notu
          </Txt>
          <TextInput
            value={note}
            onChangeText={setNote}
            editable={canEnter}
            multiline
            numberOfLines={3}
            placeholder="Gözlem, kısıt ve tahmini açılma süresi…"
            placeholderTextColor={C.muted}
            style={[s.input, { height: 74, textAlignVertical: "top" }, !canEnter && { opacity: 0.5 }]}
          />

          <Btn
            label="Kaydı Gönder"
            icon="upload"
            disabled={!canEnter || !segment.trim()}
            onPress={submit}
            style={{ marginTop: 14 }}
          />

          {saved && (
            <Row gap={7} style={s.savedNote}>
              <Feather name="check-circle" size={13} color={C.success} />
              <Txt size={10.5} color={C.success} style={{ flex: 1 }}>
                Kayıt alındı, denetim kaydına yazıldı (SEC-006) ve Yol Riski modeli yeniden çalıştırılmak üzere
                işaretlendi.
              </Txt>
            </Row>
          )}
        </Card>

        <Card padded>
          <SectionHeader title="Veri Akışı" subtitle="Saha girdisinin sistemdeki yolu" />
          {[
            { pf: "PF-RSK01", label: "AFAD saha girişi", desc: "Koordinasyon Gateway", color: C.warning },
            { pf: "PF-AI03", label: "Yol Riski modeli", desc: "Bina hasarı + OSM + saha verisi", color: C.critical },
            { pf: "PF-GET03", label: "Yol riski sonuçları", desc: "Dağıtım Sistemi'nden alınır", color: C.blue },
            { pf: "PF-EMG04", label: "Güzergah önerisi", desc: "112 ambulanslarına iletilir", color: C.info },
            { pf: "PF-AI04", label: "Yerel optimizasyon", desc: "Kaynak hareketleri yeniden planlanır", color: C.ai },
          ].map((step, i, arr) => (
            <View key={step.pf}>
              <Row gap={10}>
                <View style={[s.flowDot, { borderColor: step.color, backgroundColor: alpha(step.color, 0.2) }]} />
                <View style={{ flex: 1 }}>
                  <Row gap={6}>
                    <PFBadge id={step.pf} color={step.color} />
                    <Txt size={11.5} weight="600" color={C.txt}>
                      {step.label}
                    </Txt>
                  </Row>
                  <Txt size={10} color={C.muted} style={{ marginTop: 2 }}>
                    {step.desc}
                  </Txt>
                </View>
              </Row>
              {i < arr.length - 1 && <View style={[s.flowLine, { backgroundColor: alpha(step.color, 0.4) }]} />}
            </View>
          ))}
        </Card>
      </Cols>

      <Card>
        <Row style={s.cardHead}>
          <Txt size={13} weight="600" color={C.txt} style={{ flex: 1 }}>
            Girilen Yol Hasarı Kayıtları ({roadDamage.length})
          </Txt>
          <PFBadgeRow ids={["PF-RSK01", "PF-AI03"]} />
        </Row>
        <Table
          cols={cols}
          rows={roadDamage}
          keyExtractor={(r) => r.id}
          renderCell={(row, key) => {
            if (key === "id") return <Txt size={11} weight="700" color={C.blue} mono>{row.id}</Txt>;
            if (key === "severity") return <StatusBadge status={row.severity} />;
            if (key === "consumedBy") return <PFBadge id={row.consumedBy} color={C.critical} />;
            if (key === "segment") return <Txt size={11} color={C.txt} mono>{row.segment}</Txt>;
            return <Txt size={11} color={C.txt2}>{row[key]}</Txt>;
          }}
        />
      </Card>
    </Screen>
  );
}

/* ══════════ YZ TAHMİNLEME — PF-AI04 ══════════ */

export function ForecastingScreen() {
  return (
    <Screen>
      <ScreenHeader
        title="YZ Tahminleme & Talep Öngörüsü"
        subtitle="7 günlük çok değişkenli senaryo analizi · tahmin güveni %91"
        pfs={["PF-AI04", "PF-GET02"]}
        note="OTH-001 — Tahminleme, gözetimsiz/otomatik çalışma kipinde arka planda da yürütülür."
      />

      <Grid>
        <KPICard label="Tahmin Güveni" value="%91" color={C.ai} icon="cpu" />
        <KPICard label="Tıbbi Talep Piki" value="D+3" sub="%112" trend={14} color={C.danger} icon="heart" />
        <KPICard label="Kaynak Açığı Piki" value="D+4" sub="%55 hazırlık" color={C.warning} icon="package" />
        <KPICard label="Koridor Stres Piki" value="D+3" trend={18} color={C.critical} icon="git-branch" />
      </Grid>

      <Cols min={330}>
        <Card padded>
          <SectionHeader title="Tıbbi & Kaynak Talep Tahmini" subtitle="Yerel Optimizasyon modeli çıktısı" />
          <AreaChart
            data={forecastData}
            series={[
              { key: "med", label: "Tıbbi Talep %", color: C.danger },
              { key: "resource", label: "Kaynak Hazırlık %", color: C.warning },
            ]}
            height={205}
          />
        </Card>
        <Card padded>
          <SectionHeader title="Koridor Güvenilirlik Tahmini" subtitle="Yol riski çıktısı üzerinden" />
          <BarChart
            data={forecastData}
            series={{ key: "corridor", label: "Güvenilirlik %", color: C.gis }}
            height={205}
          />
        </Card>
      </Cols>

      <Card padded>
        <SectionHeader title="Senaryo Karşılaştırması" subtitle="En iyi / baz / en kötü durum projeksiyonları" />
        <Grid>
          {[
            { label: "En İyi Durum", displaced: "18.000", casualties: "280", hosp: "%65", water: "280K L", tents: "7.200", color: C.success },
            { label: "Baz Senaryo", displaced: "41.000", casualties: "780", hosp: "%112", water: "420K L", tents: "12.000", color: C.warning },
            { label: "En Kötü Durum", displaced: "68.000", casualties: "1.400", hosp: "%148", water: "650K L", tents: "20.000", color: C.danger },
          ].map((sc) => (
            <View key={sc.label} style={[s.scenario, { borderColor: alpha(sc.color, 0.35), flexBasis: 240, flexGrow: 1 }]}>
              <Row gap={7} style={{ marginBottom: 10 }}>
                <View style={[s.dot, { backgroundColor: sc.color }]} />
                <Txt size={12} weight="700" color={sc.color}>
                  {sc.label}
                </Txt>
              </Row>
              {[
                ["Yerinden Edilme", sc.displaced],
                ["Tahmini Kayıp", sc.casualties],
                ["YBÜ Doluluk", sc.hosp],
                ["Su Talebi", sc.water],
                ["Çadır Talebi", sc.tents],
              ].map(([k, v]) => (
                <Row key={k} style={{ justifyContent: "space-between", marginBottom: 5 }}>
                  <Txt size={10.5} color={C.muted}>
                    {k}
                  </Txt>
                  <Txt size={10.5} weight="600" color={C.txt} mono>
                    {v}
                  </Txt>
                </Row>
              ))}
            </View>
          ))}
        </Grid>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  cardHead: { padding: 13, borderBottomWidth: 1, borderBottomColor: C.border },
  modelIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardEl,
  },
  input: {
    backgroundColor: C.cardEl,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.txt,
    fontSize: 12.5,
    fontFamily: FONT,
  },
  denied: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: alpha(C.danger, 0.1),
    borderWidth: 1,
    borderColor: alpha(C.danger, 0.3),
    marginBottom: 12,
  },
  savedNote: {
    marginTop: 11,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: alpha(C.success, 0.1),
    borderWidth: 1,
    borderColor: alpha(C.success, 0.3),
    alignItems: "flex-start",
  },
  flowDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  flowLine: { width: 2, height: 16, marginLeft: 6, marginVertical: 2 },
  scenario: {
    padding: 13,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    backgroundColor: C.cardEl,
  },
  tick: { width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
});
