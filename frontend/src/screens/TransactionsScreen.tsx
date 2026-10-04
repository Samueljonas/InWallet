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
import { colors, spacing } from "../theme";
import { confirmAction, extractErrorMessage, notify } from "../utils/format";

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
        extractErrorMessage(err, "Não foi possível carregar as transações."),
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
      `"${tx.description || tx.category_name}" será removida e o saldo da conta será ajustado.`,
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

  return (
    <Screen>
      <Header
        title="Transações"
        subtitle={
          loading
            ? "Carregando…"
            : `${count} ${count === 1 ? "registro" : "registros"} no período`
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
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={colors.primaryLight}
          style={{ marginTop: spacing.xxl }}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(tx) => String(tx.id)}
          contentContainerStyle={styles.list}
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
              tintColor={colors.primaryLight}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            error ? (
              <View>
                <Text style={styles.error}>{error}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setLoading(true);
                    load();
                  }}
                >
                  <Text style={styles.retry}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <EmptyState
                icon="🧾"
                title="Nada por aqui"
                subtitle="Nenhuma transação encontrada para este filtro e período."
              />
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={colors.primaryLight}
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  error: { color: colors.expense, textAlign: "center", marginTop: spacing.xl },
  retry: {
    color: colors.primaryLight,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.md,
  },
});
