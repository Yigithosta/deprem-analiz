import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, FONT, RADIUS, themed } from "../theme/tokens";
import { Screen, Cols } from "../components/Screen";
import {
  Txt, Row, Grid, Card, KPICard, SectionHeader, ScreenHeader, Btn, Toggle,
  StatusBadge, Tag, Table, Divider, EmptyState, Notice, type Col,
} from "../components/ui";
import { hospitalRows, internationalFlows, platformUsers, resourceItems } from "../data/mock";
import { can, PERMISSION_LABEL, ROLES, ROLE_BY_ID } from "../auth/roles";
import { useApp } from "../state/AppState";
import { api, errorMessage } from "../api/client";
import { API_BASE_URL, API_MODE } from "../api/config";
import { useQuery } from "../api/useQuery";
import { useTheme } from "../theme/ThemeProvider";
import type { VaultEntry } from "../api/types";
import { saveTextFile, toCsv } from "../utils/download";

/* ═══════════════════════ ULUSLARARASI YARDIM ═══════════════════════ */

export function InternationalScreen() {
  const cols: Col[] = [
    { key: "country", label: "Ülke / Kaynak", width: 175 },
    { key: "type", label: "Tür", width: 90 },
    { key: "resource", label: "Kaynak", width: 285 },
    { key: "eta", label: "ETA", width: 120 },
    { key: "status", label: "Durum", width: 105 },
  ];

  return (
    <Screen>
      <ScreenHeader
        title="Uluslararası Yardım Koordinasyonu"
        subtitle="Akdeniz havzası kaynak koridorları ve sınır ötesi kaynak akışı"
        note="Uluslararası ve sınır ötesi veri, ayrı bir dış kurum olarak değil, ulusal otoriteler (ör. AFAD) üzerinden sisteme girer."
      />

      <Grid>
        <KPICard label="Gelen Yardım" value="5 Ülke" color={C.gis} icon="globe" />
        <KPICard label="Aktif Koridor" value="4/5" color={C.success} icon="git-branch" />
        <KPICard label="Toplam Değer" value="€2.4M+" color={C.ai} icon="trending-up" />
        <KPICard label="ETA Ortalaması" value="6.2 saat" color={C.info} icon="clock" />
      </Grid>

      <Card>
        <Row style={s.cardHead}>
          <Txt size={13} weight="600" color={C.txt} style={{ flex: 1 }}>
            Uluslararası Kaynak Akışı
          </Txt>
        </Row>
        <Table
          cols={cols}
          rows={internationalFlows}
          keyExtractor={(r) => r.country}
          renderCell={(row, key) => {
            if (key === "country")
              return (
                <Txt size={11.5} weight="500" color={C.txt}>
                  {row.flag} {row.country}
                </Txt>
              );
            if (key === "type")
              return (
                <View style={[s.typeChip, { backgroundColor: alpha(row.type === "Gelen" ? C.success : C.blue, 0.16) }]}>
                  <Txt size={9.5} weight="700" color={row.type === "Gelen" ? C.success : C.blue}>
                    {row.type.toUpperCase()}
                  </Txt>
                </View>
              );
            if (key === "status") return <StatusBadge status={row.status} />;
            if (key === "eta") return <Txt size={11} color={C.txt2} mono>{row.eta}</Txt>;
            return <Txt size={11} color={C.txt2}>{row.resource}</Txt>;
          }}
        />
      </Card>

      <Card padded>
        <SectionHeader
          title="Çok-Etmenli Optimizasyon Durumu"
          subtitle="Sınır ötesi kaynak paylaşımını koordine eden model · YZ Model Orkestrasyonu ekranından çalıştırılır"
        />
        {[
          { label: "Koordine edilen ülke", val: "7", col: C.gis },
          { label: "Aktif yardım koridoru", val: "4", col: C.success },
          { label: "Bekleyen tahsis kararı", val: "2", col: C.warning },
          { label: "Son çalıştırma", val: "Dün 22:10", col: C.txt2 },
          { label: "Çalıştırma yetkisi", val: "Sistem Yöneticisi", col: C.ai },
        ].map((r) => (
          <Row key={r.label} style={{ justifyContent: "space-between", marginBottom: 7 }}>
            <Txt size={11} color={C.muted}>
              {r.label}
            </Txt>
            <Txt size={11} weight="600" color={r.col} mono>
              {r.val}
            </Txt>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}

/* ═══════════════════════ BİLDİRİMLER ═══════════════════════ */

export function NotificationsScreen() {
  const { notifications, markRead, markAllRead, unreadCount } = useApp();

  return (
    <Screen>
      <ScreenHeader
        title="Bildirimler"
        subtitle="Bildirim Servisi üzerinden iletilen operasyonel uyarı ve durum değişiklikleri"
        note="Acil bildirimler olay akış çekirdeği üzerinden uçtan uca en geç 5 sn içinde iletilir."
      />

      <Row style={{ justifyContent: "space-between" }}>
        <Txt size={12} color={C.muted}>
          {unreadCount} okunmamış · toplam {notifications.length}
        </Txt>
        <Btn label="Tümünü Okundu İşaretle" small variant="outline" icon="check" onPress={markAllRead} />
      </Row>

      {notifications.length === 0 && <EmptyState icon="bell-off" text="Bildirim yok." />}

      {notifications.map((n) => {
        const col =
          n.sev === "critical" ? C.danger : n.sev === "high" ? C.warning : n.sev === "medium" ? C.info : C.muted;
        return (
          <Pressable key={n.id} onPress={() => markRead(n.id)}>
            <Card padded style={[!n.read && { borderColor: alpha(col, 0.45) }]}>
              <Row gap={10} style={{ alignItems: "flex-start" }}>
                <View style={[s.notifIcon, { backgroundColor: alpha(col, 0.15) }]}>
                  <Feather
                    name={n.sev === "critical" ? "alert-octagon" : n.sev === "high" ? "alert-triangle" : "info"}
                    size={14}
                    color={col}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Row gap={7} wrap>
                    <Txt size={12} weight={n.read ? "500" : "700"} color={C.txt} style={{ flexShrink: 1 }}>
                      {n.title}
                    </Txt>
                    <StatusBadge status={n.sev} />
                    <Tag label={n.source} />
                    {!n.read && <View style={[s.unreadDot, { backgroundColor: col }]} />}
                  </Row>
                  <Txt size={11} color={C.muted} style={{ marginTop: 4, lineHeight: 16 }}>
                    {n.body}
                  </Txt>
                </View>
                <Txt size={10} color={C.muted} mono>
                  {n.time}
                </Txt>
              </Row>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

/* ═══════════════════════ RAPORLAMA ═══════════════════════ */

type GeneratedReport = { name: string; records: number; time: string };

export function ReportingScreen() {
  const { recommendations, role } = useApp();
  const [generated, setGenerated] = useState<GeneratedReport[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const time = () => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  const templates: { name: string; file: string; available: boolean; build: () => Promise<[string[], (string | number)[][]]> }[] = [
    {
      name: "Günlük Operasyon Özeti",
      file: "operasyon-ozeti",
      available: true,
      build: async () => [
        ["Gösterge", "Değer"],
        [
          ["Hastane yük endeksi", "%91"],
          ["Kaynak hazırlık", "%73"],
          ["Hazır güvenli düğüm", "12/18"],
          ["Koridor sağlığı", "%68"],
          ["Karar bekleyen YZ önerisi", recommendations.filter((r) => r.status === "pending").length],
        ],
      ],
    },
    {
      name: "Tıbbi Kapasite Raporu",
      file: "tibbi-kapasite",
      available: true,
      build: async () => [
        ["Hastane", "Kapasite", "YBÜ", "Mevcut yük %", "Tahmini yük %", "Risk"],
        hospitalRows.map((h) => [h.name, h.cap, h.icu, h.load, h.forecast, h.risk]),
      ],
    },
    {
      name: "Kaynak Hazırlık Raporu",
      file: "kaynak-hazirlik",
      available: true,
      build: async () => [
        ["Kalem", "Stok", "Talep", "Birim", "Karşılama %"],
        resourceItems.map((r) => [r.name, r.stock, r.demand, r.unit, r.pct]),
      ],
    },
    {
      name: "YZ Karar Günlüğü",
      file: "yz-karar-gunlugu",
      available: true,
      build: async () => [
        ["Öneri", "Önem", "Güven %", "Durum", "Karar veren", "Saat", "Gerekçe"],
        recommendations.map((r) => [
          r.title, r.sev, r.conf, r.status, r.decision?.by ?? "", r.decision?.at ?? "", r.decision?.reason ?? "",
        ]),
      ],
    },
    {
      name: "Tehlike & Risk Sonuç Raporu",
      file: "tehlike-risk-sonuclari",
      available: can(role, "results.hazard.view") && can(role, "results.risk.view"),
      build: async () => {
        const [hazard, risk] = await Promise.all([api.models.results("hazard"), api.models.results("risk")]);
        return [
          ["Model", "Gösterge", "Değer", "Üretim zamanı"],
          [
            ...hazard.summary.map((r) => [hazard.title, r.label, r.value, hazard.generatedAt]),
            ...risk.summary.map((r) => [risk.title, r.label, r.value, risk.generatedAt]),
          ],
        ];
      },
    },
  ];

  async function generate(t: (typeof templates)[number]) {
    setBusy(t.name);
    setError(null);
    try {
      const [header, rows] = await t.build();
      await saveTextFile(`medaigency-${t.file}-${today}.csv`, toCsv(header, rows), "text/csv");
      setGenerated((prev) => [{ name: t.name, records: rows.length, time: time() }, ...prev]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Raporlama & Analitik" subtitle="Operasyonel özetler ve dışa aktarma" />

      <Grid>
        <KPICard label="Rapor Şablonu" value={String(templates.length)} color={C.blue} icon="file-text" />
        <KPICard label="Bu Oturumda Üretilen" value={String(generated.length)} color={C.success} icon="download" />
        <KPICard label="Karar Bekleyen Öneri" value={String(recommendations.filter((r) => r.status === "pending").length)} color={C.ai} icon="cpu" />
        <KPICard label="Veri Kalitesi" value="%97.4" color={C.gis} icon="check-circle" />
      </Grid>

      {!!error && <Notice tone="error" text={error} />}

      <Cols min={320}>
        <Card padded>
          <SectionHeader title="Rapor Şablonları" subtitle="CSV olarak indirilir" />
          {templates.map((t) => (
            <Row key={t.name} style={s.listRow}>
              <Txt size={11.5} weight="500" color={t.available ? C.txt : C.muted} style={{ flex: 1 }}>
                {t.name}
              </Txt>
              <Btn
                label={busy === t.name ? "Hazırlanıyor…" : "CSV"}
                small
                variant="outline"
                icon="download"
                disabled={!t.available || busy !== null}
                onPress={() => generate(t)}
              />
            </Row>
          ))}
        </Card>

        <Card padded>
          <SectionHeader title="Bu Oturumda Üretilen Raporlar" />
          {generated.length === 0 && <EmptyState icon="file" text="Henüz rapor üretilmedi." />}
          {generated.map((r, i) => (
            <Row key={`${r.name}-${i}`} style={s.listRow}>
              <View style={{ flex: 1 }}>
                <Txt size={11.5} weight="500" color={C.txt}>
                  {r.name}
                </Txt>
                <Txt size={10} color={C.muted} mono style={{ marginTop: 2 }}>
                  {r.records} satır · {r.time}
                </Txt>
              </View>
              <Feather name="check-circle" size={13} color={C.success} />
            </Row>
          ))}
        </Card>
      </Cols>
    </Screen>
  );
}

/* ═══════════════════════ DENETİM & ETİK ═══════════════════════ */

export function AuditScreen() {
  const { auditVersion, bumpAudit } = useApp();
  const { data: audit = [], error, loading } = useQuery(() => api.audit.list(), [auditVersion]);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function exportLogs() {
    setExporting(true);
    setExportMsg(null);
    try {
      const file = await api.audit.export();
      await saveTextFile(file.filename, file.content, file.mime);
      setExportMsg({ tone: "success", text: `${file.records} kayıt ${file.filename} dosyasına aktarıldı.` });
      bumpAudit();
    } catch (e) {
      setExportMsg({ tone: "error", text: errorMessage(e) });
    } finally {
      setExporting(false);
    }
  }

  const cols: Col[] = [
    { key: "time", label: "Saat", width: 85 },
    { key: "user", label: "Kullanıcı", width: 150 },
    { key: "role", label: "Rol", width: 90 },
    { key: "action", label: "Aksiyon", width: 220 },
    { key: "detail", label: "Detay", width: 320 },
    { key: "module", label: "Modül", width: 120 },
    { key: "type", label: "Tür", width: 110 },
  ];

  return (
    <Screen>
      <ScreenHeader
        title="Denetim, Etik & Şeffaflık"
        subtitle="YZ açıklanabilirliği, izlenebilirlik ve insan gözetimi"
        note="Kimlik doğrulama olayları, veri değişiklikleri ve operasyonel kararlar sunucu tarafında, kurcalamaya karşı korumalı biçimde kaydedilir."
      />

      <Grid>
        {[
          { label: "Rol Tabanlı Erişim", icon: "shield" as const },
          { label: "ÇFA Etkin", icon: "smartphone" as const },
          { label: "Denetim Kaydı", icon: "book-open" as const },
          { label: "Şifreleme (TLS)", icon: "lock" as const },
          { label: "Gizlilik Kontrolleri", icon: "eye" as const },
        ].map((c) => (
          <View key={c.label} style={[s.control, { flexBasis: 150, flexGrow: 1 }]}>
            <View style={s.controlIcon}>
              <Feather name={c.icon} size={14} color={C.txt} />
            </View>
            <Txt size={11} weight="600" color={C.txt} style={{ marginTop: 8, textAlign: "center" }}>
              {c.label}
            </Txt>
            <StatusBadge status="online" label="Aktif" />
          </View>
        ))}
      </Grid>

      <Cols min={330}>
        <Card padded>
          <SectionHeader title="YZ Açıklanabilirliği" subtitle="Her öneri kaynağına kadar izlenebilir" />
          {[
            { p: "Güven Skoru", d: "Her öneride %0–100 güven aralığı zorunlu" },
            { p: "Kanıt Kaynakları", d: "Kullanılan veri kaynakları tam listeleniyor" },
            { p: "Girdi Verileri", d: "Her öneri, onu üreten veri kümelerine kadar izlenebilir" },
            { p: "YZ Gerekçesi", d: "İnsan-okunabilir çıkarım zinciri sunuluyor" },
            { p: "Model Versiyonu", d: "Her çıktıda model sürümü belirtiliyor" },
            { p: "Karar Kaydı", d: "Onay/ret kararı veren kişi, zamanı ve gerekçesi loglanır" },
          ].map(({ p, d }) => (
            <Row key={p} gap={9} style={s.ethicRow}>
              <Feather name="check-circle" size={13} color={C.success} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Txt size={11.5} weight="600" color={C.txt}>
                  {p}
                </Txt>
                <Txt size={10.5} color={C.muted} style={{ marginTop: 2 }}>
                  {d}
                </Txt>
              </View>
            </Row>
          ))}
        </Card>

        <Card padded>
          <SectionHeader title="İnsan Gözetiminde Karar Mekanizması" subtitle="YZ karar destekler, karar vermez" />
          {[
            { r: "Onay Zorunluluğu", d: "Hiçbir YZ önerisi karar verici onayı olmadan uygulamaya geçemez", critical: true },
            { r: "Otomatik Uygulama Yasağı", d: "Otomatik uygulama ayarı kalıcı olarak kapalıdır", critical: true },
            { r: "Gerekçeli Ret", d: "Reddedilen öneriler gerekçesiyle birlikte kaydedilir", critical: false },
            { r: "Yeniden Hesaplama", d: "Karar verici öneriyi güncel veriyle yeniden hesaplatabilir", critical: false },
            { r: "Nihai Sorumluluk", d: "Operasyonel sorumluluk yetkili kuruluş ve personelde kalır", critical: false },
            { r: "Gizlilik Koruması", d: "Mağdur ve hasta verileri anonimleştirilerek işlenir", critical: false },
          ].map(({ r, d, critical }) => (
            <View key={r} style={[s.ethicRow, s.oversight, { borderLeftColor: critical ? C.warning : C.border }]}>
              <Txt size={11.5} weight="600" color={C.txt}>
                {r}
              </Txt>
              <Txt size={10.5} color={C.muted} style={{ marginTop: 2 }}>
                {d}
              </Txt>
            </View>
          ))}
        </Card>
      </Cols>

      <Card>
        <Row style={s.cardHead}>
          <View style={{ flex: 1 }}>
            <Txt size={13} weight="600" color={C.txt}>
              Denetim Günlüğü
            </Txt>
            <Txt size={10.5} color={C.muted} style={{ marginTop: 2 }}>
              {loading ? "Yükleniyor…" : `${audit.length} kayıt · sunucudan canlı alınır`}
            </Txt>
          </View>
          <Btn
            label={exporting ? "Aktarılıyor…" : "Dışa Aktar (CSV)"}
            small
            variant="outline"
            icon="download"
            disabled={exporting}
            onPress={exportLogs}
          />
        </Row>
        {!!exportMsg && <Notice tone={exportMsg.tone} text={exportMsg.text} style={{ margin: 12, marginBottom: 0 }} />}
        {!!error && <Notice tone="error" text={error} style={{ margin: 12 }} />}
        <Table
          cols={cols}
          rows={audit}
          keyExtractor={(r, i) => `${r.time}-${i}`}
          renderCell={(row, key) => {
            if (key === "type") return <StatusBadge status={row.type} />;
            if (key === "module") return <Tag label={row.module} />;
            if (key === "time") return <Txt size={11} color={C.muted} mono>{row.time}</Txt>;
            if (key === "user") return <Txt size={11} weight="500" color={C.txt}>{row.user}</Txt>;
            if (key === "role")
              return (
                <Txt size={10.5} color={ROLE_BY_ID[row.role as keyof typeof ROLE_BY_ID]?.color ?? C.muted} mono weight="600">
                  {row.role}
                </Txt>
              );
            return <Txt size={11} color={key === "detail" ? C.muted : C.txt2} numberOfLines={2}>{row[key]}</Txt>;
          }}
        />
      </Card>
    </Screen>
  );
}

/* ═══════════════════════ KULLANICI YÖNETİMİ ═══════════════════════ */

export function UsersScreen() {
  const cols: Col[] = [
    { key: "name", label: "Kullanıcı", width: 190 },
    { key: "email", label: "E-posta", width: 220 },
    { key: "role", label: "Rol", width: 155 },
    { key: "title", label: "Görev", width: 155 },
    { key: "mfa", label: "ÇFA", width: 105 },
    { key: "last", label: "Son Giriş", width: 110 },
    { key: "status", label: "Durum", width: 105 },
  ];

  return (
    <Screen>
      <ScreenHeader
        title="Kullanıcı & Erişim Yönetimi"
        subtitle="Rol tabanlı erişim kontrolü, kurum eşleşmesi ve ÇFA yönetimi"
        note="Her role yalnızca sorumluluğu kadar erişim verilir (en az yetki ilkesi)."
      />

      <Grid>
        <KPICard label="Toplam Kullanıcı" value="42" color={C.blue} icon="users" />
        <KPICard label="Aktif Oturum" value="18" color={C.success} icon="activity" />
        <KPICard label="ÇFA Etkin" value="39/42" color={C.gis} icon="shield" />
        <KPICard label="Güvenlik Uyarısı" value="2" trend={1} color={C.danger} icon="alert-triangle" />
      </Grid>

      <Card padded>
        <SectionHeader title="Rol → Yetki Matrisi" subtitle="Her kurumun sistemde yapabildiği işlemler" />
        {ROLES.map((r) => (
          <View key={r.id} style={s.roleRow}>
            <Row gap={9} style={{ marginBottom: 7 }}>
              <View style={[s.roleDot, { backgroundColor: r.color }]} />
              <Txt size={12} weight="700" color={C.txt} style={{ flex: 1 }}>
                {r.name}
              </Txt>
              <Txt size={10} color={C.muted} mono>
                {r.gateway}
              </Txt>
              <View style={[s.countChip, { backgroundColor: alpha(r.color, 0.15) }]}>
                <Txt size={9.5} weight="700" color={r.color} mono>
                  {r.permissions.length} yetki
                </Txt>
              </View>
            </Row>
            <Row gap={4} wrap>
              {r.permissions.map((p) => (
                <Tag key={p} label={PERMISSION_LABEL[p]} color={r.color} />
              ))}
            </Row>
          </View>
        ))}
      </Card>

      <Card>
        <Row style={s.cardHead}>
          <Txt size={13} weight="600" color={C.txt} style={{ flex: 1 }}>
            Kullanıcı Listesi
          </Txt>
        </Row>
        <Table
          cols={cols}
          rows={platformUsers}
          keyExtractor={(r) => r.email}
          renderCell={(row, key) => {
            if (key === "name") {
              const role = ROLE_BY_ID[row.role as keyof typeof ROLE_BY_ID];
              return (
                <Row gap={8}>
                  <View style={[s.avatar, { backgroundColor: role?.color ?? C.blue }]}>
                    <Txt size={9} weight="700" color={C.onPrimary}>
                      {row.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2)}
                    </Txt>
                  </View>
                  <Txt size={11.5} weight="500" color={C.txt}>
                    {row.name}
                  </Txt>
                </Row>
              );
            }
            if (key === "role") {
              const role = ROLE_BY_ID[row.role as keyof typeof ROLE_BY_ID];
              return (
                <View style={[s.typeChip, { backgroundColor: alpha(role?.color ?? C.blue, 0.15) }]}>
                  <Txt size={9.5} weight="700" color={role?.color ?? C.blue}>
                    {role?.name ?? row.role}
                  </Txt>
                </View>
              );
            }
            if (key === "mfa")
              return (
                <Row gap={5}>
                  <Feather name={row.mfa ? "shield" : "alert-triangle"} size={11} color={row.mfa ? C.success : C.danger} />
                  <Txt size={10.5} weight="600" color={row.mfa ? C.success : C.danger}>
                    {row.mfa ? "Etkin" : "Devre Dışı"}
                  </Txt>
                </Row>
              );
            if (key === "status") return <StatusBadge status={row.status} />;
            if (key === "email" || key === "last") return <Txt size={10.5} color={C.muted} mono>{row[key]}</Txt>;
            return <Txt size={11} color={C.txt2}>{row[key]}</Txt>;
          }}
        />
      </Card>
    </Screen>
  );
}

/* ═══════════════════════ VAULT & SIR YÖNETİMİ ═══════════════════════ */

export function VaultScreen() {
  const { bumpAudit } = useApp();
  const { data: entries = [], error, reload } = useQuery(() => api.vault.list(), []);
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function act(key: string, fn: () => Promise<VaultEntry>, done: string) {
    setBusy(key);
    setMsg(null);
    try {
      await fn();
      setMsg({ tone: "success", text: done });
      setEditing(null);
      setValue("");
      bumpAudit();
      reload();
    } catch (e) {
      setMsg({ tone: "error", text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  }

  const overdue = entries.filter((e) => e.status === "offline").length;
  const soon = entries.filter((e) => e.status === "degraded").length;

  const cols: Col[] = [
    { key: "key", label: "Anahtar Yolu", width: 250 },
    { key: "type", label: "Tür", width: 140 },
    { key: "scope", label: "Kapsam", width: 180 },
    { key: "rotated", label: "Son Değişim", width: 120 },
    { key: "ttl", label: "TTL", width: 80 },
    { key: "status", label: "Durum", width: 105 },
    { key: "action", label: "İşlem", width: 200 },
  ];

  return (
    <Screen>
      <ScreenHeader
        title="Vault & Sır Yönetimi"
        subtitle="Kimlik bilgileri, şifreleme anahtarları ve hassas yapılandırma değerleri"
        note="Tüm sırlar Vault Servisi ile yönetilir ve düz metin olarak saklanmaz. Değerler burada asla görüntülenmez."
      />

      <View style={s.vaultWarn}>
        <Feather name="shield" size={14} color={C.txt} />
        <Txt size={11} color={C.txt2} style={{ flex: 1, lineHeight: 16 }}>
          Sır değerleri arayüzde hiçbir koşulda gösterilmez; yalnızca meta veri (yol, tür, kapsam, rotasyon durumu)
          listelenir. Yeni değer yalnızca sunucuya iletilir ve her işlem denetim kaydına yazılır.
        </Txt>
      </View>

      <Grid>
        <KPICard label="Yönetilen Sır" value={String(entries.length)} color={C.blue} icon="key" />
        <KPICard label="Rotasyon Gecikmiş" value={String(overdue)} trend={overdue || undefined} color={C.danger} icon="alert-triangle" />
        <KPICard label="Yaklaşan Rotasyon" value={String(soon)} color={C.warning} icon="clock" />
        <KPICard label="Şifreleme" value="AES-256" sub="bekleyen veri" color={C.success} icon="lock" />
      </Grid>

      {!!msg && <Notice tone={msg.tone} text={msg.text} />}
      {!!error && <Notice tone="error" text={error} />}

      {!!editing && (
        <Card padded>
          <SectionHeader title="Değer Güncelle" subtitle={editing} />
          <TextInput
            value={value}
            onChangeText={setValue}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Yeni değer (en az 8 karakter)"
            placeholderTextColor={C.muted}
            style={s.input}
          />
          <Row gap={6} style={{ marginTop: 10 }}>
            <Btn
              label={busy === editing ? "Kaydediliyor…" : "Kaydet"}
              icon="save"
              small
              disabled={value.length < 8 || busy !== null}
              onPress={() => act(editing, () => api.vault.update(editing, value), `${editing} yeni değerle güncellendi.`)}
              style={{ flex: 1 }}
            />
            <Btn label="Vazgeç" small variant="ghost" color={C.muted} onPress={() => { setEditing(null); setValue(""); }} style={{ flex: 1 }} />
          </Row>
        </Card>
      )}

      <Card>
        <Row style={s.cardHead}>
          <Txt size={13} weight="600" color={C.txt} style={{ flex: 1 }}>
            Vault Girdileri
          </Txt>
        </Row>
        <Table
          cols={cols}
          rows={entries}
          keyExtractor={(r) => r.key}
          renderCell={(row: VaultEntry, key) => {
            if (key === "key") return <Txt size={11} color={C.txt} mono>{row.key}</Txt>;
            if (key === "status") return <StatusBadge status={row.status} />;
            if (key === "rotated")
              return (
                <Txt size={11} color={row.rotated === "Az önce" ? C.success : C.txt2} mono>
                  {row.rotated}
                </Txt>
              );
            if (key === "action")
              return (
                <Row gap={5}>
                  <Btn
                    label="Rotasyon"
                    small
                    variant="outline"
                    disabled={busy !== null}
                    onPress={() => act(row.key, () => api.vault.rotate(row.key), `${row.key} rotasyona alındı.`)}
                  />
                  <Btn label="Değiştir" small variant="outline" color={C.ai} disabled={busy !== null} onPress={() => { setEditing(row.key); setValue(""); setMsg(null); }} />
                </Row>
              );
            return <Txt size={11} color={C.txt2} mono={key === "ttl"}>{(row as any)[key]}</Txt>;
          }}
        />
      </Card>
    </Screen>
  );
}

/* ═══════════════════════ SİSTEM AYARLARI ═══════════════════════ */

export function SettingsScreen() {
  const { role } = useApp();
  const { mode, setMode } = useTheme();
  const [notif, setNotif] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [aiAuto, setAiAuto] = useState(false);
  const [lang, setLang] = useState("Türkçe");

  return (
    <Screen>
      <ScreenHeader title="Ayarlar" subtitle="Görünüm, bildirim ve platform tercihleri" />

      <Card padded>
        <SectionHeader title="Görünüm" subtitle="Seçiminiz bu cihazda saklanır" />
        <Row gap={10} wrap>
          {([
            { k: "dark", label: "Koyu tema", desc: "Siyah zemin, beyaz metin · varsayılan", icon: "moon" },
            { k: "light", label: "Açık tema", desc: "Beyaz zemin, siyah metin", icon: "sun" },
          ] as const).map((o) => {
            const sel = mode === o.k;
            return (
              <Pressable
                key={o.k}
                onPress={() => setMode(o.k)}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                style={[s.themeOption, sel && { borderColor: C.txt }]}
              >
                <View style={[s.themePreview, { backgroundColor: o.k === "dark" ? "#0A0A0A" : "#FFFFFF" }]}>
                  <View style={[s.themePreviewBar, { backgroundColor: o.k === "dark" ? "#000000" : "#0A0A0A" }]} />
                  <View style={{ flex: 1, padding: 6, gap: 4 }}>
                    <View style={[s.themePreviewLine, { backgroundColor: o.k === "dark" ? "#FAFAFA" : "#0A0A0A", width: "70%" }]} />
                    <View style={[s.themePreviewLine, { backgroundColor: o.k === "dark" ? "#3A3A3A" : "#D4D4D8" }]} />
                    <View style={[s.themePreviewLine, { backgroundColor: o.k === "dark" ? "#3A3A3A" : "#D4D4D8", width: "50%" }]} />
                  </View>
                </View>
                <Row gap={8} style={{ marginTop: 10 }}>
                  <Feather name={o.icon} size={14} color={C.txt} />
                  <Txt size={12.5} weight="600" color={C.txt} style={{ flex: 1 }}>
                    {o.label}
                  </Txt>
                  <View style={[s.radio, sel && { borderColor: C.txt }]}>{sel && <View style={s.radioDot} />}</View>
                </Row>
                <Txt size={11} color={C.muted} style={{ marginTop: 3 }}>
                  {o.desc}
                </Txt>
              </Pressable>
            );
          })}
        </Row>
      </Card>

      <Cols min={320}>
        <Card padded>
          <SectionHeader title="Genel Ayarlar" />
          {[
            { label: "Anlık Bildirimler", sub: "Kritik uyarıları anlık ilet", val: notif, set: setNotif, locked: false },
            { label: "Otomatik Yenileme", sub: "Verileri 30 sn'de bir güncelle", val: autoRefresh, set: setAutoRefresh, locked: false },
            { label: "YZ Otomatik Uygulama", sub: "YZ önerileri insan onayı olmadan uygulanamaz; kalıcı olarak kapalıdır", val: aiAuto, set: setAiAuto, locked: true },
          ].map((o) => (
            <Row key={o.label} gap={12} style={{ marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Txt size={11.5} weight="500" color={o.locked ? C.muted : C.txt}>
                  {o.label}
                </Txt>
                <Txt size={10.5} color={o.locked ? C.warning : C.muted} style={{ marginTop: 2 }}>
                  {o.sub}
                </Txt>
              </View>
              {o.locked ? (
                <Row gap={6}>
                  <Feather name="lock" size={12} color={C.warning} />
                  <Txt size={10} weight="700" color={C.warning}>
                    KİLİTLİ
                  </Txt>
                </Row>
              ) : (
                <Toggle value={o.val} onChange={o.set} />
              )}
            </Row>
          ))}

          <Divider style={{ marginVertical: 6 }} />
          <Txt size={11.5} weight="500" color={C.txt} style={{ marginTop: 10, marginBottom: 8 }}>
            Arayüz Dili
          </Txt>
          <Row gap={7} wrap>
            {["Türkçe", "English", "Deutsch"].map((l) => (
              <Pressable
                key={l}
                onPress={() => setLang(l)}
                style={[s.tab, lang === l && { backgroundColor: alpha(C.blue, 0.16), borderColor: C.blue }]}
              >
                <Txt size={11.5} color={lang === l ? C.blue : C.txt2} weight={lang === l ? "600" : "400"}>
                  {l}
                </Txt>
              </Pressable>
            ))}
          </Row>
        </Card>

        {role?.id === "ADMIN" && (
        <Card padded>
          <SectionHeader title="Platform Bilgisi" />
          {[
            ["Versiyon", "MEDAIGENCY Lot C v1.0"],
            ["API Bağlantısı", API_MODE === "live" ? API_BASE_URL! : "Demo sunucu (cihaz içi)"],
            ["Dağıtım", "Bulut · şirket içi · hibrit"],
            ["Mimari", "Olay güdümlü mikroservis"],
            ["Koordinasyon Çekirdeği", "Redis Stream + Redis Cache"],
            ["Geospatial Depo", "PostGIS + OSM Servisi"],
            ["Sismik Motor", "OpenQuake (Hazard + Risk)"],
            ["Gateway'ler", "Koordinasyon · Acil Durum · Backoffice"],
            ["Erişilebilirlik Hedefi", "≥%90 / ay"],
            ["Destek", "support@medaigency.gov.tr"],
          ].map(([k, v]) => (
            <Row key={k} style={s.infoRow}>
              <Txt size={11} color={C.muted}>
                {k}
              </Txt>
              <Txt size={11} weight="500" color={C.txt} style={{ flex: 1, textAlign: "right" }}>
                {v}
              </Txt>
            </Row>
          ))}
        </Card>
        )}
      </Cols>
    </Screen>
  );
}

const s = themed(() => StyleSheet.create({
  cardHead: { padding: 13, borderBottomWidth: 1, borderBottomColor: C.border },
  typeChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, alignSelf: "flex-start" },
  notifIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  listRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 10,
  },
  control: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
    borderRadius: RADIUS.lg,
    padding: 12,
    alignItems: "center",
  },
  controlIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  ethicRow: { marginBottom: 9, alignItems: "flex-start" },
  oversight: {
    backgroundColor: C.cardEl,
    borderRadius: RADIUS.md,
    borderLeftWidth: 2,
    padding: 10,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardEl,
  },
  roleRow: { paddingVertical: 11, borderTopWidth: 1, borderTopColor: C.border },
  roleDot: { width: 9, height: 9, borderRadius: 5 },
  countChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  avatar: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  vaultWarn: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    borderLeftColor: C.txt,
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
  themeOption: {
    flexGrow: 1,
    flexBasis: 220,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardEl,
  },
  themePreview: {
    height: 72,
    flexDirection: "row",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  themePreviewBar: { width: 22 },
  themePreviewLine: { height: 6, borderRadius: 2, width: "90%" },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.txt },
  infoRow: {
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
}));
