import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing } from "../theme";

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
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
          <Text style={[styles.icon, !active && { opacity: 0.65 }]}>
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
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View style={styles.pillBar}>
        {renderItem(ITEMS[0])}
        {renderItem(ITEMS[1])}

        {/* Botão "+" Centralizado na Pílula */}
        <View style={styles.fabSlot}>
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
  outerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 6,
    paddingBottom: Platform.select({
      ios: 26,
      android: 20,
      default: 16,
    }),
    backgroundColor: "transparent",
    alignItems: "center",
  },
  pillBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: 460,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    ...Platform.select({
      web: {
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.12), 0 4px 10px rgba(15, 23, 42, 0.06)",
      } as any,
      default: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
        elevation: 14,
      },
    }),
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  fabSlot: {
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: 2,
  },
  iconWrapActive: {
    backgroundColor: colors.primarySoft,
  },
  icon: { fontSize: 19 },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 6px 16px rgba(37, 99, 235, 0.4)",
      } as any,
      default: {
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  fabText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "600",
    lineHeight: 28,
    marginTop: -1,
  },
});


