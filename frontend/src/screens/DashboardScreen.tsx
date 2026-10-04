import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { api, fetchAll } from "../api/client";
import { Account, DashboardMetrics, Transaction } from "../types";
import {
  Card,
  EmptyState,
  Header,
  Screen,
  SectionTitle,
} from "../components/ui";
import { MonthSelector } from "../components/MonthSelector";
import { TransactionRow } from "../components/TransactionRow";
import { chartPalette, colors, radius, spacing } from "../theme";
import {
  MONTH_SHORT,
  extractErrorMessage,
  formatCurrency,
} from "../utils/format";

interface Props {
  refreshKey: number;
  onSeeAllTransactions: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onAdd: () => void;
}

export const DashboardScreen: React.FC<Props> = ({
  refreshKey,
  onSeeAllTransactions,
  onEditTransaction,
  onAdd,
}) => {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [dash, accs, txs] = await Promise.all([
        api.get<DashboardMetrics>("/api/v1/dashboard/", {
          params: { year, month },
        }),
        fetchAll<Account>("/api/v1/accounts/"),
        api.get<{ results: Transaction[] }>("/api/v1/transactions/", {
          params: { year, month },
        }),
      ]);
      setMetrics(dash.data);
      setAccounts(accs);
      setRecent((txs.data.results ?? []).slice(0, 5));
    } catch (err) {
      setError(extractErrorMessage(err, "Não foi possível carregar o resumo."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, month]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  const net = Number(metrics?.monthly_net ?? 0);
  const categories = (metrics?.expenses_by_category ?? []).map((c) => ({
    name: c.category,
    total: Number(c.total),
  }));
  const categoriesTotal = categories.reduce((sum, c) => sum + c.total, 0);

  const summary = metrics?.monthly_summary ?? [];
  const chartMax = Math.max(
    1,
    ...summary.map((s) => Math.max(s.income, s.expense)),
  );

  return (
    <Screen>
      <Header
        title={`Olá, ${user?.first_name || user?.username || "você"} 👋`}
        subtitle="Veja como estão suas finanças"
      />

      <ScrollView
        contentContainerStyle={styles.content}
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
      >
        <MonthSelector
          year={year}
          month={month}
          onChange={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
        />

        {loading && !metrics ? (
          <ActivityIndicator
            size="large"
            color={colors.primaryLight}
            style={{ marginTop: spacing.xxl }}
          />
        ) : error ? (
          <Card style={{ marginTop: spacing.lg }}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                load();
              }}
            >
              <Text style={styles.retry}>Tentar novamente</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <>
            {/* Saldo */}
            <Card style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Saldo total</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(metrics?.total_balance)}
              </Text>

              <View style={styles.balanceRow}>
                <View style={styles.balanceCol}>
                  <Text style={styles.miniLabel}>Receitas</Text>
                  <Text style={[styles.miniValue, { color: colors.income }]}>
                    {formatCurrency(metrics?.monthly_income)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.balanceCol}>
                  <Text style={styles.miniLabel}>Despesas</Text>
                  <Text style={[styles.miniValue, { color: colors.expense }]}>
                    {formatCurrency(metrics?.monthly_expense)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.balanceCol}>
                  <Text style={styles.miniLabel}>Resultado</Text>
                  <Text
                    style={[
                      styles.miniValue,
                      { color: net >= 0 ? colors.income : colors.expense },
                    ]}
                  >
                    {formatCurrency(net)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Contas */}
            {accounts.length > 0 && (
              <>
                <SectionTitle title="Minhas contas" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {accounts.map((acc) => (
                    <View key={acc.id} style={styles.accountCard}>
                      <Text style={styles.accountName} numberOfLines={1}>
                        {acc.name}
                      </Text>
                      <Text style={styles.accountBalance}>
                        {formatCurrency(acc.balance)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Gastos por categoria */}
            <SectionTitle title="Para onde foi o dinheiro" />
            <Card>
              {categories.length === 0 ? (
                <EmptyState
                  icon="🎯"
                  title="Sem despesas neste mês"
                  subtitle="Quando você registrar gastos, eles aparecem aqui."
                />
              ) : (
                categories.map((c, i) => {
                  const pct =
                    categoriesTotal > 0 ? (c.total / categoriesTotal) * 100 : 0;
                  return (
                    <View
                      key={c.name}
                      style={{
                        marginBottom:
                          i === categories.length - 1 ? 0 : spacing.lg,
                      }}
                    >
                      <View style={styles.catHeader}>
                        <Text style={styles.catName}>{c.name}</Text>
                        <Text style={styles.catValue}>
                          {formatCurrency(c.total)}{" "}
                          <Text style={styles.catPct}>({pct.toFixed(0)}%)</Text>
                        </Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${Math.max(pct, 2)}%`,
                              backgroundColor:
                                chartPalette[i % chartPalette.length],
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </Card>

            {/* Evolução no ano */}
            {summary.length > 0 && (
              <>
                <SectionTitle title={`Evolução em ${year}`} />
                <Card>
                  <View style={styles.chart}>
                    {summary.map((s) => (
                      <View
                        key={`${s.year}-${s.month_number}`}
                        style={styles.chartCol}
                      >
                        <View style={styles.chartBars}>
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height: `${(s.income / chartMax) * 100}%`,
                                backgroundColor: colors.income,
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height: `${(s.expense / chartMax) * 100}%`,
                                backgroundColor: colors.expense,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.chartLabel}>
                          {s.month_number
                            ? MONTH_SHORT[s.month_number - 1]
                            : ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.legend}>
                    <Text style={[styles.legendItem, { color: colors.income }]}>
                      ● Receitas
                    </Text>
                    <Text
                      style={[styles.legendItem, { color: colors.expense }]}
                    >
                      ● Despesas
                    </Text>
                  </View>
                </Card>
              </>
            )}

            {/* Últimas transações */}
            <SectionTitle
              title="Últimas transações"
              right={
                recent.length > 0 ? (
                  <TouchableOpacity onPress={onSeeAllTransactions}>
                    <Text style={styles.seeAll}>Ver todas</Text>
                  </TouchableOpacity>
                ) : undefined
              }
            />
            {recent.length === 0 ? (
              <Card>
                <EmptyState
                  icon="🧾"
                  title="Nenhuma transação neste mês"
                  subtitle="Toque no + para registrar sua primeira."
                />
                <TouchableOpacity onPress={onAdd}>
                  <Text style={[styles.seeAll, { textAlign: "center" }]}>
                    Registrar agora
                  </Text>
                </TouchableOpacity>
              </Card>
            ) : (
              recent.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  onPress={() => onEditTransaction(tx)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  errorText: { color: colors.expense, fontSize: 14, textAlign: "center" },
  retry: {
    color: colors.primaryLight,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.md,
  },

  balanceCard: { marginTop: spacing.lg, backgroundColor: colors.surfaceAlt },
  balanceLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  balanceValue: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
    marginVertical: spacing.sm,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  balanceCol: { flex: 1 },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  miniLabel: { color: colors.textMuted, fontSize: 11 },
  miniValue: { fontSize: 13, fontWeight: "700", marginTop: 2 },

  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginRight: spacing.sm,
    minWidth: 140,
  },
  accountName: { color: colors.textMuted, fontSize: 12 },
  accountBalance: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },

  catHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  catName: { color: colors.text, fontSize: 14, fontWeight: "600" },
  catValue: { color: colors.text, fontSize: 13, fontWeight: "600" },
  catPct: { color: colors.textMuted, fontWeight: "400" },
  barTrack: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  barFill: { height: 8, borderRadius: radius.pill },

  chart: { flexDirection: "row", alignItems: "flex-end", height: 130, gap: 6 },
  chartCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    flex: 1,
    width: "100%",
    justifyContent: "center",
  },
  chartBar: {
    width: "40%",
    maxWidth: 14,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 2,
  },
  chartLabel: { color: colors.textFaint, fontSize: 10, marginTop: 4 },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendItem: { fontSize: 12, fontWeight: "600" },

  seeAll: { color: colors.primaryLight, fontSize: 13, fontWeight: "700" },
});
