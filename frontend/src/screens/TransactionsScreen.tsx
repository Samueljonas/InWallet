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
import { useAuth } from "../contexts/AuthContext";
import { UpgradeModal } from "../components/UpgradeModal";
import { ImportStatementModal } from "../components/ImportStatementModal";
import { Account, Transaction } from "../types";
import { Chip, EmptyState, Header, Screen } from "../components/ui";
import { MonthSelector } from "../components/MonthSelector";
import { TransactionRow } from "../components/TransactionRow";
import { Icon } from "../components/Icon";
import { radius, spacing } from "../theme";
import { createThemedStyles, useTheme } from "../contexts/ThemeContext";
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
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
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
    if (!user?.is_pro) {
      setShowUpgradeModal(true);
      return;
    }
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
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.importBtn}
              onPress={() => setShowImportModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Importar extrato OFX ou CSV"
            >
              <Icon name="upload" size={13} color={colors.text} />
              <Text style={styles.importBtnText}>Importar</Text>
            </TouchableOpacity>
            {items.length > 0 && (
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleExportCsv}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Exportar extrato em CSV"
              >
                <Icon name="download" size={13} color={colors.primaryLight} />
                <Text style={styles.exportBtnText}>
                  {user?.is_pro ? "Exportar" : "CSV (PRO)"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
          <View style={styles.searchIcon}>
            <Icon name="search" size={14} color={colors.textMuted} />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por descrição, categoria ou conta..."
            placeholderTextColor={colors.textFaint}
            accessibilityLabel="Buscar por descrição, categoria ou conta"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {!!searchQuery && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={8}
              style={styles.clearSearchBtn}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
            >
              <Icon name="close" size={12} color={colors.textMuted} />
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
                  label={acc.name}
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
                icon="transactions"
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
            ) : undefined
          }
        />
      )}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
      <ImportStatementModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        accounts={accounts}
        onImported={() => {
          load();
          onChanged();
        }}
      />
    </Screen>
  );
};

const useStyles = createThemedStyles(({ colors }) => ({
  filters: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  importBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  exportBtnText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: "600",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  searchIcon: {
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  summaryBarLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },
  summaryBarValue: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
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
    fontWeight: "600",
    fontSize: 13,
  },
}));

