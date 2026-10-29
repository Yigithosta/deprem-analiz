import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Pressable, useWindowDimensions, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { C, alpha, RADIUS, themed } from "../theme/tokens";
import { Txt, Row } from "../components/ui";
import { NAV_GROUPS, NAV_ITEMS, NAV_BY_ID, type ScreenId } from "./registry";
import { canAccess } from "../auth/roles";
import { useApp } from "../state/AppState";
import { API_MODE } from "../api/config";

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

  // Menü, rolün erişebildiği ekranlarla sınırlıdır (en az yetki).
  const visible = NAV_ITEMS.filter(
    (n) => (!n.adminOnly || role.id === "ADMIN") && canAccess(role, n.requires)
  );

  return (
    <View style={s.sidebar}>
      <Row gap={9} style={s.brand}>
        <View style={s.brandLogo}>
          <Feather name="shield" size={15} color={C.sidebar} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt size={13} weight="700" color={C.onDark} style={{ letterSpacing: 1.2 }}>
            MEDAIGENCY
          </Txt>
          <Txt size={9} weight="500" color={C.onDarkMuted}>
            Operasyon Konsolu
          </Txt>
        </View>
        {!!onClose && (
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Menüyü kapat">
            <Feather name="x" size={16} color={C.onDarkMuted} />
          </Pressable>
        )}
      </Row>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 8 }}>
        {NAV_GROUPS.map((group) => {
          const items = visible.filter((n) => n.group === group);
          if (!items.length) return null;
          return (
            <View key={group} style={{ marginBottom: 12 }}>
              <Txt size={9} weight="600" color={C.onDarkMuted} upper style={{ paddingHorizontal: 10, marginBottom: 6 }}>
                {group}
              </Txt>
              {items.map((item) => {
                const active = screen === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onNavigate(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => [
                      s.navItem,
                      active && { backgroundColor: C.onDark },
                      pressed && !active && { backgroundColor: C.sidebarEl },
                    ]}
                  >
                    <Feather name={item.icon} size={14} color={active ? C.sidebar : C.onDarkMuted} />
                    <Txt size={12} weight={active ? "600" : "400"} color={active ? C.sidebar : C.onDark} numberOfLines={1} style={{ flex: 1 }}>
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
          <View style={s.avatar}>
            <Txt size={10} weight="700" color={C.sidebar}>
              {role.demoUser.initials}
            </Txt>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt size={11.5} weight="600" color={C.onDark} numberOfLines={1}>
              {role.demoUser.name}
            </Txt>
            <Txt size={9.5} color={C.onDarkMuted} numberOfLines={1}>
              {role.short} · {role.demoUser.title}
            </Txt>
          </View>
          <Pressable onPress={logout} hitSlop={10} accessibilityRole="button" accessibilityLabel="Oturumu kapat">
            <Feather name="log-out" size={15} color={C.onDarkMuted} />
          </Pressable>
        </Row>
      </View>
    </View>
  );
}

/* ────────────────────────── Üst durum çubuğu ────────────────────────── */

/** Kalıcı durum çubuğu: YZ etkinliği, simülasyon hazırlığı, sistem saati. */
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
  const { unreadCount, role, jobs } = useApp();
  const runningModels = Object.values(jobs).filter((j) => j && (j.status === "queued" || j.status === "running")).length;
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
        <Pressable onPress={onMenu} hitSlop={10} style={{ marginRight: 4 }} accessibilityRole="button" accessibilityLabel="Menüyü aç">
          <Feather name="menu" size={20} color={C.txt} />
        </Pressable>
      )}
      <Row gap={7} style={{ flex: 1, minWidth: 0 }}>
        <Txt size={13.5} weight="600" color={C.txt} numberOfLines={1}>
          {item.label}
        </Txt>
      </Row>

      {showStatus && (
        <Row gap={14}>
          <StatusItem dot={runningModels ? C.txt : C.success} label={runningModels ? `${runningModels} model çalışıyor` : "YZ aktif"} />
          <StatusItem dot={C.success} label="Simülasyon hazır" />
          {API_MODE === "mock" && <StatusItem dot={C.warning} label="Demo sunucu" />}
          <View style={s.sep} />
          <Txt size={11.5} weight="500" color={C.txt} mono>
            {time.toLocaleTimeString("tr-TR")}
          </Txt>
        </Row>
      )}

      <Pressable
        onPress={() => onNavigate("notifications")}
        hitSlop={10}
        style={{ marginLeft: 12 }}
        accessibilityRole="button"
        accessibilityLabel={`Bildirimler, ${unreadCount} okunmamış`}
      >
        <Feather name="bell" size={17} color={C.txt} />
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

function StatusItem({ dot, label }: { dot: string; label: string }) {
  return (
    <Row gap={6}>
      <View style={[s.dot, { backgroundColor: dot }]} />
      <Txt size={11.5} color={C.txt2}>
        {label}
      </Txt>
    </Row>
  );
}

const s = themed(() => StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: C.bg },
  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: C.sidebar,
  },
  brand: {
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: C.sidebarBorder,
  },
  brandLogo: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.md,
    backgroundColor: C.onDark,
    alignItems: "center",
    justifyContent: "center",
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    marginBottom: 1,
  },
  sessionWrap: { padding: 10, borderTopWidth: 1, borderTopColor: C.sidebarBorder },
  session: { backgroundColor: C.sidebarEl, borderRadius: RADIUS.md, padding: 10 },
  avatar: { width: 28, height: 28, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", backgroundColor: C.onDark },
  sep: { width: 1, height: 16, backgroundColor: C.border },
  topbar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
    backgroundColor: C.card,
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
    backgroundColor: C.critical,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerRoot: { flex: 1, flexDirection: "row" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
}));
