import React, { useState } from "react";
import { View, ScrollView, StyleSheet, TextInput, Pressable, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, FONT, RADIUS } from "../theme/tokens";
import { Txt, Row, Btn, Card, PFBadge, Checkbox } from "../components/ui";
import { ROLES, type Role } from "../auth/roles";
import { useApp } from "../state/AppState";

/**
 * PF-SYS01 — Sisteme giriş.
 * SEC-001 (kimlik doğrulama + RBAC), SEC-003 (JWT erişim token'ı),
 * SEC-009 (en az yetki). Rol seçimi, kullanıcının SRS §2.3'teki hangi aktör
 * olarak oturum açtığını belirler ve menü yetkilendirmesini sürer.
 */
export function LoginScreen() {
  const { login } = useApp();
  const { width } = useWindowDimensions();
  const wide = width >= 860;

  const [step, setStep] = useState<"role" | "credentials" | "mfa">("role");
  const [selected, setSelected] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState("TR");

  function pickRole(r: Role) {
    setSelected(r);
    setEmail(r.demoUser.email);
    setPassword("••••••••••••");
    setStep("credentials");
  }

  function submitCredentials() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("mfa");
    }, 700);
  }

  function confirmMfa() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (selected) login(selected);
    }, 600);
  }

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={[s.scroll, wide && { paddingVertical: 40 }]}>
        <View style={{ width: "100%", maxWidth: step === "role" ? 900 : 460 }}>
          {/* Kısıtlı erişim şeridi */}
          <View style={s.restricted}>
            <Feather name="lock" size={11} color={C.danger} />
            <Txt size={10} weight="700" color={C.danger} upper>
              Sadece Yetkili Erişim — Kısıtlı Sistem
            </Txt>
          </View>

          <Card style={{ padding: wide ? 28 : 20 }}>
            {/* Logo */}
            <View style={{ alignItems: "center", marginBottom: 22 }}>
              <View style={s.logo}>
                <Feather name="shield" size={24} color="#fff" />
              </View>
              <Txt size={22} weight="700" color={C.txt} style={{ marginTop: 10 }}>
                MEDAIGENCY
              </Txt>
              <Txt size={10} weight="600" color={C.muted} upper style={{ marginTop: 4, textAlign: "center" }}>
                LOT C — Bütünleşik YZ Destekli Afet Dayanıklılık Ekosistemi
              </Txt>
              <Row gap={5} style={{ marginTop: 8 }}>
                <PFBadge id="PF-SYS01" />
                <PFBadge id="SEC-001" color={C.gis} />
                <PFBadge id="SEC-009" color={C.gis} />
              </Row>
            </View>

            {/* ── ADIM 1: ROL SEÇİMİ ── */}
            {step === "role" && (
              <View>
                <Txt size={13} weight="600" color={C.txt}>
                  Kurum / Aktör Seçimi
                </Txt>
                <Txt size={11} color={C.muted} style={{ marginTop: 3, marginBottom: 14 }}>
                  SRS §2.3'te tanımlı beş aktörden biriyle oturum açın. Erişiminiz, en az yetki ilkesi uyarınca
                  yalnızca rolünüze atanmış ürün fonksiyonlarıyla sınırlandırılır.
                </Txt>
                <View style={[s.roleGrid, !wide && { flexDirection: "column" }]}>
                  {ROLES.map((r) => (
                    <Pressable
                      key={r.id}
                      onPress={() => pickRole(r)}
                      style={({ pressed }) => [
                        s.roleCard,
                        wide && { flexBasis: "31%", flexGrow: 1 },
                        { borderColor: alpha(r.color, 0.35) },
                        pressed && { borderColor: r.color, backgroundColor: alpha(r.color, 0.07) },
                      ]}
                    >
                      <Row gap={9}>
                        <View style={[s.roleIcon, { backgroundColor: alpha(r.color, 0.16) }]}>
                          <Feather
                            name={r.category === "İnsan Kullanıcı" ? "user" : "server"}
                            size={14}
                            color={r.color}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Txt size={12} weight="700" color={C.txt}>
                            {r.name}
                          </Txt>
                          <Txt size={9} color={C.muted} upper>
                            {r.category}
                          </Txt>
                        </View>
                      </Row>
                      <Txt size={10} color={C.muted} numberOfLines={3} style={{ marginTop: 8, lineHeight: 14 }}>
                        {r.desc}
                      </Txt>
                      <View style={s.roleFooter}>
                        <Txt size={9} color={C.txt2} mono>
                          {r.gateway}
                        </Txt>
                        <Txt size={9} weight="700" color={r.color} mono>
                          {r.functions.length} PF
                        </Txt>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* ── ADIM 2: KİMLİK BİLGİLERİ ── */}
            {step === "credentials" && selected && (
              <View>
                <Row gap={8} style={s.selectedRole}>
                  <View style={[s.dot, { backgroundColor: selected.color }]} />
                  <Txt size={11} weight="700" color={C.txt} style={{ flex: 1 }}>
                    {selected.name}
                  </Txt>
                  <Pressable onPress={() => setStep("role")}>
                    <Txt size={10} color={C.blue} weight="600">
                      Değiştir
                    </Txt>
                  </Pressable>
                </Row>

                <Txt size={11} weight="500" color={C.txt2} style={{ marginBottom: 6 }}>
                  Kurumsal E-posta
                </Txt>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="kullanici@afad.gov.tr"
                  placeholderTextColor={C.muted}
                  style={s.input}
                />

                <Txt size={11} weight="500" color={C.txt2} style={{ marginTop: 14, marginBottom: 6 }}>
                  Şifre
                </Txt>
                <View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPw}
                    placeholder="••••••••••••"
                    placeholderTextColor={C.muted}
                    style={[s.input, { paddingRight: 40 }]}
                  />
                  <Pressable onPress={() => setShowPw(!showPw)} style={s.eye}>
                    <Feather name={showPw ? "eye-off" : "eye"} size={15} color={C.muted} />
                  </Pressable>
                </View>

                <Row style={{ justifyContent: "space-between", marginTop: 14 }}>
                  <Checkbox checked={remember} onChange={setRemember} label="Bu cihazı hatırla" />
                  <Txt size={11} color={C.blue}>
                    Şifremi unuttum
                  </Txt>
                </Row>

                <Btn
                  label={loading ? "Doğrulanıyor…" : "Güvenli Giriş Yap"}
                  icon={loading ? "loader" : "lock"}
                  onPress={submitCredentials}
                  disabled={loading}
                  style={{ marginTop: 18, paddingVertical: 13 }}
                />
                <Txt size={9} color={C.muted} style={{ marginTop: 10, textAlign: "center" }}>
                  SEC-004 — Bağlantı TLS ile şifrelenmiştir · SEC-003 — Oturum JWT ile yönetilir
                </Txt>
              </View>
            )}

            {/* ── ADIM 3: ÇOK FAKTÖRLÜ DOĞRULAMA ── */}
            {step === "mfa" && selected && (
              <View style={{ alignItems: "center" }}>
                <View style={[s.mfaIcon, { backgroundColor: alpha(C.ai, 0.16) }]}>
                  <Feather name="smartphone" size={26} color={C.ai} />
                </View>
                <Txt size={14} weight="600" color={C.txt} style={{ marginTop: 14 }}>
                  İki Faktörlü Doğrulama
                </Txt>
                <Txt size={11} color={C.muted} style={{ marginTop: 8, textAlign: "center", lineHeight: 17 }}>
                  {selected.demoUser.name} · {selected.demoUser.title}{"\n"}
                  Kimliğiniz {selected.gateway} üzerinden tanındı. Onaylayın.
                </Txt>
                <Btn
                  label={loading ? "Giriş yapılıyor…" : "Onayla ve Sisteme Gir"}
                  icon={loading ? "loader" : "shield"}
                  color={C.ai}
                  onPress={confirmMfa}
                  disabled={loading}
                  style={{ marginTop: 20, alignSelf: "stretch", paddingVertical: 13 }}
                />
                <Pressable onPress={() => setStep("credentials")} style={{ marginTop: 12 }}>
                  <Txt size={11} color={C.muted}>
                    Geri dön
                  </Txt>
                </Pressable>
              </View>
            )}
          </Card>

          <Row style={{ justifyContent: "space-between", marginTop: 14, paddingHorizontal: 4 }}>
            <Row gap={4}>
              {["TR", "EN", "DE", "FR"].map((l) => (
                <Pressable
                  key={l}
                  onPress={() => setLang(l)}
                  style={[s.lang, l === lang && { backgroundColor: C.cardEl }]}
                >
                  <Txt size={10} weight="600" color={l === lang ? C.txt : C.muted}>
                    {l}
                  </Txt>
                </Pressable>
              ))}
            </Row>
            <Txt size={9} color={C.muted}>
              © 2026 MEDAIGENCY — LOT C · v1.0
            </Txt>
          </Row>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 16, paddingVertical: 28 },
  restricted: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: alpha(C.danger, 0.35),
    backgroundColor: alpha(C.danger, 0.09),
    marginBottom: 18,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.blue,
  },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  roleCard: {
    padding: 13,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    backgroundColor: C.cardEl,
    minWidth: 220,
  },
  roleIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  roleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  selectedRole: {
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: C.cardEl,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  input: {
    backgroundColor: C.cardEl,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: C.txt,
    fontSize: 13,
    fontFamily: FONT,
  },
  eye: { position: "absolute", right: 12, top: 12 },
  mfaIcon: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  lang: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
});
