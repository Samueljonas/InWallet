import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, shadowCard, spacing } from "../theme";
import { MONTH_NAMES } from "../utils/format";
import { Icon } from "./Icon";

export const MonthSelector: React.FC<{
  year: number;
  month: number; // 1-12
  onChange: (year: number, month: number) => void;
}> = ({ year, month, onChange }) => {
  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;

  const shift = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    onChange(d.getFullYear(), d.getMonth() + 1);
  };

  return (
    <View style={[styles.row, shadowCard]}>
      <TouchableOpacity
        style={styles.arrow}
        onPress={() => shift(-1)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Mês anterior"
      >
        <Icon name="arrow-left" size={16} color={colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ flex: 1, alignItems: "center" }}
        onPress={() => onChange(now.getFullYear(), now.getMonth() + 1)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${MONTH_NAMES[month - 1]} de ${year}. Toque para voltar ao mês atual`}
      >
        <Text style={styles.label}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        {!isCurrent ? (
          <Text style={styles.hint}>voltar ao mês atual</Text>
        ) : (
          <Text style={styles.currentBadge}>período atual</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.arrow, isCurrent && { opacity: 0.25 }]}
        onPress={() => shift(1)}
        disabled={isCurrent}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Próximo mês"
        accessibilityState={{ disabled: isCurrent }}
      >
        <Icon name="arrow-right" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  arrow: {
    width: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  hint: {
    color: colors.primary,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  currentBadge: {
    color: colors.textFaint,
    fontSize: 11,
    marginTop: 2,
  },
});
