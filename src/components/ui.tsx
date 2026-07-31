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
import { C, alpha, FONT, MONO, RADIUS } from "../theme/tokens";

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
        <Txt size={14} weight="600" color={C.txt}>
          {title}
        </Txt>
        {!!subtitle && (
          <Txt size={11} color={C.muted} style={{ marginTop: 2 }}>
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
  critical: C.danger,
  high: "#FB923C",
  medium: C.warning,
  low: C.success,
  online: C.success,
  ready: C.success,
  degraded: C.warning,
  stale: C.warning,
  idle: C.muted,
  offline: C.danger,
  impassable: C.critical,
  restricted: C.warning,
  passable: C.success,
  approval: C.blue,
  change: C.ai,
  update: C.gis,
  system: C.muted,
  auth: "#34D399",
  export: "#818CF8",
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
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const col = BADGE_COLORS[status] ?? C.muted;
  return (
    <View
      style={[
        s.badge,
        { backgroundColor: alpha(col, 0.15), borderColor: alpha(col, 0.35) },
      ]}
    >
      <Txt size={9} weight="700" color={col} upper>
        {label ?? BADGE_LABEL[status] ?? status}
      </Txt>
    </View>
  );
}

/**
 * İzlenebilirlik rozeti — CON-008 / QLT-006.
 * Her ekran ve YZ çıktısı, gerçeklediği SRS ürün fonksiyonunu görünür kılar.
 */
export function PFBadge({ id, color = C.blue }: { id: string; color?: string }) {
  return (
    <View
      style={[
        s.pfBadge,
        { backgroundColor: alpha(color, 0.14), borderColor: alpha(color, 0.4) },
      ]}
    >
      <Txt size={9} weight="700" color={color} mono>
        {id}
      </Txt>
    </View>
  );
}

export function PFBadgeRow({ ids, color }: { ids: string[]; color?: string }) {
  if (!ids.length) return null;
  return (
    <View style={s.pfRow}>
      {ids.map((id) => (
        <PFBadge key={id} id={id} color={color} />
      ))}
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
        <Txt size={9} weight="600" color={C.muted} upper style={{ flex: 1 }} numberOfLines={2}>
          {label}
        </Txt>
        <View style={[s.kpiIcon, { backgroundColor: alpha(color, 0.14) }]}>
          <Feather name={icon} size={13} color={color} />
        </View>
      </View>
      <Txt size={22} weight="700" color={C.txt} mono style={{ marginTop: 6 }}>
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
            <Txt size={11} weight="600" color={trend >= 0 ? C.danger : C.success}>
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
  height = 6,
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
  const base = color ?? C.blue;
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        small && { paddingVertical: 6, paddingHorizontal: 10 },
        isPrimary
          ? { backgroundColor: base }
          : { borderWidth: 1, borderColor: variant === "outline" ? alpha(base, 0.5) : C.border },
        (disabled || pressed) && { opacity: disabled ? 0.5 : 0.75 },
        style,
      ]}
    >
      {!!icon && <Feather name={icon} size={small ? 11 : 13} color={isPrimary ? "#fff" : base} />}
      <Txt size={small ? 11 : 12} weight="700" color={isPrimary ? "#fff" : base}>
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
      style={[s.toggle, { backgroundColor: value ? C.blue : C.border }]}
    >
      <View style={[s.toggleKnob, { left: value ? 22 : 2 }]} />
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
  return (
    <Pressable onPress={() => onChange(!checked)} style={s.checkRow}>
      <View
        style={[
          s.checkbox,
          { borderColor: color, backgroundColor: checked ? color : "transparent" },
        ]}
      >
        {checked && <Feather name="check" size={9} color="#fff" />}
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

/** Ekran başlığı + SRS izlenebilirlik şeridi. */
export function ScreenHeader({
  title,
  subtitle,
  pfs,
  note,
}: {
  title: string;
  subtitle?: string;
  pfs: string[];
  note?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Txt size={17} weight="700" color={C.txt}>
        {title}
      </Txt>
      {!!subtitle && (
        <Txt size={12} color={C.muted} style={{ marginTop: 3 }}>
          {subtitle}
        </Txt>
      )}
      <View style={[s.pfRow, { marginTop: 8 }]}>
        <Txt size={9} weight="700" color={C.muted} upper>
          SRS
        </Txt>
        {pfs.map((id) => (
          <PFBadge key={id} id={id} />
        ))}
      </View>
      {!!note && (
        <Txt size={10} color={C.muted} style={{ marginTop: 6, fontStyle: "italic" }}>
          {note}
        </Txt>
      )}
    </View>
  );
}

/** SEC-008 / CON-007 uyarı şeridi — YZ çıktılarının tavsiye niteliğini bildirir. */
export function AdvisoryNotice({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[s.advisory, compact && { paddingVertical: 6 }]}>
      <Feather name="alert-triangle" size={12} color={C.warning} />
      <Txt size={10} color={C.warning} weight="600" style={{ flex: 1 }}>
        SEC-008 / CON-007 — YZ çıktıları yalnızca tavsiye niteliğindedir. Operasyonel eylem öncesi insan onayı
        zorunludur.
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

const s = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.lg,
  },
  kpi: { padding: 12 },
  kpiIcon: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  pfBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  pfRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, alignItems: "center" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
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
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    alignItems: "center",
  },
  advisory: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: alpha(C.warning, 0.1),
    borderWidth: 1,
    borderColor: alpha(C.warning, 0.3),
  },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 32, paddingHorizontal: 16 },
});

export const ui = s;
