import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api, fetchAll } from "../api/client";
import { Account, Transaction } from "../types";
import { Chip, EmptyState, Header, Screen } from "../components/ui";
import { MonthSelector } from "../components/MonthSelector";
import { TransactionRow } from "../components/TransactionRow";
import { colors, radius, spacing } from "../theme";
import {
  confirmAction,
  exportTransactionsToCsv,
  extractErrorMessage,
  formatCurrency,
  notify,
} from "../utils/format";

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
  const [accountFilter, setAccountFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [items, setItems] = useState<Transaction[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAll<Account>("/api/v1/accounts/")
      .then(setAccounts)
      .catch(() => {});
  }, [refreshKey]);

  const load = useCallback(async () => {
    try {
      setError("");
      const params: Record<string, string | number> = { year, month };
      if (filter !== "all") params.type = filter;
      if (accountFilter) params.account = accountFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
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
  }, [year, month, filter, accountFilter, searchQuery]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      load();
    }, 220);
    return () => clearTimeout(timer);
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

  async function handleExportCsv() {
    if (items.length === 0) {
      notify("Sem dados", "Não há transações no filtro atual para exportar.");
      return;
    }
    const mStr = month < 10 ? `0${month}` : String(month);
    await exportTransactionsToCsv(items, `extrato-inwallet-${year}-${mStr}.csv`);
  }

  // Cálculos do resumo local filtrado
  const filteredTotal = items.reduce((acc, tx) => {
    const val = Number(tx.amount);
    return tx.type === "expense" ? acc - val : acc + val;
  }, 0);

  return (
    <Screen fluid>
      <Header
        title="Extrato Financeiro"
        subtitle={
          loading
            ? "Carregando lançamentos…"
            : `${count} ${count === 1 ? "registro encontrado" : "registros encontrados"}`
        }
        right={
          items.length > 0 ? (
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExportCsv}
              activeOpacity={0.8}
            >
              <Text style={styles.exportBtnText}>📥 Exportar CSV</Text>
            </TouchableOpacity>
          ) : undefined
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

        {/* Barra de Busca Rápida */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por descrição, categoria ou conta..."
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {!!searchQuery && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={8}
              style={styles.clearSearchBtn}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filtro de Tipo + Contas */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
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
          {accounts.length > 1 && (
            <>
              <View style={styles.chipDivider} />
              {accounts.map((acc) => (
                <Chip
                  key={acc.id}
                  label={`🏦 ${acc.name}`}
                  active={accountFilter === acc.id}
                  onPress={() =>
                    setAccountFilter((cur) => (cur === acc.id ? null : acc.id))
                  }
                />
              ))}
            </>
          )}
        </ScrollView>

        {items.length > 0 && (
          <View style={styles.summaryBar}>
            <Text style={styles.summaryBarLabel}>
              {filter === "expense"
                ? "Total de despesas filtradas:"
                : filter === "income"
                ? "Total de receitas filtradas:"
                : "Balanço do filtro:"}
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
                subtitle={
                  searchQuery || accountFilter
                    ? "Tente limpar os filtros ou buscar por outro termo."
                    : "Toque no botão + para adicionar sua primeira transação neste período."
                }
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
  filters: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  exportBtn: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  exportBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 10,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  chipsScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingRight: spacing.md,
  },
  chipDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.borderStrong,
    marginHorizontal: 4,
  },
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

