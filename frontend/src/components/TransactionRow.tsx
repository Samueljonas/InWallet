import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { radius, spacing } from "../theme";
import { createThemedStyles, useTheme } from "../contexts/ThemeContext";
import { Transaction } from "../types";
import { formatCurrency, formatDate } from "../utils/format";
import { Icon } from "./Icon";

export const TransactionRow: React.FC<{
  tx: Transaction;
  onPress?: () => void;
  onDelete?: () => void;
}> = ({ tx, onPress, onDelete }) => {
  const { colors, shadowCard } = useTheme();
  const styles = useStyles();
  const isExpense = tx.type === "expense";
  const txTitle = tx.description || tx.category_name || "Sem descrição";
  return (
    <TouchableOpacity
      style={[styles.row, shadowCard]}
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${isExpense ? "Despesa" : "Receita"}: ${txTitle}, ${formatCurrency(tx.amount)} em ${formatDate(tx.date)}`}
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
        <Icon
          name={isExpense ? "arrow-down" : "arrow-up"}
          size={15}
          color={isExpense ? colors.expense : colors.income}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {txTitle}
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
      </View>
      {onPress && (
        <TouchableOpacity
          onPress={onPress}
          hitSlop={10}
          style={styles.actionBtn}
          accessibilityLabel="Editar lançamento"
          accessibilityRole="button"
        >
          <Icon name="edit" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      )}
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={10}
          style={styles.deleteBtn}
          accessibilityLabel="Excluir lançamento"
          accessibilityRole="button"
        >
          <Icon name="trash" size={14} color={colors.expense} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const useStyles = createThemedStyles(({ colors }) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: spacing.md,
  },
  info: { flex: 1, marginRight: spacing.sm },
  title: {
    color: colors.text,
    fontSize: 14.5,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  pill: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: { color: colors.textMuted, fontSize: 11, fontWeight: "500" },
  sub: { color: colors.textFaint, fontSize: 12, fontWeight: "500" },
  rightSide: { alignItems: "flex-end", marginRight: 4 },
  amount: { fontSize: 14.5, fontWeight: "700", letterSpacing: -0.2 },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.expenseBg,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
    borderWidth: 1,
    borderColor: colors.expenseBorder,
  },
}));
