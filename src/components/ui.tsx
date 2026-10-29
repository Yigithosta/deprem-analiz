import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  PanResponder,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, FONT, MONO, RADIUS, themed } from "../theme/tokens";

/* ─────────────────────────── Tipografi ─────────────────────────── */

type TxtProps = {
  children?: React.ReactNode;
  size?: number;
  color?: string;
  weight?: TextStyle["fontWeight"];
  mono?: boolean;
  upper?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function Txt({
  children,
  size = 12,
  color = C.txt2,
  weight = "400",
  mono = false,
  upper = false,
  style,
  numberOfLines,
}: TxtProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: size,
          color,
          fontWeight: weight,
          fontFamily: mono ? MONO : FONT,
          letterSpacing: upper ? 0.8 : 0,
        },
        upper && { textTransform: "uppercase" },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/* ─────────────────────────── Kart ─────────────────────────── */

export function Card({
  children,
  style,
  padded = false,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return <View style={[s.card, padded && { padding: 16 }, style]}>{children}</View>;
}

export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={s.sectionHeader}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Txt size={13} weight="600" color={C.txt}>
          {title}
        </Txt>
        {!!subtitle && (
          <Txt size={11.5} color={C.muted} style={{ marginTop: 3, lineHeight: 16 }}>
            {subtitle}
          </Txt>
        )}
      </View>
      {right}
    </View>
  );
}

/* ─────────────────────── Durum rozeti ─────────────────────── */

const BADGE_COLORS: Record<string, string> = {
  get critical() { return C.critical; },
  get high() { return C.danger; },
  get medium() { return C.warning; },
  get low() { return C.muted; },
  get online() { return C.success; },
  get ready() { return C.success; },
  get degraded() { return C.warning; },
  get stale() { return C.warning; },
  get idle() { return C.muted; },
  get offline() { return C.danger; },
  get impassable() { return C.critical; },
  get restricted() { return C.warning; },
  get passable() { return C.success; },
  get approval() { return C.success; },
  get change() { return C.txt2; },
  get update() { return C.txt2; },
  get system() { return C.muted; },
  get auth() { return C.txt2; },
  get export() { return C.txt2; },
  get rejection() { return C.danger; },
  get pending() { return C.warning; },
  get approved() { return C.success; },
  get rejected() { return C.danger; },
  get recomputing() { return C.txt2; },
  get queued() { return C.muted; },
  get running() { return C.txt; },
  get done() { return C.success; },
  get failed() { return C.danger; },
};

const BADGE_LABEL: Record<string, string> = {
  critical: "KRİTİK",
  high: "YÜKSEK",
  medium: "ORTA",
  low: "DÜŞÜK",
  online: "ÇEVRİMİÇİ",
  ready: "HAZIR",
  degraded: "KISITLI",
  stale: "BAYAT",
  idle: "BEKLEMEDE",
  offline: "ÇEVRİMDIŞI",
  impassable: "GEÇİLEMEZ",
  restricted: "KISITLI",
  passable: "GEÇİLEBİLİR",
  approval: "ONAY",
  change: "DEĞİŞİKLİK",
  update: "GÜNCELLEME",
  system: "SİSTEM",
  auth: "KİMLİK",
  export: "DIŞA AKTARIM",
  rejection: "RET",
  pending: "KARAR BEKLİYOR",
  approved: "ONAYLANDI",
  rejected: "REDDEDİLDİ",
  recomputing: "YENİDEN HESAPLANIYOR",
  queued: "SIRADA",
  running: "ÇALIŞIYOR",
  done: "TAMAMLANDI",
  failed: "HATA",
};

/** Durum rozeti — renkli nokta + metin; anlam renge değil metne dayanır. */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const col = BADGE_COLORS[status] ?? C.muted;
  return (
    <View style={s.badge}>
      <View style={[s.badgeDot, { backgroundColor: col }]} />
      <Txt size={9.5} weight="600" color={col === C.muted ? C.muted : C.txt2} upper>
        {label ?? BADGE_LABEL[status] ?? status}
      </Txt>
    </View>
  );
}

/** Kaynak / girdi etiketi — bir çıktının hangi veriden geldiğini gösterir. */
export function Tag({ label }: { label: string; color?: string }) {
  return (
    <View style={s.tag}>
      <Txt size={10} weight="500" color={C.txt2}>
        {label}
      </Txt>
    </View>
  );
}

/* ─────────────────────────── KPI ─────────────────────────── */

export function KPICard({
  label,
  value,
  sub,
  trend,
  color = C.blue,
  icon = "activity",
  minWidth = 150,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  color?: string;
  icon?: keyof typeof Feather.glyphMap;
  minWidth?: number;
}) {
  return (
    // maxWidth, son satırda tek kalan kartın tüm genişliğe yayılmasını önler.
    <View style={[s.card, s.kpi, { minWidth, maxWidth: minWidth * 2, flexGrow: 1, flexBasis: minWidth }]}>
      <View style={s.rowBetween}>
        <Txt size={10} weight="600" color={C.muted} upper style={{ flex: 1 }} numberOfLines={2}>
          {label}
        </Txt>
        <Feather name={icon} size={14} color={C.muted} />
      </View>
      <Txt size={24} weight="600" color={C.txt} style={{ marginTop: 8, letterSpacing: -0.5 }}>
        {value}
      </Txt>
      <View style={[s.row, { marginTop: 4, gap: 6 }]}>
        {trend !== undefined && (
          <View style={s.row}>
            <Feather
              name={trend >= 0 ? "arrow-up-right" : "arrow-down-right"}
              size={11}
              color={trend >= 0 ? C.danger : C.success}
            />
            <Txt size={11} weight="600" color={trend >= 0 ? C.danger : C.success} mono>
              {Math.abs(trend)}%
            </Txt>
          </View>
        )}
        {!!sub && (
          <Txt size={10} color={C.muted} numberOfLines={1} style={{ flex: 1 }}>
            {sub}
          </Txt>
        )}
      </View>
    </View>
  );
}

/* ────────────────────── İlerleme çubuğu ────────────────────── */

export function Bar({
  pct,
  color,
  height = 4,
  track = C.border,
  style,
}: {
  pct: number;
  color: string;
  height?: number;
  track?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: track, overflow: "hidden" }, style]}>
      <View
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(100, pct))}%`,
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

/* ─────────────────────────── Buton ─────────────────────────── */

export function Btn({
  label,
  onPress,
  variant = "primary",
  icon,
  color,
  disabled,
  small,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "outline" | "ghost";
  icon?: keyof typeof Feather.glyphMap;
  color?: string;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isPrimary = variant === "primary";
  // Ana düğme siyah; ikincil düğmeler nötr çerçeveli. Yalnızca yıkıcı/onay
  // işlemleri anlamlı durum rengini korur.
  const semantic = color === C.danger || color === C.critical || color === C.success;
  const base = semantic ? color! : C.txt;
  const onFill = semantic ? C.onSemantic : C.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        small && { paddingVertical: 6, paddingHorizontal: 10 },
        isPrimary
          ? { backgroundColor: base }
          : { borderWidth: 1, borderColor: variant === "outline" ? (semantic ? alpha(base, 0.5) : C.borderStrong) : C.border, backgroundColor: C.card },
        (disabled || pressed) && { opacity: disabled ? 0.5 : 0.75 },
        style,
      ]}
    >
      {!!icon && <Feather name={icon} size={small ? 12 : 14} color={isPrimary ? onFill : base} />}
      <Txt size={small ? 11.5 : 12.5} weight="600" color={isPrimary ? onFill : base}>
        {label}
      </Txt>
    </Pressable>
  );
}

/* ─────────────────────────── Toggle ─────────────────────────── */

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={[s.toggle, { backgroundColor: value ? C.txt : C.borderStrong }]}
    >
      <View style={[s.toggleKnob, { left: value ? 22 : 2, backgroundColor: value ? C.onPrimary : "#fff" }]} />
    </Pressable>
  );
}

/* ─────────────────────────── Checkbox ─────────────────────────── */

export function Checkbox({
  checked,
  onChange,
  label,
  color = C.blue,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  color?: string;
}) {
  color = C.txt;
  return (
    <Pressable onPress={() => onChange(!checked)} style={s.checkRow}>
      <View
        style={[
          s.checkbox,
          { borderColor: color, backgroundColor: checked ? color : "transparent" },
        ]}
      >
        {checked && <Feather name="check" size={9} color={C.onPrimary} />}
      </View>
      <Txt size={11} color={checked ? C.txt : C.muted} style={{ flex: 1 }}>
        {label}
      </Txt>
    </Pressable>
  );
}

/* ─────────────────────────── Slider ─────────────────────────── */

/** Dokunma ve fare ile çalışan, platformdan bağımsız kaydırıcı. */
export function Slider({
  value,
  min,
  max,
  step = 1,
  color = C.blue,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  color?: string;
  onChange: (v: number) => void;
}) {
  const [width, setWidth] = useState(1);
  const widthRef = useRef(1);

  const commit = (x: number) => {
    const ratio = Math.max(0, Math.min(1, x / widthRef.current));
    const raw = min + ratio * (max - min);
    const snapped = Math.round(raw / step) * step;
    // Kayan nokta artıklarını temizle (ör. 7.199999999)
    const decimals = (String(step).split(".")[1] ?? "").length;
    onChange(Number(Math.max(min, Math.min(max, snapped)).toFixed(decimals)));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => commit(e.nativeEvent.locationX),
      onPanResponderMove: (e, g) => commit(e.nativeEvent.locationX ?? g.moveX),
    })
  ).current;

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <View
      {...pan.panHandlers}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        widthRef.current = w;
        setWidth(w);
      }}
      style={s.sliderHit}
    >
      <View style={s.sliderTrack}>
        <View style={{ width: `${pct}%`, height: "100%", backgroundColor: color, borderRadius: 3 }} />
      </View>
      <View style={[s.sliderKnob, { left: Math.max(0, (pct / 100) * width - 8), borderColor: color }]} />
    </View>
  );
}

export function LabeledSlider({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  color = C.blue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  color?: string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={s.rowBetween}>
        <Txt size={11} color={C.muted}>
          {label}
        </Txt>
        <Txt size={11} weight="700" color={color} mono>
          {value}
          {unit}
        </Txt>
      </View>
      <Slider value={value} min={min} max={max} step={step} color={color} onChange={onChange} />
    </View>
  );
}

/* ─────────────────────────── Tablo ─────────────────────────── */

export type Col = { key: string; label: string; width: number; align?: "left" | "right" };

export function Table({
  cols,
  rows,
  renderCell,
  keyExtractor,
}: {
  cols: Col[];
  rows: any[];
  renderCell: (row: any, colKey: string) => React.ReactNode;
  keyExtractor: (row: any, i: number) => string;
}) {
  const total = cols.reduce((a, c) => a + c.width, 0);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: "100%" }}>
      <View style={{ minWidth: total }}>
        <View style={s.tableHead}>
          {cols.map((c) => (
            <View key={c.key} style={{ width: c.width, paddingHorizontal: 10 }}>
              <Txt size={10} weight="700" color={C.muted} upper>
                {c.label}
              </Txt>
            </View>
          ))}
        </View>
        {rows.map((row, i) => (
          <View key={keyExtractor(row, i)} style={s.tableRow}>
            {cols.map((c) => (
              <View
                key={c.key}
                style={{
                  width: c.width,
                  paddingHorizontal: 10,
                  alignItems: c.align === "right" ? "flex-end" : "flex-start",
                  justifyContent: "center",
                }}
              >
                {renderCell(row, c.key)}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* ─────────────────────── Yardımcı düzen ─────────────────────── */

export function Row({
  children,
  gap = 8,
  style,
  wrap = false,
}: {
  children?: React.ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  wrap?: boolean;
}) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap }, wrap && { flexWrap: "wrap" }, style]}>
      {children}
    </View>
  );
}

export function Grid({ children, gap = 10 }: { children?: React.ReactNode; gap?: number }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: C.border }, style]} />;
}

/** Ekran başlığı. */
export function ScreenHeader({
  title,
  subtitle,
  note,
}: {
  title: string;
  subtitle?: string;
  note?: string;
}) {
  return (
    <View style={s.screenHeader}>
      <Txt size={20} weight="600" color={C.txt} style={{ letterSpacing: -0.3 }}>
        {title}
      </Txt>
      {!!subtitle && (
        <Txt size={12.5} color={C.txt2} style={{ marginTop: 4, lineHeight: 18 }}>
          {subtitle}
        </Txt>
      )}
      {!!note && (
        <Txt size={11} color={C.muted} style={{ marginTop: 6, lineHeight: 16 }}>
          {note}
        </Txt>
      )}
    </View>
  );
}

/** YZ çıktılarının tavsiye niteliğinde olduğunu bildiren uyarı şeridi. */
export function AdvisoryNotice({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[s.advisory, compact && { paddingVertical: 6 }]}>
      <Feather name="info" size={13} color={C.txt2} />
      <Txt size={11} color={C.txt2} weight="500" style={{ flex: 1 }}>
        YZ çıktıları yalnızca tavsiye niteliğindedir. Operasyonel eylem öncesi yetkili onayı zorunludur.
      </Txt>
    </View>
  );
}

/** Kısa bilgi, başarı veya hata mesajı. */
export function Notice({
  tone = "info",
  text,
  style,
}: {
  tone?: "info" | "success" | "error" | "warning";
  text: string;
  style?: StyleProp<ViewStyle>;
}) {
  const col = tone === "success" ? C.success : tone === "error" ? C.danger : tone === "warning" ? C.warning : C.info;
  const icon = tone === "success" ? "check-circle" : tone === "error" ? "alert-octagon" : tone === "warning" ? "alert-triangle" : "info";
  return (
    <View style={[s.notice, { borderLeftColor: tone === "info" ? C.txt2 : col }, style]}>
      <Feather name={icon} size={13} color={tone === "info" ? C.txt2 : col} style={{ marginTop: 1 }} />
      <Txt size={11} color={C.txt} style={{ flex: 1, lineHeight: 16 }}>
        {text}
      </Txt>
    </View>
  );
}

export function EmptyState({ icon = "inbox", text }: { icon?: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={s.empty}>
      <Feather name={icon} size={22} color={C.muted} />
      <Txt size={12} color={C.muted} style={{ marginTop: 8, textAlign: "center" }}>
        {text}
      </Txt>
    </View>
  );
}

/* ─────────────────────────── Stiller ─────────────────────────── */

const s = themed(() => StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.lg,
  },
  kpi: { padding: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  screenHeader: { marginBottom: 6, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignSelf: "flex-start",
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignSelf: "flex-start",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    backgroundColor: C.cardEl,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    minHeight: 34,
  },
  toggle: { width: 40, height: 20, borderRadius: 10, justifyContent: "center" },
  toggleKnob: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderHit: { height: 26, justifyContent: "center", marginTop: 4 },
  sliderTrack: { height: 6, borderRadius: 3, backgroundColor: C.border, overflow: "hidden" },
  sliderKnob: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 3,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.cardEl,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    alignItems: "center",
  },
  advisory: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    borderLeftColor: C.txt,
  },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 32, paddingHorizontal: 16 },
}));

export const ui = s;
