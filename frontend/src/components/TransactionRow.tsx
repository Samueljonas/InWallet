import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import { Transaction } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

export const TransactionRow: React.FC<{
  tx: Transaction;
  onPress?: () => void;
  onDelete?: () => void;
}> = ({ tx, onPress, onDelete }) => {
  const isExpense = tx.type === "expense";
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View
        style={[
          styles.icon,
          { backgroundColor: isExpense ? colors.expenseBg : colors.incomeBg },
        ]}
      >
        <Text style={styles.iconText}>{isExpense ? "↓" : "↑"}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {tx.description || tx.category_name || "Sem descrição"}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {tx.category_name || "Geral"} • {tx.account_name || "Conta"} •{" "}
          {formatDate(tx.date)}
        </Text>
      </View>
      <Text
        style={[
          styles.amount,
          { color: isExpense ? colors.expense : colors.income },
        ]}
      >
        {isExpense ? "-" : "+"} {formatCurrency(tx.amount)}
      </Text>
      {onDelete && (
        <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.delete}>
          <Text style={styles.deleteText}>🗑</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  iconText: { fontSize: 18, fontWeight: "800", color: colors.text },
  info: { flex: 1, marginRight: spacing.sm },
  title: { color: colors.text, fontSize: 15, fontWeight: "600" },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "700" },
  delete: { marginLeft: spacing.md, padding: 4 },
  deleteText: { fontSize: 16 },
});
