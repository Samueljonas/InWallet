import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, maxContentWidth, radius, spacing } from "../theme";

export type Tab = "home" | "transactions" | "manage";

const ITEMS: { key: Tab; icon: string; label: string }[] = [
  { key: "home", icon: "🏠", label: "Início" },
  { key: "transactions", icon: "🧾", label: "Extrato" },
  { key: "manage", icon: "⚙️", label: "Ajustes" },
];

export const TabBar: React.FC<{
  current: Tab;
  onChange: (t: Tab) => void;
  onAdd: () => void;
}> = ({ current, onChange, onAdd }) => {
  const renderItem = (item: (typeof ITEMS)[number]) => {
    const active = current === item.key;
    return (
      <TouchableOpacity
        key={item.key}
        style={styles.item}
        onPress={() => onChange(item.key)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
          <Text style={[styles.icon, !active && { opacity: 0.6 }]}>
            {item.icon}
          </Text>
        </View>
        <Text style={[styles.label, active && styles.labelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {renderItem(ITEMS[0])}
        {renderItem(ITEMS[1])}
        <View style={styles.item}>
          <TouchableOpacity
            style={styles.fab}
            onPress={onAdd}
            activeOpacity={0.85}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
        {renderItem(ITEMS[2])}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...Platform.select({
      web: {
        boxShadow: "0 -2px 10px rgba(15, 23, 42, 0.04)",
      } as any,
      default: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 8,
      },
    }),
  },
  bar: {
    flexDirection: "row",
    width: "100%",
    maxWidth: maxContentWidth,
    paddingTop: 8,
    paddingBottom: Platform.select({
      ios: 28,
      android: 32,
      default: 12,
    }),
    alignItems: "center",
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconWrap: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 2,
  },
  iconWrapActive: {
    backgroundColor: colors.primarySoft,
  },
  icon: { fontSize: 20 },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -24,
    borderWidth: 4,
    borderColor: colors.white,
    ...Platform.select({
      web: {
        boxShadow: "0 6px 16px rgba(37, 99, 235, 0.35)",
      } as any,
      default: {
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  fabText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "400",
    lineHeight: 30,
  },
});

