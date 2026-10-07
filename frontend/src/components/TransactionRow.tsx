import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, shadowCard, spacing } from "../theme";
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
      style={[styles.row, shadowCard]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View
        style={[
          styles.icon,
          {
            backgroundColor: isExpense ? colors.expenseBg : colors.incomeBg,
            borderColor: isExpense ? colors.expenseBorder : colors.incomeBorder,
          },
        ]}
      >
        <Text
          style={[
            styles.iconText,
            { color: isExpense ? colors.expense : colors.income },
          ]}
        >
          {isExpense ? "↓" : "↑"}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {tx.description || tx.category_name || "Sem descrição"}
        </Text>
        <View style={styles.metaRow}>
          {!!tx.category_name && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{tx.category_name}</Text>
            </View>
          )}
          <Text style={styles.sub} numberOfLines={1}>
            {tx.account_name || "Conta"} • {formatDate(tx.date)}
          </Text>
        </View>
      </View>
      <View style={styles.rightSide}>
        <Text
          style={[
            styles.amount,
            { color: isExpense ? colors.expense : colors.income },
          ]}
        >
          {isExpense ? "-" : "+"} {formatCurrency(tx.amount)}
        </Text>
        {onPress && <Text style={styles.editHint}>editar</Text>}
      </View>
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={10}
          style={styles.deleteBtn}
          accessibilityLabel="Excluir transação"
        >
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
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
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: spacing.md,
  },
  iconText: { fontSize: 18, fontWeight: "900" },
  info: { flex: 1, marginRight: spacing.sm },
  title: { color: colors.text, fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  pill: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pillText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  sub: { color: colors.textFaint, fontSize: 12 },
  rightSide: { alignItems: "flex-end" },
  amount: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  editHint: { color: colors.primary, fontSize: 11, fontWeight: "600", marginTop: 2 },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  deleteText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
});

