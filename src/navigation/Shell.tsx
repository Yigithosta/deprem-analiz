import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Pressable, useWindowDimensions, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, RADIUS } from "../theme/tokens";
import { Txt, Row } from "../components/ui";
import { NAV_GROUPS, NAV_ITEMS, NAV_BY_ID, type ScreenId } from "./registry";
import { canAccess } from "../auth/roles";
import { useApp } from "../state/AppState";

const SIDEBAR_W = 224;

export function Shell({
  screen,
  onNavigate,
  children,
}: {
  screen: ScreenId;
  onNavigate: (s: ScreenId) => void;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (wide) setDrawer(false);
  }, [wide]);

  return (
    <View style={s.root}>
      {wide && <SidebarContent screen={screen} onNavigate={onNavigate} />}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Topbar screen={screen} onMenu={() => setDrawer(true)} showMenu={!wide} onNavigate={onNavigate} />
        <View style={{ flex: 1 }}>{children}</View>
      </View>

      {!wide && (
        <Modal visible={drawer} transparent animationType="fade" onRequestClose={() => setDrawer(false)}>
          <View style={s.drawerRoot}>
            <SidebarContent
              screen={screen}
              onNavigate={(id) => {
                onNavigate(id);
                setDrawer(false);
              }}
              onClose={() => setDrawer(false)}
            />
            <Pressable style={s.backdrop} onPress={() => setDrawer(false)} />
          </View>
        </Modal>
      )}
    </View>
  );
}

/* ────────────────────────── Kenar çubuğu ────────────────────────── */

function SidebarContent({
  screen,
  onNavigate,
  onClose,
}: {
  screen: ScreenId;
  onNavigate: (s: ScreenId) => void;
  onClose?: () => void;
}) {
  const { role, logout } = useApp();
  if (!role) return null;

  // SEC-009 — menü, rolün erişebildiği ekranlarla sınırlıdır.
  const visible = NAV_ITEMS.filter(
    (n) => (!n.adminOnly || role.id === "ADMIN") && canAccess(role, n.pfs)
  );

  return (
    <View style={s.sidebar}>
      <Row gap={9} style={s.brand}>
        <View style={s.brandLogo}>
          <Feather name="shield" size={15} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Txt size={13} weight="700" color={C.txt}>
            MEDAIGENCY
          </Txt>
          <Txt size={8} weight="600" color={C.muted} upper>
            LOT C · SRS v1.0
          </Txt>
        </View>
        {!!onClose && (
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={16} color={C.muted} />
          </Pressable>
        )}
      </Row>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 8 }}>
        {NAV_GROUPS.map((group) => {
          const items = visible.filter((n) => n.group === group);
          if (!items.length) return null;
          return (
            <View key={group} style={{ marginBottom: 12 }}>
              <Txt size={8.5} weight="700" color={C.muted} upper style={{ paddingHorizontal: 8, marginBottom: 5 }}>
                {group}
              </Txt>
              {items.map((item) => {
                const active = screen === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onNavigate(item.id)}
                    style={({ pressed }) => [
                      s.navItem,
                      active && { backgroundColor: alpha(C.blue, 0.14), borderLeftColor: C.blue },
                      pressed && !active && { backgroundColor: C.cardEl },
                    ]}
                  >
                    <Feather name={item.icon} size={13} color={active ? C.blue : C.muted} />
                    <Txt size={11.5} weight={active ? "600" : "400"} color={active ? C.blue : C.txt2} numberOfLines={1} style={{ flex: 1 }}>
                      {item.label}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* Oturum kartı */}
      <View style={s.sessionWrap}>
        <Row gap={9} style={s.session}>
          <View style={[s.avatar, { backgroundColor: role.color }]}>
            <Txt size={10} weight="700" color="#fff">
              {role.demoUser.initials}
            </Txt>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt size={11} weight="600" color={C.txt} numberOfLines={1}>
              {role.demoUser.name}
            </Txt>
            <Txt size={9} color={C.muted} numberOfLines={1}>
              {role.short} · {role.demoUser.title}
            </Txt>
          </View>
          <Pressable onPress={logout} hitSlop={8}>
            <Feather name="log-out" size={14} color={C.muted} />
          </Pressable>
        </Row>
      </View>
    </View>
  );
}

/* ────────────────────────── Üst durum çubuğu ────────────────────────── */

/** SRS §3.1.1 — "kalıcı durum çubuğu: YZ etkinliği, simülasyon hazırlığı, sistem saati". */
function Topbar({
  screen,
  onMenu,
  showMenu,
  onNavigate,
}: {
  screen: ScreenId;
  onMenu: () => void;
  showMenu: boolean;
  onNavigate: (s: ScreenId) => void;
}) {
  const { unreadCount, role } = useApp();
  const { width } = useWindowDimensions();
  const [time, setTime] = useState(new Date());
  const item = NAV_BY_ID[screen];

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const showStatus = width >= 760;

  return (
    <View style={s.topbar}>
      {showMenu && (
        <Pressable onPress={onMenu} hitSlop={8} style={{ marginRight: 4 }}>
          <Feather name="menu" size={19} color={C.txt} />
        </Pressable>
      )}
      <Row gap={7} style={{ flex: 1, minWidth: 0 }}>
        <Feather name={item.icon} size={14} color={C.muted} />
        <Txt size={13} weight="600" color={C.txt} numberOfLines={1}>
          {item.label}
        </Txt>
      </Row>

      {showStatus && (
        <Row gap={8}>
          <View style={[s.chip, { backgroundColor: alpha(C.success, 0.13) }]}>
            <View style={[s.dot, { backgroundColor: C.success }]} />
            <Txt size={9} weight="700" color={C.success}>
              YZ AKTİF
            </Txt>
          </View>
          <View style={[s.chip, { backgroundColor: alpha(C.ai, 0.13) }]}>
            <Feather name="cpu" size={9} color={C.ai} />
            <Txt size={9} weight="700" color={C.ai}>
              SİMÜLASYON HAZIR
            </Txt>
          </View>
          {!!role && (
            <View style={[s.chip, { backgroundColor: alpha(role.color, 0.13) }]}>
              <Feather name="shield" size={9} color={role.color} />
              <Txt size={9} weight="700" color={role.color}>
                {role.short.toUpperCase()}
              </Txt>
            </View>
          )}
          <View style={[s.chip, { backgroundColor: C.cardEl, borderWidth: 1, borderColor: C.border }]}>
            <View style={[s.dot, { backgroundColor: C.success }]} />
            <Txt size={10} weight="600" color={C.txt} mono>
              {time.toLocaleTimeString("tr-TR")}
            </Txt>
            <Txt size={9} color={C.muted}>
              UTC+3
            </Txt>
          </View>
        </Row>
      )}

      <Pressable onPress={() => onNavigate("notifications")} hitSlop={8} style={{ marginLeft: 10 }}>
        <Feather name="bell" size={16} color={C.muted} />
        {unreadCount > 0 && (
          <View style={s.badgeDot}>
            <Txt size={8} weight="700" color="#fff">
              {unreadCount}
            </Txt>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: C.bg },
  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: C.sidebar,
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  brand: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brandLogo: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: C.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 8,
    paddingHorizontal: 9,
    borderRadius: RADIUS.md,
    borderLeftWidth: 2,
    borderLeftColor: "transparent",
    marginBottom: 2,
  },
  sessionWrap: { padding: 10, borderTopWidth: 1, borderTopColor: C.border },
  session: { backgroundColor: C.cardEl, borderRadius: RADIUS.md, padding: 9 },
  avatar: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  topbar: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 8,
    backgroundColor: C.sidebar,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeDot: {
    position: "absolute",
    top: -5,
    right: -7,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: C.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerRoot: { flex: 1, flexDirection: "row" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
});
