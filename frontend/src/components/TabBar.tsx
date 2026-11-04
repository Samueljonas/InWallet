import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, radius, spacing } from "../theme";
import { Icon, IconName } from "./Icon";

export type Tab = "home" | "transactions" | "manage";

const ITEMS: { key: Tab; icon: IconName; label: string }[] = [
  { key: "home", icon: "home", label: "Início" },
  { key: "transactions", icon: "transactions", label: "Extrato" },
  { key: "manage", icon: "settings", label: "Ajustes" },
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
        style={[styles.item, active && styles.itemActive]}
        onPress={() => onChange(item.key)}
        activeOpacity={0.75}
        accessibilityRole="tab"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
      >
        <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
          <Icon
            name={item.icon}
            size={17}
            color={active ? colors.white : colors.textMuted}
          />
        </View>
        <Text style={[styles.label, active && styles.labelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      {/* Botão Flutuante "+" no Canto Inferior Direito Acima da Navbar */}
      <View style={styles.floatingFabRow} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fab}
          onPress={onAdd}
          activeOpacity={0.85}
          accessibilityLabel="Adicionar nova transação"
          accessibilityRole="button"
        >
          <Icon name="plus" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Pílula Principal da Navbar com 3 Abas Simétricas */}
      <View style={styles.pillBar}>
        {renderItem(ITEMS[0])}
        {renderItem(ITEMS[1])}
        {renderItem(ITEMS[2])}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: Platform.select({
      ios: 26,
      android: 22,
      default: 16,
    }),
    backgroundColor: "transparent",
    alignItems: "center",
    zIndex: 50,
  },
  floatingFabRow: {
    width: "100%",
    maxWidth: 460,
    alignItems: "flex-end",
    justifyContent: "center",
    marginBottom: 12,
    paddingRight: 4,
    zIndex: 20,
  },
  pillBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 460,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    ...Platform.select({
      web: {
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.45)",
      } as any,
      default: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 14,
      },
    }),
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  itemActive: {},
  iconWrap: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  iconWrapActive: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  labelActive: {
    color: colors.text,
    fontWeight: "600",
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 8px 24px rgba(59, 130, 246, 0.42)",
      } as any,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.38,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
});
