import React, { useEffect, useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, FONT, RADIUS, themed } from "../theme/tokens";
import { Screen, Cols } from "../components/Screen";
import {
  Txt, Row, Grid, Card, KPICard, SectionHeader, ScreenHeader, Bar, Btn,
  StatusBadge, Tag, Table, AdvisoryNotice, Divider, Notice, EmptyState,
  type Col,
} from "../components/ui";
import { AreaChart, BarChart } from "../components/charts";
import { dataSources, models, forecastData, type ModelDef } from "../data/mock";
import { useApp } from "../state/AppState";
import { api, errorMessage } from "../api/client";
import type { DatasetSnapshot, DistributionDataset, ModelResult, OsmUpdate, RoadDamage } from "../api/types";
import { can, DATASET_PERMISSION, MODEL_RESULT_PERMISSION, MODEL_RUN_PERMISSION } from "../auth/roles";

/* ═══════════════════════ VERİ TOPLAMA DURUMU ═══════════════════════ */

const DEPENDENCIES = [
  { text: "Afet izleme kuruluşlarının afet verisi", ok: true },
  { text: "Sağlık kurumlarının kapasite verisi", ok: true },
  { text: "İnsani yardım envanter bilgisi", ok: true },
  { text: "Geospatial veri, harita servisleri, altyapı bilgisi", ok: true },
  { text: "Acil müdahale kuruluşlarının operasyonel verisi", ok: true },
  { text: "İletişim ağları ve destek altyapısı", ok: true },
  { text: "Uluslararası yardım verisi (ulusal otoriteler üzerinden)", ok: true },
  { text: "AFAD yapısal maruziyet / kırılganlık verisi", ok: false },
  { text: "Güncel deprem verisi (Kandilli API)", ok: true },
];

const DATASET_TABS: { key: DistributionDataset; label: string }[] = [
  { key: "observatory", label: "Gözlemevi" },
  { key: "exposure", label: "Maruziyet" },
  { key: "fragility", label: "Kırılganlık" },
];

export function DataAcquisitionScreen() {
  const { role } = useApp();
  const cols: Col[] = [
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
  const datasetTabs = DATASET_TABS.filter((t) => can(role, DATASET_PERMISSION[t.key]));

  return (
    <Screen>
      <ScreenHeader
        title="Veri Toplama Durumu"
        subtitle="Dış sağlayıcı entegrasyonlarının canlı sağlık durumu, senkron sıklığı ve gecikmesi"
        note="Yüksek hacimli veri alımı, alt servisler doygun olduğunda olay akışında tamponlanarak veri kaybı olmadan sürdürülür."
      />

      <Grid>
        <KPICard label="Aktif Kaynak" value={`${online}/${dataSources.length}`} color={C.success} icon="database" />
        <KPICard label="Kesintisiz Alım" value="%99.4" sub="son 24 saat" color={C.gis} icon="activity" />
        <KPICard label="Ort. Gecikme" value="640 ms" sub="hedef ≤1 sn" color={C.info} icon="clock" />
        <KPICard label="Bayat Kaynak" value="1" sub="kırılganlık verisi" trend={1} color={C.warning} icon="alert-triangle" />
      </Grid>

      <Card>
        <Row style={s.cardHead}>
          <View style={{ flex: 1 }}>
            <Txt size={13} weight="600" color={C.txt}>
              Dış Sağlayıcı Arayüzleri
            </Txt>
            <Txt size={10.5} color={C.muted} style={{ marginTop: 2 }}>
              Tüm entegrasyonlar belgelenmiş API'ler üzerinden yürür
            </Txt>
          </View>
        </Row>
        <Table
          cols={cols}
          rows={dataSources}
          keyExtractor={(r) => r.id}
          renderCell={(row, key) => {
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

      {datasetTabs.length > 0 && <DatasetViewer tabs={datasetTabs} />}

      {can(role, "osm.update") && <OsmUpdateCard />}

      <Cols min={330}>
        <Card padded>
          <SectionHeader title="Bağımlılıklar" subtitle="Doğru çalışma için gereken dış kaynaklar" />
          {DEPENDENCIES.map((d) => (
            <Row key={d.text} gap={8} style={{ marginBottom: 8, alignItems: "flex-start" }}>
              <Feather
                name={d.ok ? "check-circle" : "alert-circle"}
                size={12}
                color={d.ok ? C.success : C.warning}
                style={{ marginTop: 2 }}
              />
              <Txt size={11} color={C.txt2} style={{ flex: 1 }}>
                {d.text}
              </Txt>
              <Txt size={9.5} weight="700" color={d.ok ? C.success : C.warning}>
                {d.ok ? "HAZIR" : "GECİKMELİ"}
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
            Kandilli gözlemevi verisi kullanıcı etkileşimi olmadan otomatik alınır; kaynak bir kullanıcı değil, veri
            beslemesi olarak ele alınır.
          </Txt>
        </Card>
      </Cols>
    </Screen>
  );
}

/** Dağıtım Sistemi'nde tutulan gözlemevi, maruziyet ve kırılganlık verisini getirir. */
function DatasetViewer({ tabs }: { tabs: { key: DistributionDataset; label: string }[] }) {
  const [tab, setTab] = useState<DistributionDataset>(tabs[0].key);
  const [data, setData] = useState<Partial<Record<DistributionDataset, DatasetSnapshot>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(ds: DistributionDataset) {
    setLoading(true);
    setError(null);
    try {
      const snap = await api.datasets.get(ds);
      setData((prev) => ({ ...prev, [ds]: snap }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!data[tab]) load(tab);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const snap = data[tab];
  const cols: Col[] = (snap?.columns ?? []).map((c, i) => ({ key: String(i), label: c, width: i === 0 ? 210 : 110 }));

  return (
    <Card>
      <Row style={s.cardHead} wrap>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Txt size={13} weight="600" color={C.txt}>
            Dağıtım Sistemi Veri Kümeleri
          </Txt>
          <Txt size={10.5} color={C.muted} style={{ marginTop: 2 }}>
            {snap ? `${snap.title} · ${snap.source} · ${snap.updatedAt}` : "Tehlike ve risk hesaplarında kullanılan güncel girdiler"}
          </Txt>
        </View>
        <Row gap={6}>
          {tabs.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[s.chip, tab === t.key && { backgroundColor: alpha(C.blue, 0.16), borderColor: C.blue }]}
            >
              <Txt size={10.5} color={tab === t.key ? C.blue : C.txt2} weight={tab === t.key ? "600" : "400"}>
                {t.label}
              </Txt>
            </Pressable>
          ))}
          <Btn label="Yenile" icon="refresh-cw" small variant="outline" disabled={loading} onPress={() => load(tab)} />
        </Row>
      </Row>
      {!!error && <Notice tone="error" text={error} style={{ margin: 12 }} />}
      {!snap && !error && <EmptyState icon="loader" text="Veri alınıyor…" />}
      {!!snap && (
        <Table
          cols={cols}
          rows={snap.rows}
          keyExtractor={(r: string[], i) => `${r[0]}-${i}`}
          renderCell={(row: string[], key) => (
            <Txt size={11} color={key === "0" ? C.txt : C.txt2} mono={key !== "0"}>
              {row[Number(key)]}
            </Txt>
          )}
        />
      )}
    </Card>
  );
}

/** Admin'in harita ve yol ağı (OSM) verisini güncellemesi. */
function OsmUpdateCard() {
  const { bumpAudit } = useApp();
  const [region, setRegion] = useState("Türkiye");
  const [update, setUpdate] = useState<OsmUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!update || update.status !== "running") return;
    const t = setInterval(async () => {
      try {
        const next = await api.osm.status(update.jobId);
        setUpdate(next);
        if (next.status === "done") bumpAudit();
      } catch (e) {
        setError(errorMessage(e));
      }
    }, 800);
    return () => clearInterval(t);
  }, [update, bumpAudit]);

  async function start() {
    setError(null);
    try {
      setUpdate(await api.osm.start(region.trim() || "Türkiye"));
      bumpAudit();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const running = update?.status === "running";

  return (
    <Card padded>
      <SectionHeader
        title="Harita / Yol Ağı Güncelleme"
        subtitle="OSM verisini indirip PostGIS deposuna yazar; güzergah ve yol riski hesapları güncel ağla çalışır"
      />
      <Row gap={8} wrap>
        <TextInput
          value={region}
          onChangeText={setRegion}
          editable={!running}
          placeholder="Bölge (ör. Türkiye, Hatay)"
          placeholderTextColor={C.muted}
          style={[s.input, { flex: 1, minWidth: 180 }]}
        />
        <Btn label={running ? "Güncelleniyor…" : "Güncellemeyi Başlat"} icon="map" disabled={running} onPress={start} />
      </Row>
      {running && <Notice tone="info" text={`${update!.region} yol ağı indiriliyor ve işleniyor (${update!.jobId})…`} style={{ marginTop: 10 }} />}
      {update?.status === "done" && (
        <Notice tone="success" text={`${update.region} yol ağı ${update.finishedAt} itibarıyla güncellendi.`} style={{ marginTop: 10 }} />
      )}
      {!!error && <Notice tone="error" text={error} style={{ marginTop: 10 }} />}
    </Card>
  );
}

/* ═══════════════════════ YZ MODEL ORKESTRASYONU ═══════════════════════ */

export function OrchestrationScreen() {
  return (
    <Screen>
      <ScreenHeader
        title="YZ Model Orkestrasyonu"
        subtitle="Dağıtım Sistemi ve Optimizasyon Servisi modellerinin tetiklenmesi ve sonuçlarının alınması"
        note="Tetikleme olay akışı üzerinden asenkron yayılır; sonuç alma çağrıları senkron yapılır."
      />

      <AdvisoryNotice />

      <Grid>
        {models.map((m) => (
          <ModelCard key={m.id} m={m} />
        ))}
      </Grid>
    </Screen>
  );
}

function ModelCard({ m }: { m: ModelDef }) {
  const { jobs, triggerModel, role, stale } = useApp();
  const [result, setResult] = useState<ModelResult | null>(null);
  const [busy, setBusy] = useState<"trigger" | "results" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const job = jobs[m.id];
  const running = job?.status === "queued" || job?.status === "running";
  const done = job?.status === "done";
  const isStale = stale[m.id] ?? m.status === "stale";
  const canRun = can(role, MODEL_RUN_PERMISSION[m.id]);
  const resultPermission = MODEL_RESULT_PERMISSION[m.id];
  const canGet = !!resultPermission && can(role, resultPermission);

  // Yeni çalıştırma bittiğinde eski sonuç gizlenir; kullanıcı güncelini yeniden alır.
  useEffect(() => {
    if (done) setResult(null);
  }, [done, job?.jobId]);

  async function act(kind: "trigger" | "results") {
    setBusy(kind);
    setError(null);
    try {
      if (kind === "trigger") await triggerModel(m.id);
      else setResult(await api.models.results(m.id));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const status = running ? "running" : done ? "ready" : isStale ? "stale" : m.status;

  return (
    <Card padded style={{ flexBasis: 330, flexGrow: 1 }}>
      <Row style={{ alignItems: "flex-start", justifyContent: "space-between" }} gap={8}>
        <Row gap={9} style={{ flex: 1 }}>
          <View style={s.modelIcon}>
            <Feather name="cpu" size={14} color={C.txt} />
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
        <StatusBadge status={status} />
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
            <Tag key={i} label={i} color={C.gis} />
          ))}
        </Row>
      </View>

      {!!m.results && (
        <View style={{ marginTop: 8 }}>
          <Txt size={9} weight="700" color={C.muted} upper>
            Sonuç Kümesi
          </Txt>
          <Row gap={4} wrap style={{ marginTop: 4 }}>
            <Tag label={m.results} color={C.blue} />
          </Row>
        </View>
      )}

      {isStale && !running && (
        <Notice tone="warning" text="Girdi verisi değişti; güncel sonuç için modeli yeniden çalıştırın." style={{ marginTop: 10 }} />
      )}

      <Divider style={{ marginVertical: 11 }} />

      <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <Txt size={10} color={C.muted}>
          Son çalıştırma
        </Txt>
        <Txt size={10} color={C.txt2} mono>
          {done ? `Bugün ${job!.finishedAt}` : m.lastRun} · {m.duration}
        </Txt>
      </Row>

      {running && (
        <View style={{ marginBottom: 9 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
            <Txt size={10} color={C.muted}>
              {job!.status === "queued" ? "Sırada…" : "Çalışıyor…"} · {job!.jobId}
            </Txt>
            <Txt size={10} color={C.txt} mono>
              %{job!.progress}
            </Txt>
          </Row>
          <Bar pct={job!.progress} color={C.txt} />
        </View>
      )}

      <Row gap={6}>
        <Btn
          label={running ? "Çalışıyor…" : "Modeli Çalıştır"}
          icon="play"
          small
          disabled={running || !canRun || busy !== null}
          onPress={() => act("trigger")}
          style={{ flex: 1 }}
        />
        <Btn
          label={busy === "results" ? "Alınıyor…" : "Sonuçları Al"}
          icon="download"
          small
          variant="outline"
          color={C.blue}
          disabled={!canGet || running || busy !== null}
          onPress={() => act("results")}
          style={{ flex: 1 }}
        />
      </Row>

      {!canRun && (
        <Txt size={9.5} color={C.warning} style={{ marginTop: 7 }}>
          Bu model yalnızca {m.actor} tarafından çalıştırılabilir.
        </Txt>
      )}
      {!!error && <Notice tone="error" text={error} style={{ marginTop: 8 }} />}

      {!!result && (
        <View style={s.result}>
          <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <Txt size={11} weight="700" color={C.txt}>
              {result.title}
            </Txt>
            <Txt size={9.5} color={C.muted} mono>
              {result.generatedAt}
            </Txt>
          </Row>
          {result.summary.map((r) => (
            <Row key={r.label} style={{ justifyContent: "space-between", marginBottom: 4 }} gap={8}>
              <Txt size={10.5} color={C.muted} style={{ flex: 1 }}>
                {r.label}
              </Txt>
              <Txt
                size={10.5}
                weight="700"
                mono
                color={r.tone === "danger" ? C.danger : r.tone === "warning" ? C.warning : r.tone === "success" ? C.success : C.txt}
              >
                {r.value}
              </Txt>
            </Row>
          ))}
          <Txt size={9} color={C.muted} style={{ marginTop: 6 }}>
            Girdiler: {result.inputs.join(" · ")}
            {result.jobId ? ` · İş: ${result.jobId}` : ""}
          </Txt>
        </View>
      )}
    </Card>
  );
}

/* ═══════════════════════ SAHA VERİ GİRİŞİ ═══════════════════════ */

export function FieldEntryScreen() {
  const { roadDamage, addRoadDamage, role } = useApp();
  const [segment, setSegment] = useState("");
  const [type, setType] = useState("Enkaz / moloz");
  const [severity, setSeverity] = useState<RoadDamage["severity"]>("restricted");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canEnter = can(role, "roadDamage.submit");

  async function submit() {
    if (!segment.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const entry = await addRoadDamage({ segment: segment.trim(), type, severity, note: note.trim() });
      setSegment("");
      setNote("");
      setSaved(entry.id);
      setTimeout(() => setSaved(null), 3500);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const cols: Col[] = [
    { key: "id", label: "Kayıt", width: 85 },
    { key: "segment", label: "Yol Kesimi", width: 235 },
    { key: "type", label: "Hasar Türü", width: 130 },
    { key: "severity", label: "Erişilebilirlik", width: 120 },
    { key: "entered", label: "Giren", width: 115 },
    { key: "note", label: "Not", width: 240 },
    { key: "consumedBy", label: "Kullanan", width: 130 },
  ];

  return (
    <Screen>
      <ScreenHeader
        title="Saha Veri Girişi — Yol Hasarı & Erişim Kısıtı"
        subtitle="Afet sonrası yol hasarları, kapalı güzergahlar ve erişilebilirlik kısıtlarının sisteme girilmesi"
        note="Girilen veri Yol Riski modeli, güzergah optimizasyonu ve lojistik planlama tarafından kullanılır."
      />

      <Cols min={330}>
        <Card padded>
          <SectionHeader title="Yeni Hasar Kaydı" subtitle="Koordinasyon Gateway üzerinden iletilir" />

          {!canEnter && (
            <View style={s.denied}>
              <Feather name="lock" size={13} color={C.txt2} />
              <Txt size={11} color={C.txt2} style={{ flex: 1 }}>
                Yol hasarı girişi yalnızca AFAD rolüne tanımlıdır. Kayıtları görüntüleyebilir, ancak yeni giriş
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
            {([
              { k: "passable", l: "Geçilebilir", c: C.success },
              { k: "restricted", l: "Kısıtlı", c: C.warning },
              { k: "impassable", l: "Geçilemez", c: C.critical },
            ] as const).map((o) => (
              <Pressable
                key={o.k}
                disabled={!canEnter}
                onPress={() => setSeverity(o.k)}
                style={[s.chip, severity === o.k && { backgroundColor: alpha(o.c, 0.16), borderColor: o.c }]}
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
            label={busy ? "Gönderiliyor…" : "Kaydı Gönder"}
            icon="upload"
            disabled={!canEnter || !segment.trim() || busy}
            onPress={submit}
            style={{ marginTop: 14 }}
          />

          {!!saved && (
            <Notice
              tone="success"
              text={`${saved} kaydı alındı ve denetim kaydına yazıldı. Yol Riski modeli yeniden çalıştırılmak üzere işaretlendi.`}
              style={{ marginTop: 11 }}
            />
          )}
          {!!error && <Notice tone="error" text={error} style={{ marginTop: 11 }} />}
        </Card>

        <Card padded>
          <SectionHeader title="Veri Akışı" subtitle="Saha girdisinin sistemdeki yolu" />
          {[
            { label: "AFAD saha girişi", desc: "Koordinasyon Gateway", color: C.warning },
            { label: "Yol Riski modeli", desc: "Bina hasarı + OSM + saha verisi", color: C.critical },
            { label: "Yol riski sonuçları", desc: "Dağıtım Sistemi'nden alınır", color: C.blue },
            { label: "Güzergah önerisi", desc: "112 ambulanslarına iletilir", color: C.info },
            { label: "Yerel optimizasyon", desc: "Kaynak hareketleri yeniden planlanır", color: C.ai },
          ].map((step, i, arr) => (
            <View key={step.label}>
              <Row gap={10}>
                <View style={[s.flowDot, { borderColor: step.color, backgroundColor: alpha(step.color, 0.2) }]} />
                <View style={{ flex: 1 }}>
                  <Txt size={11.5} weight="600" color={C.txt}>
                    {step.label}
                  </Txt>
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
        </Row>
        <Table
          cols={cols}
          rows={roadDamage}
          keyExtractor={(r) => r.id}
          renderCell={(row, key) => {
            if (key === "id") return <Txt size={11} weight="700" color={C.blue} mono>{row.id}</Txt>;
            if (key === "severity") return <StatusBadge status={row.severity} />;
            if (key === "consumedBy") return <Tag label={row.consumedBy} color={C.critical} />;
            if (key === "segment") return <Txt size={11} color={C.txt} mono>{row.segment}</Txt>;
            return <Txt size={11} color={C.txt2}>{row[key]}</Txt>;
          }}
        />
      </Card>
    </Screen>
  );
}

/* ═══════════════════════ YZ TAHMİNLEME ═══════════════════════ */

export function ForecastingScreen() {
  return (
    <Screen>
      <ScreenHeader
        title="YZ Tahminleme & Talep Öngörüsü"
        subtitle="7 günlük çok değişkenli senaryo analizi · tahmin güveni %91"
        note="Tahminleme, gözetimsiz/otomatik çalışma kipinde arka planda da yürütülür."
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

const s = themed(() => StyleSheet.create({
  cardHead: { padding: 13, borderBottomWidth: 1, borderBottomColor: C.border, gap: 8 },
  modelIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardEl,
  },
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
    backgroundColor: C.cardEl,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  result: {
    marginTop: 11,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: C.cardEl,
    borderWidth: 1,
    borderColor: alpha(C.blue, 0.3),
  },
  flowDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  flowLine: { width: 2, height: 16, marginLeft: 6, marginVertical: 2 },
  scenario: {
    padding: 13,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    backgroundColor: C.cardEl,
  },
}));
