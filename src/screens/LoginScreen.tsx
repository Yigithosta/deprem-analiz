import React, { useState } from "react";
import { View, ScrollView, StyleSheet, TextInput, Pressable, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, FONT, RADIUS, themed } from "../theme/tokens";
import { Txt, Row, Btn, Card, Checkbox, Notice } from "../components/ui";
import { ROLES, type Role } from "../auth/roles";
import { useApp } from "../state/AppState";
import { errorMessage } from "../api/client";
import { API_MODE } from "../api/config";

/**
 * Sisteme giriş.
 * Kurum seçimi → kimlik bilgileri → çok faktörlü doğrulama. Sunucu başarılı
 * girişte erişim ve yenileme token'ı döndürür; kurum seçimi, oturumun hangi
 * rol ve izinlerle açılacağını belirler.
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
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState("TR");

  function pickRole(r: Role) {
    setSelected(r);
    setEmail(r.demoUser.email);
    setPassword("••••••••••••");
    setError(null);
    setStep("credentials");
  }

  function submitCredentials() {
    setError(null);
    if (!email.trim() || !password) {
      setError("E-posta ve şifre zorunludur.");
      return;
    }
    setOtp("");
    setStep("mfa");
  }

  async function confirmMfa() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      await login(selected, { email: email.trim(), password, otp });
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={[s.scroll, wide && { paddingVertical: 40 }]}>
        <View style={{ width: "100%", maxWidth: step === "role" ? 900 : 460 }}>
          {/* Kısıtlı erişim şeridi */}
          <View style={s.restricted}>
            <Feather name="lock" size={11} color={C.txt2} />
            <Txt size={10} weight="600" color={C.txt2} upper>
              Sadece Yetkili Erişim — Kısıtlı Sistem
            </Txt>
          </View>

          <Card style={{ padding: wide ? 28 : 20 }}>
            {/* Logo */}
            <View style={{ alignItems: "center", marginBottom: 22 }}>
              <View style={s.logo}>
                <Feather name="shield" size={24} color={C.onPrimary} />
              </View>
              <Txt size={22} weight="700" color={C.txt} style={{ marginTop: 12, letterSpacing: 2 }}>
                MEDAIGENCY
              </Txt>
              <Txt size={10} weight="600" color={C.muted} upper style={{ marginTop: 4, textAlign: "center" }}>
                LOT C — Bütünleşik YZ Destekli Afet Dayanıklılık Ekosistemi
              </Txt>
            </View>

            {/* ── ADIM 1: ROL SEÇİMİ ── */}
            {step === "role" && (
              <View>
                <Txt size={13} weight="600" color={C.txt}>
                  Kurum / Aktör Seçimi
                </Txt>
                <Txt size={11} color={C.muted} style={{ marginTop: 3, marginBottom: 14 }}>
                  Kurumunuzu seçerek oturum açın. Erişiminiz, en az yetki ilkesi uyarınca yalnızca rolünüze
                  tanımlı işlemlerle sınırlandırılır.
                </Txt>
                <View style={[s.roleGrid, !wide && { flexDirection: "column" }]}>
                  {ROLES.map((r) => (
                    <Pressable
                      key={r.id}
                      onPress={() => pickRole(r)}
                      style={({ pressed }) => [
                        s.roleCard,
                        wide ? { flexBasis: "31%", flexGrow: 1 } : { minWidth: 0 },
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
                          {r.permissions.length} yetki
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
                {!!error && <Notice tone="error" text={error} style={{ marginTop: 10 }} />}
                <Txt size={9} color={C.muted} style={{ marginTop: 10, textAlign: "center" }}>
                  Bağlantı TLS ile şifrelenir · Oturum JWT erişim token'ı ile yönetilir
                </Txt>
              </View>
            )}

            {/* ── ADIM 3: ÇOK FAKTÖRLÜ DOĞRULAMA ── */}
            {step === "mfa" && selected && (
              <View style={{ alignItems: "center" }}>
                <View style={[s.mfaIcon, { backgroundColor: alpha(C.ai, 0.16) }]}>
                  <Feather name="smartphone" size={24} color={C.txt} />
                </View>
                <Txt size={14} weight="600" color={C.txt} style={{ marginTop: 14 }}>
                  İki Faktörlü Doğrulama
                </Txt>
                <Txt size={11} color={C.muted} style={{ marginTop: 8, textAlign: "center", lineHeight: 17 }}>
                  {selected.demoUser.name} · {selected.demoUser.title}{"\n"}
                  Doğrulama uygulamanızdaki 6 haneli kodu girin.
                </Txt>
                <TextInput
                  value={otp}
                  onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor={C.muted}
                  style={[s.input, s.otp]}
                />
                {API_MODE === "mock" && (
                  <Txt size={9.5} color={C.muted} style={{ marginTop: 6, textAlign: "center" }}>
                    Demo ortamı: herhangi bir 6 haneli kod kabul edilir.
                  </Txt>
                )}
                {!!error && <Notice tone="error" text={error} style={{ marginTop: 10, alignSelf: "stretch" }} />}
                <Btn
                  label={loading ? "Giriş yapılıyor…" : "Onayla ve Sisteme Gir"}
                  icon={loading ? "loader" : "shield"}
                  onPress={confirmMfa}
                  disabled={loading || otp.length !== 6}
                  style={{ marginTop: 16, alignSelf: "stretch", paddingVertical: 13 }}
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

const s = themed(() => StyleSheet.create({
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
    borderColor: C.borderStrong,
    backgroundColor: C.card,
    marginBottom: 18,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
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
  otp: { marginTop: 16, alignSelf: "stretch", textAlign: "center", fontSize: 20, letterSpacing: 8 },
  mfaIcon: { width: 50, height: 50, borderRadius: RADIUS.lg, alignItems: "center", justifyContent: "center" },
  lang: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
}));
