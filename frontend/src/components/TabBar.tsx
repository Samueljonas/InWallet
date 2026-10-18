import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
        style={[styles.item, active && styles.itemActive]}
        onPress={() => onChange(item.key)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
          <Text style={[styles.icon, !active && styles.iconInactive]}>
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
      {/* Botão Flutuante "+" no Canto Inferior Direito Acima da Navbar */}
      <View style={styles.floatingFabRow} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fab}
          onPress={onAdd}
          activeOpacity={0.8}
          accessibilityLabel="Nova Transação"
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Pílula Principal da Navbar com 3 Abas Simétricas e Alto Destaque */}
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
    alignItems: "flex-end", // Canto inferior direito acima da navbar
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
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: "#CBD5E1", // Slate 300 - borda mais forte e destacada
    ...Platform.select({
      web: {
        boxShadow:
          "0 14px 32px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.08)",
      } as any,
      default: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 18,
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
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 4,
    backgroundColor: "#F1F5F9", // Fundo sutil mesmo nos inativos para dar destaque
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconWrapActive: {
    backgroundColor: colors.primary, // Azul forte na aba ativa
    borderColor: colors.primaryDark,
  },
  icon: {
    fontSize: 20,
  },
  iconInactive: {
    opacity: 0.9,
  },
  label: {
    color: "#1E293B", // Slate 800 - alto contraste para fácil leitura
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  labelActive: {
    color: colors.primaryDark,
    fontWeight: "900",
    fontSize: 13,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary, // Preenchido de azul
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 8px 20px rgba(37, 99, 235, 0.45)",
      } as any,
      default: {
        shadowColor: "#1D4ED8",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.38,
        shadowRadius: 10,
        elevation: 12,
      },
    }),
  },
  fabText: {
    color: colors.white, // "+" em branco
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 32,
    marginTop: -2,
  },
});
