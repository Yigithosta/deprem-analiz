import React, { useState } from "react";
import { View, Pressable, StyleSheet, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, FONT, RADIUS, themed } from "../theme/tokens";
import { Txt, Row, StatusBadge, Tag, Divider, Btn, Notice } from "./ui";
import type { Recommendation } from "../api/types";
import { errorMessage } from "../api/client";
import { can } from "../auth/roles";
import { useApp } from "../state/AppState";

/**
 * YZ karar destek kartı.
 *
 * Kart her öneriyi gerekçesi, güven skoru, model sürümü ve onu üreten girdi
 * verileriyle birlikte gösterir. Öneri tavsiye niteliğindedir: yetkili karar
 * verici onaylamadan hiçbir operasyonel eylem başlamaz. Karar verici öneriyi
 * onaylayabilir, gerekçe yazarak reddedebilir ya da güncel veriyle yeniden
 * hesaplatabilir; her karar sunucu tarafında denetim kaydına yazılır.
 */
export function AIRecCard({
  rec,
  expanded,
  onToggle,
}: {
  rec: Recommendation;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { role, decide, recompute } = useApp();
  const canDecide = can(role, "recommendations.decide");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setRejecting(false);
      setReason("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const pending = rec.status === "pending";

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
            {!pending && <StatusBadge status={rec.status} />}
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
              Girdi Verileri
            </Txt>
            <Row gap={4} wrap style={{ marginTop: 5 }}>
              {rec.inputs.map((f) => (
                <Tag key={f} label={f} color={C.gis} />
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

          {rec.decision && (
            <Notice
              tone={rec.decision.status === "approved" ? "success" : "error"}
              text={
                rec.decision.status === "approved"
                  ? `${rec.decision.by} tarafından ${rec.decision.at} saatinde onaylandı.`
                  : `${rec.decision.by} tarafından ${rec.decision.at} saatinde reddedildi.${
                      rec.decision.reason ? ` Gerekçe: ${rec.decision.reason}` : ""
                    }`
              }
              style={{ marginBottom: 10 }}
            />
          )}

          {rec.status === "recomputing" && (
            <Notice tone="info" text="Öneri güncel veriyle yeniden hesaplanıyor…" style={{ marginBottom: 10 }} />
          )}

          {pending && canDecide && !rejecting && (
            <Row gap={6} wrap>
              <Btn
                label="Onayla"
                icon="check"
                small
                disabled={busy}
                onPress={() => run(() => decide(rec.id, "approved"))}
                style={{ flexGrow: 1 }}
              />
              <Btn
                label="Reddet"
                icon="x"
                small
                variant="outline"
                color={C.danger}
                disabled={busy}
                onPress={() => setRejecting(true)}
                style={{ flexGrow: 1 }}
              />
              <Btn
                label="Yeniden Hesapla"
                icon="refresh-cw"
                small
                variant="outline"
                color={C.ai}
                disabled={busy}
                onPress={() => run(() => recompute(rec.id))}
                style={{ flexGrow: 1 }}
              />
            </Row>
          )}

          {pending && canDecide && rejecting && (
            <View>
              <Txt size={10.5} weight="600" color={C.txt2} style={{ marginBottom: 6 }}>
                Ret gerekçesi
              </Txt>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Kararınızın nedenini yazın (denetim kaydına işlenir)"
                placeholderTextColor={C.muted}
                multiline
                style={s.input}
              />
              <Row gap={6} style={{ marginTop: 8 }}>
                <Btn
                  label="Reddi Kaydet"
                  icon="x"
                  small
                  color={C.danger}
                  disabled={busy || !reason.trim()}
                  onPress={() => run(() => decide(rec.id, "rejected", reason))}
                  style={{ flex: 1 }}
                />
                <Btn label="Vazgeç" small variant="ghost" color={C.muted} onPress={() => setRejecting(false)} style={{ flex: 1 }} />
              </Row>
            </View>
          )}

          {pending && !canDecide && (
            <View style={s.advisory}>
              <Feather name="info" size={13} color={C.txt2} />
              <Txt size={11} color={C.txt2} style={{ flex: 1 }}>
                Tavsiye niteliğindedir. Onay veya ret kararını Sistem Yöneticisi & Karar Verici rolü verir.
              </Txt>
            </View>
          )}

          {!!error && <Notice tone="error" text={error} style={{ marginTop: 8 }} />}

          <Txt size={9} color={C.muted} style={{ marginTop: 9 }}>
            Model: {rec.model} · Alan: {rec.area}
          </Txt>
        </View>
      )}
    </View>
  );
}

const s = themed(() => StyleSheet.create({
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
    backgroundColor: C.cardEl,
    borderColor: C.border,
  },
  input: {
    backgroundColor: C.cardEl,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: C.txt,
    fontSize: 12,
    fontFamily: FONT,
    minHeight: 54,
    textAlignVertical: "top",
  },
}));
