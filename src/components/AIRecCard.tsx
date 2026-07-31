import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, RADIUS } from "../theme/tokens";
import { Txt, Row, StatusBadge, PFBadge, Divider } from "./ui";
import type { AIRecommendation } from "../data/mock";

/**
 * YZ karar destek kartı.
 *
 * SRS gereği kart üç şeyi aynı anda göstermek zorundadır:
 *  • CON-007 / SEC-008 — öneri tavsiye niteliğindedir; konsol salt-okunurdur,
 *    onay/ret kararı sistem dışında yetkili personelce verilir.
 *  • CON-008 / QLT-006 — öneriyi üreten girdi verisi ve ürün fonksiyonları
 *    (kanıt kaynakları + PF rozetleri) izlenebilir olmalıdır.
 *  • Model sürümü ve güven skoru her çıktıda belirtilmelidir.
 */
export function AIRecCard({
  rec,
  expanded,
  onToggle,
}: {
  rec: AIRecommendation;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[s.card, expanded && { borderColor: alpha(C.ai, 0.45) }]}>
      <Pressable onPress={onToggle} style={s.head}>
        <View style={[s.icon, { backgroundColor: alpha(C.ai, 0.15) }]}>
          <Feather name="cpu" size={13} color={C.ai} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Row gap={6} wrap>
            <Txt size={12} weight="600" color={C.txt} style={{ flexShrink: 1 }}>
              {rec.title}
            </Txt>
            <StatusBadge status={rec.sev} />
            <View style={[s.conf, { backgroundColor: alpha(C.ai, 0.15) }]}>
              <Txt size={9.5} weight="600" color={C.ai} mono>
                %{rec.conf} güven
              </Txt>
            </View>
          </Row>
          <Txt size={11} color={C.muted} style={{ marginTop: 3 }}>
            {rec.impact}
          </Txt>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={14} color={C.muted} />
      </Pressable>

      {expanded && (
        <View style={s.body}>
          <View style={s.block}>
            <Txt size={9} weight="700" color={C.muted} upper>
              Önerilen Eylem
            </Txt>
            <Txt size={12} color={C.txt} style={{ marginTop: 4 }}>
              {rec.action}
            </Txt>
          </View>

          <View style={{ marginTop: 10 }}>
            <Txt size={9} weight="700" color={C.muted} upper>
              Kanıt Kaynakları
            </Txt>
            {rec.evidence.map((e) => (
              <Row key={e} gap={6} style={{ marginTop: 5, alignItems: "flex-start" }}>
                <Feather name="check-circle" size={10} color={C.success} style={{ marginTop: 2 }} />
                <Txt size={11} color={C.txt2} style={{ flex: 1 }}>
                  {e}
                </Txt>
              </Row>
            ))}
          </View>

          <View style={{ marginTop: 10 }}>
            <Txt size={9} weight="700" color={C.muted} upper>
              Girdi Fonksiyonları (CON-008 izlenebilirlik)
            </Txt>
            <Row gap={4} wrap style={{ marginTop: 5 }}>
              {rec.sourceFunctions.map((f) => (
                <PFBadge key={f} id={f} color={C.gis} />
              ))}
            </Row>
          </View>

          <View style={{ marginTop: 10 }}>
            <Txt size={9} weight="700" color={C.muted} upper>
              YZ Gerekçesi
            </Txt>
            <Txt size={11} color={C.txt2} style={{ marginTop: 4, lineHeight: 16 }}>
              {rec.reasoning}
            </Txt>
          </View>

          <Divider style={{ marginVertical: 11 }} />

          {/* Salt-okunur konsol: karar burada verilmez, yalnızca gerekçesiyle
              birlikte gösterilir (CON-007 / SEC-008). */}
          <View style={s.advisory}>
            <Feather name="info" size={13} color={C.warning} />
            <Txt size={10.5} color={C.warning} style={{ flex: 1 }}>
              Tavsiye niteliğindedir. Bu konsol yalnızca bilgi sunar; onay veya ret kararı
              yetkili personel tarafından sistem dışında verilir (CON-007 / SEC-008).
            </Txt>
          </View>

          <Txt size={9} color={C.muted} style={{ marginTop: 9 }}>
            Model: {rec.model} · Alan: {rec.area}
          </Txt>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.lg,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12 },
  icon: { width: 27, height: 27, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  conf: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  body: { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 11 },
  block: { backgroundColor: C.cardEl, borderRadius: RADIUS.md, padding: 10 },
  advisory: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    backgroundColor: alpha(C.warning, 0.1),
    borderColor: alpha(C.warning, 0.3),
  },
});
