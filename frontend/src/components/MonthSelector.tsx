import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, shadowCard, spacing } from "../theme";
import { MONTH_NAMES } from "../utils/format";

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
      >
        <Text style={styles.arrowText}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ flex: 1, alignItems: "center" }}
        onPress={() => onChange(now.getFullYear(), now.getMonth() + 1)}
        activeOpacity={0.7}
      >
        <Text style={styles.label}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        {!isCurrent ? (
          <Text style={styles.hint}>toque para voltar ao mês atual</Text>
        ) : (
          <Text style={styles.currentBadge}>mês atual</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.arrow, isCurrent && { opacity: 0.25 }]}
        onPress={() => shift(1)}
        disabled={isCurrent}
        hitSlop={8}
      >
        <Text style={styles.arrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  arrow: {
    width: 44,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  arrowText: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 28,
  },
  label: { color: colors.text, fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  hint: { color: colors.primary, fontSize: 11, marginTop: 2, fontWeight: "600" },
  currentBadge: { color: colors.textFaint, fontSize: 11, marginTop: 2 },
});

