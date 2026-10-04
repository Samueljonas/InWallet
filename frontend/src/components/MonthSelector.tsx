import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing } from "../theme";
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
    <View style={styles.row}>
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
        {!isCurrent && (
          <Text style={styles.hint}>toque para voltar ao mês atual</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.arrow, isCurrent && { opacity: 0.3 }]}
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  arrow: {
    width: 44,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: colors.primaryLight,
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 30,
  },
  label: { color: colors.text, fontSize: 16, fontWeight: "700" },
  hint: { color: colors.textFaint, fontSize: 10, marginTop: 2 },
});
