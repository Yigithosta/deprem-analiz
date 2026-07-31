import React from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { C } from "../theme/tokens";

/** Tüm içerik ekranları için ortak kaydırılabilir gövde. */
export function Screen({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const pad = width >= 700 ? 16 : 12;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: pad, paddingBottom: 40, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

/**
 * Genişliğe göre sütuna/satıra dönen esnek yerleşim.
 * `min` her sütunun sığması için gereken en küçük genişliktir.
 */
export function Cols({
  children,
  min = 340,
  gap = 12,
}: {
  children: React.ReactNode;
  min?: number;
  gap?: number;
}) {
  const { width } = useWindowDimensions();
  const items = React.Children.toArray(children);
  const stack = width < min * items.length + 260;
  return (
    <View style={{ flexDirection: stack ? "column" : "row", gap }}>
      {items.map((child, i) => (
        <View key={i} style={{ flex: stack ? undefined : 1, minWidth: 0 }}>
          {child}
        </View>
      ))}
    </View>
  );
}

/** Cihaz genişliğine göre kolon sayısı hesaplayan yardımcı. */
export function useCols(minWidth = 240) {
  const { width } = useWindowDimensions();
  return Math.max(1, Math.floor((width - 260) / minWidth));
}
