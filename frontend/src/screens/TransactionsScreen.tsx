import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../api/client";
import { Transaction } from "../types";
import { Chip, EmptyState, Header, Screen } from "../components/ui";
import { MonthSelector } from "../components/MonthSelector";
import { TransactionRow } from "../components/TransactionRow";
import { colors, radius, spacing } from "../theme";
import { confirmAction, extractErrorMessage, formatCurrency, notify } from "../utils/format";

type Filter = "all" | "expense" | "income";

interface Page {
  results: Transaction[];
  next: string | null;
  count: number;
}

interface Props {
  refreshKey: number;
  onEditTransaction: (tx: Transaction) => void;
  onChanged: () => void;
}

export const TransactionsScreen: React.FC<Props> = ({
  refreshKey,
  onEditTransaction,
  onChanged,
}) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filter, setFilter] = useState<Filter>("all");

  const [items, setItems] = useState<Transaction[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const params: Record<string, string | number> = { year, month };
      if (filter !== "all") params.type = filter;
      const res = await api.get<Page>("/api/v1/transactions/", { params });
      setItems(res.data.results);
      setNext(res.data.next);
      setCount(res.data.count);
    } catch (err) {
      setError(
        extractErrorMessage(err, "Não foi possível carregar as transações.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, month, filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  async function loadMore() {
    if (!next || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await api.get<Page>(next);
      setItems((prev) => [...prev, ...res.data.results]);
      setNext(res.data.next);
    } catch (err) {
      notify("Erro", extractErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleDelete(tx: Transaction) {
    const ok = await confirmAction(
      "Excluir transação?",
      `"${tx.description || tx.category_name}" será removida e o saldo da conta será ajustado automaticamente.`
    );
    if (!ok) return;
    try {
      await api.delete(`/api/v1/transactions/${tx.id}/`);
      setItems((prev) => prev.filter((t) => t.id !== tx.id));
      setCount((c) => Math.max(0, c - 1));
      onChanged();
    } catch (err) {
      notify("Erro ao excluir", extractErrorMessage(err));
    }
  }

  // Cálculos do resumo local filtrado
  const filteredTotal = items.reduce((acc, tx) => {
    const val = Number(tx.amount);
    return tx.type === "expense" ? acc - val : acc + val;
  }, 0);

  return (
    <Screen>
      <Header
        title="Extrato Financeiro"
        subtitle={
          loading
            ? "Carregando lançamentos…"
            : `${count} ${count === 1 ? "registro encontrado" : "registros encontrados"}`
        }
      />

      <View style={styles.filters}>
        <MonthSelector
          year={year}
          month={month}
          onChange={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
        />

        <View style={styles.chips}>
          <Chip
            label="Todas"
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />
          <Chip
            label="Despesas"
            active={filter === "expense"}
            onPress={() => setFilter("expense")}
          />
          <Chip
            label="Receitas"
            active={filter === "income"}
            onPress={() => setFilter("income")}
          />
        </View>

        {items.length > 0 && (
          <View style={styles.summaryBar}>
            <Text style={styles.summaryBarLabel}>
              {filter === "expense"
                ? "Total de despesas:"
                : filter === "income"
                ? "Total de receitas:"
                : "Balanço do período:"}
            </Text>
            <Text
              style={[
                styles.summaryBarValue,
                {
                  color:
                    filter === "expense"
                      ? colors.expense
                      : filter === "income"
                      ? colors.income
                      : filteredTotal >= 0
                      ? colors.income
                      : colors.expense,
                },
              ]}
            >
              {filter === "all" && filteredTotal > 0 ? "+" : ""}
              {formatCurrency(Math.abs(filteredTotal))}
            </Text>
          </View>
        )}
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: spacing.xxl }}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(tx) => String(tx.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TransactionRow
              tx={item}
              onPress={() => onEditTransaction(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            error ? (
              <View style={styles.errorBox}>
                <Text style={styles.error}>{error}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setLoading(true);
                    load();
                  }}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retry}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <EmptyState
                icon="🧾"
                title="Nenhum lançamento encontrado"
                subtitle="Toque no botão + para adicionar sua primeira transação neste período."
              />
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ margin: spacing.lg }}
              />
            ) : null
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  filters: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  chips: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  summaryBarLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  summaryBarValue: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  errorBox: { alignItems: "center", marginTop: spacing.xl },
  error: { color: colors.expense, textAlign: "center", fontSize: 14 },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  retry: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
});
