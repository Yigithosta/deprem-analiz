import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, RADIUS } from "../theme/tokens";
import { Screen, Cols } from "../components/Screen";
import {
  Txt, Row, Grid, Card, KPICard, SectionHeader, ScreenHeader, Bar, Btn, Toggle,
  StatusBadge, PFBadge, PFBadgeRow, Table, Divider, EmptyState, type Col,
} from "../components/ui";
import { internationalFlows, platformUsers, vaultEntries } from "../data/mock";
import {
  PRODUCT_FUNCTIONS, PF_GROUP_LABEL, TRACEABILITY, CONSTRAINTS,
  SECURITY_REQS, PERFORMANCE_REQS, QUALITY_REQS, type PFGroup,
} from "../data/srs";
import { ROLES, ROLE_BY_ID } from "../auth/roles";
import { useApp } from "../state/AppState";

/* ══════════ ULUSLARARASI YARDIM — PF-AI05 / DEP-007 ══════════ */

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
        pfs={["PF-AI05", "PF-DAT01", "PF-DAT02"]}
        note="DEP-007 — Uluslararası ve sınır ötesi veri, ayrı bir dış aktör olarak değil, ulusal otoriteler (ör. AFAD) üzerinden sisteme girer."
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
          <PFBadgeRow ids={["PF-AI05"]} />
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
          subtitle="Sınır ötesi kaynak paylaşımını koordine eden model"
          right={<PFBadge id="PF-AI05" color={C.gis} />}
        />
        {[
          { label: "Koordine edilen ülke", val: "7", col: C.gis },
          { label: "Aktif yardım koridoru", val: "4", col: C.success },
          { label: "Bekleyen tahsis kararı", val: "2", col: C.warning },
          { label: "Son çalıştırma", val: "Dün 22:10", col: C.txt2 },
          { label: "Tetikleyen aktör", val: "Admin (SEC-009)", col: C.ai },
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

/* ══════════ BİLDİRİMLER — PF-SYS02 ══════════ */

export function NotificationsScreen() {
  const { notifications, markRead, markAllRead, unreadCount } = useApp();

  return (
    <Screen>
      <ScreenHeader
        title="Bildirimler"
        subtitle="Bildirim Servisi üzerinden iletilen operasyonel uyarı ve durum değişiklikleri"
        pfs={["PF-SYS02"]}
        note="PER-001 — Acil bildirimler olay akış çekirdeği üzerinden uçtan uca ≤ 5 sn hedef gecikmeyle iletilir."
      />

      <Row style={{ justifyContent: "space-between" }}>
        <Txt size={12} color={C.muted}>
          {unreadCount} okunmamış · toplam {notifications.length}
        </Txt>
        <Btn label="Tümünü Okundu İşaretle" small variant="outline" icon="check" onPress={markAllRead} />
      </Row>

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
                    <PFBadge id={n.pf} />
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

/* ══════════ RAPORLAMA ══════════ */

export function ReportingScreen() {
  return (
    <Screen>
      <ScreenHeader
        title="Raporlama & Analitik"
        subtitle="Operasyonel özetler, KPI belgesi ve dışa aktarma"
        pfs={["PF-GET01", "PF-GET02", "PF-SYS04"]}
      />

      <Grid>
        <KPICard label="Üretilen Rapor" value="142" color={C.blue} icon="file-text" />
        <KPICard label="Otomatik Özet" value="24" color={C.success} icon="cpu" />
        <KPICard label="PDF İndirme" value="87" color={C.ai} icon="download" />
        <KPICard label="Veri Kalitesi" value="%97.4" color={C.gis} icon="check-circle" />
      </Grid>

      <Cols min={320}>
        <Card padded>
          <SectionHeader title="Rapor Şablonları" />
          {[
            "Günlük Operasyon Özeti",
            "Tıbbi Kapasite Raporu (PF-EMG01)",
            "Kaynak Hazırlık Raporu (PF-GET08)",
            "YZ Karar Günlüğü (CON-004)",
            "Hazard & Risk Sonuç Raporu (PF-GET01/02)",
            "AB Proje Raporu (LOT C)",
          ].map((r) => (
            <Row key={r} style={s.listRow}>
              <Txt size={11.5} weight="500" color={C.txt} style={{ flex: 1 }}>
                {r}
              </Txt>
              <Btn label="PDF" small variant="outline" icon="download" />
            </Row>
          ))}
        </Card>

        <Card padded>
          <SectionHeader title="Son Raporlar" />
          {[
            { name: "Günlük Özet — 27 Tem", size: "2.4 MB", time: "08:00" },
            { name: "YZ Karar Günlüğü — 26 Tem", size: "890 KB", time: "Dün" },
            { name: "Tıbbi Kapasite — 27 Tem 12:00", size: "1.1 MB", time: "12:00" },
            { name: "Risk Sonuçları — Mw7.2 senaryosu", size: "4.2 MB", time: "07:05" },
            { name: "AB LOT C — Haziran 2026", size: "8.7 MB", time: "01 Tem" },
          ].map((r) => (
            <Row key={r.name} style={s.listRow}>
              <View style={{ flex: 1 }}>
                <Txt size={11.5} weight="500" color={C.txt}>
                  {r.name}
                </Txt>
                <Txt size={10} color={C.muted} mono style={{ marginTop: 2 }}>
                  {r.size} · {r.time}
                </Txt>
              </View>
              <Btn label="İndir" small icon="download" />
            </Row>
          ))}
        </Card>
      </Cols>
    </Screen>
  );
}

/* ══════════ DENETİM & ETİK — PF-SYS04 / SEC-006 ══════════ */

export function AuditScreen() {
  const { audit } = useApp();

  const cols: Col[] = [
    { key: "time", label: "Saat", width: 85 },
    { key: "user", label: "Kullanıcı", width: 150 },
    { key: "role", label: "Rol", width: 90 },
    { key: "action", label: "Aksiyon", width: 200 },
    { key: "detail", label: "Detay", width: 300 },
    { key: "pf", label: "Fonksiyon", width: 100 },
    { key: "type", label: "Tür", width: 110 },
  ];

  return (
    <Screen>
      <ScreenHeader
        title="Denetim, Etik & Şeffaflık"
        subtitle="YZ açıklanabilirliği, izlenebilirlik ve insan gözetimi"
        pfs={["PF-SYS04"]}
        note="CON-004 / SEC-006 — Kimlik doğrulama olayları, veri değişiklikleri ve operasyonel kararlar kurcalamaya karşı korumalı biçimde kaydedilir."
      />

      <Grid>
        {[
          { label: "RBAC Aktif", icon: "shield" as const },
          { label: "ÇFA Etkin", icon: "smartphone" as const },
          { label: "Denetim Kaydı", icon: "book-open" as const },
          { label: "Şifreleme (TLS)", icon: "lock" as const },
          { label: "Gizlilik Kontrolleri", icon: "eye" as const },
        ].map((c) => (
          <View key={c.label} style={[s.control, { flexBasis: 150, flexGrow: 1 }]}>
            <View style={[s.controlIcon, { backgroundColor: alpha(C.success, 0.13) }]}>
              <Feather name={c.icon} size={14} color={C.success} />
            </View>
            <Txt size={10.5} weight="600" color={C.success} style={{ marginTop: 7, textAlign: "center" }}>
              {c.label}
            </Txt>
            <Txt size={9} weight="700" color={C.success} style={{ marginTop: 2 }}>
              AKTİF
            </Txt>
          </View>
        ))}
      </Grid>

      <Cols min={330}>
        <Card padded>
          <SectionHeader title="YZ Açıklanabilirliği" subtitle="QLT-006 · CON-008 · CON-013" />
          {[
            { p: "Güven Skoru", d: "Her öneride %0–100 güven aralığı zorunlu" },
            { p: "Kanıt Kaynakları", d: "Kullanılan veri kaynakları tam listeleniyor" },
            { p: "Girdi Fonksiyonları", d: "Her öneri, üreten PF'lere kadar izlenebilir" },
            { p: "YZ Gerekçesi", d: "İnsan-okunabilir çıkarım zinciri sunuluyor" },
            { p: "Model Versiyonu", d: "Her çıktıda model sürümü belirtiliyor" },
            { p: "İzlenebilirlik", d: "Onay kişisi, zamanı ve gerekçesi loglanır" },
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
          <SectionHeader title="İnsan Gözetimde Karar Mekanizması" subtitle="CON-007 · SEC-008 · ASM-002/003" />
          {[
            { r: "Salt-Okunur Konsol", d: "Sistem yalnızca bilgi sunar; hiçbir öneriyi kendi başına uygulayamaz", critical: true },
            { r: "Otomatik Uygulama Yasağı", d: "Hiçbir YZ önerisi onaysız uygulanamaz", critical: true },
            { r: "Kararın Yeri", d: "Onay ve ret kararı yetkili personelce sistem dışında verilir", critical: false },
            { r: "Tavsiye Niteliği", d: "Her çıktı gerekçesi, güven skoru ve girdi fonksiyonlarıyla birlikte sunulur", critical: false },
            { r: "Nihai Sorumluluk", d: "Operasyonel sorumluluk yetkili kuruluş ve personelde kalır (ASM-003)", critical: false },
            { r: "Gizlilik Koruması", d: "Mağdur ve hasta verileri anonimleştirilerek işlenir (CON-015)", critical: false },
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
              {audit.length} kayıt · bu oturumdaki kararlar canlı eklenir
            </Txt>
          </View>
          <Btn label="Dışa Aktar" small variant="outline" icon="download" />
        </Row>
        <Table
          cols={cols}
          rows={audit}
          keyExtractor={(r, i) => `${r.time}-${i}`}
          renderCell={(row, key) => {
            if (key === "type") return <StatusBadge status={row.type} />;
            if (key === "pf") return <PFBadge id={row.pf} />;
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

/* ══════════ GEREKSİNİM İZLENEBİLİRLİĞİ — SRS §5 ══════════ */

export function TraceabilityScreen() {
  const [tab, setTab] = useState<"pf" | "rtm" | "nfr">("pf");
  const groups = Object.keys(PF_GROUP_LABEL) as PFGroup[];

  return (
    <Screen>
      <ScreenHeader
        title="Gereksinim İzlenebilirliği"
        subtitle="SRS V1.0 ürün fonksiyonları, izlenebilirlik matrisi ve fonksiyonel olmayan gereksinimler"
        pfs={["PF-SYS01"]}
        note="Bu ekran, arayüzdeki her yeteneğin SRS'teki karşılığını göstermek için eklenmiştir (IEEE Std 29148-2018 §5)."
      />

      <Row gap={7} wrap>
        {[
          { k: "pf" as const, l: `Ürün Fonksiyonları (${PRODUCT_FUNCTIONS.length})` },
          { k: "rtm" as const, l: "İzlenebilirlik Matrisi" },
          { k: "nfr" as const, l: "Fonksiyonel Olmayan Gereksinimler" },
        ].map((t) => (
          <Pressable
            key={t.k}
            onPress={() => setTab(t.k)}
            style={[s.tab, tab === t.k && { backgroundColor: alpha(C.blue, 0.16), borderColor: C.blue }]}
          >
            <Txt size={11.5} weight={tab === t.k ? "600" : "400"} color={tab === t.k ? C.blue : C.txt2}>
              {t.l}
            </Txt>
          </Pressable>
        ))}
      </Row>

      {tab === "pf" &&
        groups.map((g) => {
          const items = PRODUCT_FUNCTIONS.filter((p) => p.group === g);
          return (
            <Card key={g} padded>
              <Row gap={8} style={{ marginBottom: 12 }}>
                <Txt size={13} weight="700" color={C.txt}>
                  {PF_GROUP_LABEL[g]}
                </Txt>
                <PFBadge id={g} color={C.gis} />
                <Txt size={10.5} color={C.muted}>
                  {items.length} fonksiyon
                </Txt>
              </Row>
              {items.map((p) => (
                <View key={p.id} style={s.pfRow}>
                  <Row gap={8} style={{ alignItems: "flex-start" }}>
                    <PFBadge id={p.id} />
                    <View style={{ flex: 1 }}>
                      <Txt size={11.5} weight="600" color={C.txt}>
                        {p.title}
                      </Txt>
                      <Txt size={10.5} color={C.muted} style={{ marginTop: 3, lineHeight: 15 }}>
                        {p.desc}
                      </Txt>
                      <Row gap={5} wrap style={{ marginTop: 6 }}>
                        <Txt size={9} color={C.muted} upper weight="700">
                          Aktör
                        </Txt>
                        {p.actors.length ? (
                          p.actors.map((a) => (
                            <View
                              key={a}
                              style={[s.actorChip, { backgroundColor: alpha(ROLE_BY_ID[a].color, 0.15) }]}
                            >
                              <Txt size={9} weight="700" color={ROLE_BY_ID[a].color}>
                                {ROLE_BY_ID[a].short}
                              </Txt>
                            </View>
                          ))
                        ) : (
                          <Txt size={9.5} color={C.muted} style={{ fontStyle: "italic" }}>
                            otomatik (aktör etkileşimi yok)
                          </Txt>
                        )}
                      </Row>
                    </View>
                  </Row>
                </View>
              ))}
            </Card>
          );
        })}

      {tab === "rtm" && (
        <Card padded>
          <SectionHeader
            title="Gereksinim İzlenebilirlik Matrisi"
            subtitle="SRS §5 — her fonksiyon grubunun kaynağı, ilgili kısıt/bağımlılıkları ve NFR'leri"
          />
          {TRACEABILITY.map((t) => (
            <View key={t.group} style={s.rtmRow}>
              <Row gap={8} style={{ marginBottom: 6 }}>
                <PFBadge id={t.group} color={C.ai} />
                <Txt size={12} weight="700" color={C.txt}>
                  {t.label}
                </Txt>
              </Row>
              <Txt size={10.5} color={C.txt2} style={{ marginBottom: 8 }}>
                <Txt size={10.5} color={C.muted} weight="700">
                  Kaynak / Gerçekleyen:{" "}
                </Txt>
                {t.source}
              </Txt>
              <Txt size={9} weight="700" color={C.muted} upper style={{ marginBottom: 4 }}>
                İlgili Kısıt / Bağımlılık
              </Txt>
              <Row gap={4} wrap style={{ marginBottom: 8 }}>
                {t.related.map((r) => (
                  <PFBadge key={r} id={r} color={C.gis} />
                ))}
              </Row>
              <Txt size={9} weight="700" color={C.muted} upper style={{ marginBottom: 4 }}>
                İlgili NFR
              </Txt>
              <Row gap={4} wrap>
                {t.nfr.map((r) => (
                  <PFBadge key={r} id={r} color={C.warning} />
                ))}
              </Row>
            </View>
          ))}
        </Card>
      )}

      {tab === "nfr" && (
        <>
          {[
            { title: "Kısıtlar (SRS §2.4)", data: CONSTRAINTS, color: C.gis },
            { title: "Güvenlik Gereksinimleri (SRS §4.2)", data: SECURITY_REQS, color: C.danger },
            { title: "Performans Gereksinimleri (SRS §4.1)", data: PERFORMANCE_REQS, color: C.warning },
          ].map((sec) => (
            <Card key={sec.title} padded>
              <SectionHeader title={sec.title} />
              {sec.data.map((r) => (
                <Row key={r.id} gap={9} style={{ marginBottom: 9, alignItems: "flex-start" }}>
                  <PFBadge id={r.id} color={sec.color} />
                  <Txt size={11} color={C.txt2} style={{ flex: 1, lineHeight: 16 }}>
                    {r.text}
                  </Txt>
                </Row>
              ))}
            </Card>
          ))}
          <Card padded>
            <SectionHeader title="Yazılım Kalite Nitelikleri (SRS §4.3)" />
            {QUALITY_REQS.map((r) => (
              <Row key={r.id} gap={9} style={{ marginBottom: 9, alignItems: "flex-start" }}>
                <PFBadge id={r.id} color={C.ai} />
                <View style={{ flex: 1 }}>
                  <Txt size={11.5} weight="600" color={C.txt}>
                    {r.attr}
                  </Txt>
                  <Txt size={11} color={C.txt2} style={{ marginTop: 2, lineHeight: 16 }}>
                    {r.text}
                  </Txt>
                </View>
              </Row>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

/* ══════════ KULLANICI YÖNETİMİ — SEC-001 / CON-003 ══════════ */

export function UsersScreen() {
  const cols: Col[] = [
    { key: "name", label: "Kullanıcı", width: 190 },
    { key: "email", label: "E-posta", width: 220 },
    { key: "role", label: "Rol (Aktör)", width: 155 },
    { key: "title", label: "Görev", width: 155 },
    { key: "mfa", label: "ÇFA", width: 105 },
    { key: "last", label: "Son Giriş", width: 110 },
    { key: "status", label: "Durum", width: 105 },
  ];

  return (
    <Screen>
      <ScreenHeader
        title="Kullanıcı & Erişim Yönetimi"
        subtitle="Rol tabanlı erişim kontrolü, aktör eşleşmesi ve ÇFA yönetimi"
        pfs={["PF-SYS01"]}
        note="CON-003 / SEC-001 / SEC-009 — Her role yalnızca sorumluluğu kadar erişim verilir."
      />

      <Grid>
        <KPICard label="Toplam Kullanıcı" value="42" color={C.blue} icon="users" />
        <KPICard label="Aktif Oturum" value="18" color={C.success} icon="activity" />
        <KPICard label="ÇFA Etkin" value="39/42" color={C.gis} icon="shield" />
        <KPICard label="Güvenlik Uyarısı" value="2" trend={1} color={C.danger} icon="alert-triangle" />
      </Grid>

      <Card padded>
        <SectionHeader
          title="Rol → Fonksiyon Yetki Matrisi"
          subtitle="SRS §2.3 — her aktörün erişebildiği ürün fonksiyonları"
        />
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
                  {r.functions.length} PF
                </Txt>
              </View>
            </Row>
            <Row gap={4} wrap>
              {r.functions.map((f) => (
                <PFBadge key={f} id={f} color={r.color} />
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
          <Btn label="Kullanıcı Ekle" small variant="outline" icon="user-plus" />
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
                    <Txt size={9} weight="700" color="#fff">
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
                  <Feather
                    name={row.mfa ? "shield" : "alert-triangle"}
                    size={11}
                    color={row.mfa ? C.success : C.danger}
                  />
                  <Txt size={10.5} weight="600" color={row.mfa ? C.success : C.danger}>
                    {row.mfa ? "Etkin" : "Devre Dışı"}
                  </Txt>
                </Row>
              );
            if (key === "status") return <StatusBadge status={row.status} />;
            if (key === "email" || key === "last")
              return <Txt size={10.5} color={C.muted} mono>{row[key]}</Txt>;
            return <Txt size={11} color={C.txt2}>{row[key]}</Txt>;
          }}
        />
      </Card>
    </Screen>
  );
}

/* ══════════ VAULT & SIR YÖNETİMİ — PF-SYS03 / SEC-002 ══════════ */

export function VaultScreen() {
  const { log } = useApp();
  const [rotated, setRotated] = useState<Record<string, boolean>>({});

  const cols: Col[] = [
    { key: "key", label: "Anahtar Yolu", width: 250 },
    { key: "type", label: "Tür", width: 140 },
    { key: "scope", label: "Kapsam", width: 180 },
    { key: "rotated", label: "Son Rotasyon", width: 125 },
    { key: "ttl", label: "TTL", width: 85 },
    { key: "status", label: "Durum", width: 105 },
    { key: "action", label: "İşlem", width: 110 },
  ];

  function rotate(key: string) {
    setRotated((p) => ({ ...p, [key]: true }));
    log("Vault Değeri Değiştirildi", `${key} anahtarı rotasyona alındı`, "change", "PF-SYS03");
  }

  return (
    <Screen>
      <ScreenHeader
        title="Vault & Sır Yönetimi"
        subtitle="Kimlik bilgileri, şifreleme anahtarları ve hassas yapılandırma değerleri"
        pfs={["PF-SYS03"]}
        note="SEC-002 — Tüm sırlar Vault Servisi ile yönetilir ve düz metin olarak saklanmaz. Değerler burada asla görüntülenmez."
      />

      <View style={s.vaultWarn}>
        <Feather name="shield" size={14} color={C.gis} />
        <Txt size={10.5} color={C.gis} style={{ flex: 1, lineHeight: 15 }}>
          Sır değerleri arayüzde hiçbir koşulda gösterilmez; yalnızca meta veri (yol, tür, kapsam, rotasyon durumu)
          listelenir. Her rotasyon işlemi denetim kaydına yazılır (SEC-006).
        </Txt>
      </View>

      <Grid>
        <KPICard label="Yönetilen Sır" value={String(vaultEntries.length)} color={C.blue} icon="key" />
        <KPICard label="Rotasyon Gecikmiş" value="1" sub="redis/stream" trend={1} color={C.danger} icon="alert-triangle" />
        <KPICard label="Yaklaşan Rotasyon" value="1" sub="e112/mtls" color={C.warning} icon="clock" />
        <KPICard label="Şifreleme" value="AES-256" sub="bekleyen veri" color={C.success} icon="lock" />
      </Grid>

      <Card>
        <Row style={s.cardHead}>
          <Txt size={13} weight="600" color={C.txt} style={{ flex: 1 }}>
            Vault Girdileri
          </Txt>
          <PFBadgeRow ids={["PF-SYS03", "SEC-002"]} />
        </Row>
        <Table
          cols={cols}
          rows={vaultEntries}
          keyExtractor={(r) => r.key}
          renderCell={(row, key) => {
            if (key === "key") return <Txt size={11} color={C.txt} mono>{row.key}</Txt>;
            if (key === "status")
              return <StatusBadge status={rotated[row.key] ? "online" : row.status} />;
            if (key === "rotated")
              return (
                <Txt size={11} color={rotated[row.key] ? C.success : C.txt2} mono>
                  {rotated[row.key] ? "Az önce" : row.rotated}
                </Txt>
              );
            if (key === "action")
              return rotated[row.key] ? (
                <Row gap={5}>
                  <Feather name="check-circle" size={11} color={C.success} />
                  <Txt size={10} color={C.success} weight="600">
                    Yapıldı
                  </Txt>
                </Row>
              ) : (
                <Btn label="Rotasyon" small variant="outline" onPress={() => rotate(row.key)} />
              );
            return <Txt size={11} color={C.txt2} mono={key === "ttl"}>{row[key]}</Txt>;
          }}
        />
      </Card>
    </Screen>
  );
}

/* ══════════ SİSTEM AYARLARI ══════════ */

export function SettingsScreen() {
  const [notif, setNotif] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [aiAuto, setAiAuto] = useState(false);
  const [lang, setLang] = useState("Türkçe");

  return (
    <Screen>
      <ScreenHeader
        title="Sistem Ayarları"
        subtitle="Platform yapılandırması ve tercihler"
        pfs={["PF-SYS02", "PF-SYS03"]}
      />

      <Cols min={320}>
        <Card padded>
          <SectionHeader title="Genel Ayarlar" />
          {[
            { label: "Anlık Bildirimler", sub: "Kritik uyarıları anlık ilet (PF-SYS02)", val: notif, set: setNotif, locked: false },
            { label: "Otomatik Yenileme", sub: "Verileri 30 sn'de bir güncelle", val: autoRefresh, set: setAutoRefresh, locked: false },
            { label: "YZ Otomatik Uygulama", sub: "CON-007 / SEC-008 gereği kalıcı olarak devre dışıdır", val: aiAuto, set: setAiAuto, locked: true },
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

        <Card padded>
          <SectionHeader title="Platform Bilgisi" subtitle="CON-001 · DSN-001 · OTH-003" />
          {[
            ["Versiyon", "MEDAIGENCY Lot C v1.0"],
            ["Referans", "SRS V1.0 · IEEE 29148-2018"],
            ["Ortam", "Üretim — TR-GOV-CLOUD"],
            ["Mimari", "Olay güdümlü mikroservis"],
            ["Koordinasyon Çekirdeği", "Redis Stream + Redis Cache"],
            ["Geospatial Depo", "PostGIS + OSM Servisi"],
            ["Sismik Motor", "OpenQuake (Hazard + Risk)"],
            ["Gateway'ler", "Koordinasyon · Acil Durum · Backoffice"],
            ["Veri Merkezi", "Ankara DC-1 (Birincil)"],
            ["Yedek DC", "İstanbul DC-2 (Aktif)"],
            ["Erişilebilirlik Hedefi", "≥%90/ay (QLT-002)"],
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
      </Cols>
    </Screen>
  );
}

const s = StyleSheet.create({
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
    borderColor: alpha(C.success, 0.3),
    borderRadius: RADIUS.lg,
    padding: 12,
    alignItems: "center",
  },
  controlIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
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
  pfRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  actorChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rtmRow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border },
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
    backgroundColor: alpha(C.gis, 0.1),
    borderWidth: 1,
    borderColor: alpha(C.gis, 0.3),
  },
  infoRow: {
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
});
