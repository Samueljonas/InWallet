import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, maxContentWidth, radius, spacing } from "../theme";

export type Tab = "home" | "transactions" | "manage";

const ITEMS: { key: Tab; icon: string; label: string }[] = [
  { key: "home", icon: "🏠", label: "Resumo" },
  { key: "transactions", icon: "🧾", label: "Transações" },
  { key: "manage", icon: "⚙️", label: "Cadastros" },
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
        <Text style={[styles.icon, !active && { opacity: 0.5 }]}>
          {item.icon}
        </Text>
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bar: {
    flexDirection: "row",
    width: "100%",
    maxWidth: maxContentWidth,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 20 },
  label: {
    color: colors.textFaint,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  labelActive: { color: colors.primaryLight },
  fab: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
    borderWidth: 4,
    borderColor: colors.surface,
  },
  fabText: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 34,
  },
});
