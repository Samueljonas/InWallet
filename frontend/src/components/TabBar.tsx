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
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {renderItem(ITEMS[0])}
        {renderItem(ITEMS[1])}
        <View style={styles.fabContainer}>
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
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1.5,
    borderTopColor: "#E2E8F0",
    ...Platform.select({
      web: {
        boxShadow: "0 -4px 16px rgba(15, 23, 42, 0.08)",
      } as any,
      default: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 16,
      },
    }),
  },
  bar: {
    flexDirection: "row",
    width: "100%",
    maxWidth: maxContentWidth,
    paddingTop: 10,
    paddingBottom: Platform.select({
      ios: 30,
      android: 44, // Mais espaço para a barra de 3 botões do Android não cobrir
      default: 14,
    }),
    alignItems: "center",
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center" },
  fabContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  iconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 3,
  },
  iconWrapActive: {
    backgroundColor: colors.primarySoft,
  },
  icon: { fontSize: 22 },
  label: {
    color: colors.textMuted,
    fontSize: 12,
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
    marginTop: -8, // Perfeitamente alinhado na barra sem ficar 'flutuando' ou desconectado
    borderWidth: 3,
    borderColor: "#FFFFFF",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)",
      } as any,
      default: {
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
      },
    }),
  },
  fabText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "500",
    lineHeight: 28,
    marginTop: -2,
  },
});

