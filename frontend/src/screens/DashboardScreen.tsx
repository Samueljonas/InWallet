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
  Screen,
  SectionTitle,
} from "../components/ui";
import { MonthSelector } from "../components/MonthSelector";
import { TransactionRow } from "../components/TransactionRow";
import { UpgradeModal } from "../components/UpgradeModal";
import { Icon } from "../components/Icon";
import {
  CategoryDistributionChart,
  MonthlyEvolutionChart,
} from "../components/Charts";
import { colors, radius, shadowCard, shadowHero, spacing, topInset } from "../theme";
import {
  extractErrorMessage,
  formatCurrency,
  notify,
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  async function handleDeleteRecent(tx: Transaction) {
    try {
      await api.delete(`/api/v1/transactions/${tx.id}/`);
      load();
    } catch (err) {
      notify("Erro ao excluir", extractErrorMessage(err));
    }
  }

  const net = Number(metrics?.monthly_net ?? 0);
  const userInitials =
    user?.first_name && user?.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
      : (user?.username || "IW").slice(0, 2).toUpperCase();

  return (
    <Screen fluid>
      {/* Top Header Minimalista */}
      <View style={styles.topBar}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.greeting}>
                Olá, {user?.first_name || user?.username || "você"}
              </Text>
              {user?.is_pro && (
                <View style={styles.proHeaderBadge}>
                  <Text style={styles.proHeaderBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.statusSubtitle}>Visão geral financeira</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          {!user?.is_pro && (
            <TouchableOpacity
              style={styles.proBtn}
              onPress={() => setShowUpgradeModal(true)}
              activeOpacity={0.85}
              accessibilityLabel="Assinar plano Pro"
              accessibilityRole="button"
            >
              <Text style={styles.proBtnText}>Seja PRO</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.quickAddBtn}
            onPress={onAdd}
            activeOpacity={0.8}
            accessibilityLabel="Adicionar nova transação"
            accessibilityRole="button"
          >
            <Text style={styles.quickAddText}>+ Novo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
      >
        {/* Seletor de Mês */}
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
            color={colors.primary}
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
            {/* Card Hero de Saldo Total */}
            <View style={[styles.heroCard, shadowHero]}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroLabel}>Saldo Total Acumulado</Text>
                  <Text style={styles.heroBalance}>
                    {formatCurrency(metrics?.total_balance)}
                  </Text>
                </View>
                <View style={styles.chipMonth}>
                  <Text style={styles.chipMonthText}>
                    {month < 10 ? `0${month}` : month}/{year}
                  </Text>
                </View>
              </View>

              {/* Indicadores Mensais Integrados */}
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Receitas</Text>
                  <Text style={[styles.heroStatValue, { color: colors.income }]}>
                    + {formatCurrency(metrics?.monthly_income)}
                  </Text>
                </View>

                <View style={styles.heroDivider} />

                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Despesas</Text>
                  <Text style={[styles.heroStatValue, { color: colors.expense }]}>
                    - {formatCurrency(metrics?.monthly_expense)}
                  </Text>
                </View>

                <View style={styles.heroDivider} />

                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Resultado</Text>
                  <Text
                    style={[
                      styles.heroStatValue,
                      { color: net >= 0 ? colors.income : colors.expense },
                    ]}
                  >
                    {net >= 0 ? "+" : ""}
                    {formatCurrency(net)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Minhas Contas */}
            {accounts.length > 0 && (
              <View style={styles.sectionWrap}>
                <SectionTitle
                  title="Minhas Contas"
                  subtitle={`${accounts.length} ${accounts.length === 1 ? "conta ativa" : "contas ativas"}`}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.accountList}
                >
                  {accounts.map((acc) => (
                    <View key={acc.id} style={[styles.accountCard, shadowCard]}>
                      <View style={styles.accountTop}>
                        <View style={styles.accountIconWrap}>
                          <Icon name="wallet" size={14} color={colors.primary} />
                        </View>
                        <Text style={styles.accountName} numberOfLines={1}>
                          {acc.name}
                        </Text>
                      </View>
                      <Text style={styles.accountBalance}>
                        {formatCurrency(acc.balance)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Metas de Gastos Mensais */}
            {(metrics?.budgets_progress?.length ?? 0) > 0 && (
              <View style={styles.sectionWrap}>
                <SectionTitle
                  title="Metas de Gastos do Mês"
                  subtitle="Acompanhamento dos seus limites por categoria"
                />
                <Card>
                  <View style={styles.budgetsWrap}>
                    {metrics!.budgets_progress!.map((bg) => {
                      const pct = bg.percentage;
                      const barColor =
                        pct >= 100
                          ? colors.expense
                          : pct >= 75
                          ? "#F59E0B"
                          : colors.income;
                      const clampedWidth = Math.min(100, Math.max(4, pct));
                      return (
                        <View key={bg.id} style={styles.budgetRow}>
                          <View style={styles.budgetHeader}>
                            <Text style={styles.budgetCatName}>
                              {bg.category_name}
                            </Text>
                            <Text
                              style={[
                                styles.budgetPctBadge,
                                { color: barColor },
                              ]}
                            >
                              {pct.toFixed(0)}%
                            </Text>
                          </View>
                          <View style={styles.budgetTrack}>
                            <View
                              style={[
                                styles.budgetFill,
                                {
                                  width: `${clampedWidth}%`,
                                  backgroundColor: barColor,
                                },
                              ]}
                            />
                          </View>
                          <View style={styles.budgetFooter}>
                            <Text style={styles.budgetSpentText}>
                              Gasto: {formatCurrency(bg.spent)}
                            </Text>
                            <Text style={styles.budgetLimitText}>
                              Teto: {formatCurrency(bg.limit)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </Card>
              </View>
            )}

            {/* Gráfico 1: Distribuição de Despesas por Categoria */}
            <View style={styles.sectionWrap}>
              <SectionTitle
                title="Distribuição por Categoria"
                subtitle="Divisão percentual dos gastos do período"
              />
              <Card>
                <CategoryDistributionChart
                  categories={metrics?.expenses_by_category ?? []}
                />
              </Card>
            </View>

            {/* Gráfico 2: Evolução no Ano */}
            <View style={styles.sectionWrap}>
              <SectionTitle
                title={`Evolução em ${year}`}
                subtitle="Comparativo histórico de receitas vs despesas"
              />
              <Card>
                <MonthlyEvolutionChart
                  summary={metrics?.monthly_summary ?? []}
                  year={year}
                  selectedMonth={month}
                  onSelectMonth={(m) => setMonth(m)}
                />
              </Card>
            </View>

            {/* Últimas Transações */}
            <View style={styles.sectionWrap}>
              <SectionTitle
                title="Últimas Transações"
                subtitle="Lançamentos recentes deste mês"
                right={
                  recent.length > 0 ? (
                    <TouchableOpacity
                      onPress={onSeeAllTransactions}
                      style={styles.seeAllBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Ver todas as transações"
                    >
                      <Text style={styles.seeAllText}>Ver todas</Text>
                    </TouchableOpacity>
                  ) : undefined
                }
              />
              {recent.length === 0 ? (
                <Card>
                  <EmptyState
                    icon="transactions"
                    title="Nenhuma transação neste mês"
                    subtitle="Toque no botão abaixo para registrar sua primeira movimentação."
                  />
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={onAdd}
                    accessibilityLabel="Adicionar nova transação"
                    accessibilityRole="button"
                  >
                    <Text style={styles.emptyAddBtnText}>+ Adicionar Transação</Text>
                  </TouchableOpacity>
                </Card>
              ) : (
                recent.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    onPress={() => onEditTransaction(tx)}
                    onDelete={() => handleDeleteRecent(tx)}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: topInset,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  greeting: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  statusSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  quickAddBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  quickAddText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  proHeaderBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  proHeaderBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  proBtn: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  proBtnText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: "600",
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  errorText: {
    color: colors.expense,
    fontSize: 14,
    textAlign: "center",
  },
  retry: {
    color: colors.primary,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing.md,
  },

  // Hero Card (Midnight Navy & Royal Blue)
  heroCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLabel: {
    color: colors.textMuted,
    fontSize: 11.5,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  heroBalance: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginTop: 4,
  },
  chipMonth: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  chipMonthText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  heroStatItem: {
    flex: 1,
  },
  heroDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  heroStatLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "500",
  },
  heroStatValue: {
    fontSize: 13.5,
    fontWeight: "700",
    marginTop: 2,
  },

  sectionWrap: {
    marginTop: spacing.sm,
  },
  accountList: {
    gap: spacing.md,
    paddingVertical: 2,
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minWidth: 155,
  },
  accountTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
  },
  accountIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  accountName: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  accountBalance: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  seeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyAddBtn: {
    backgroundColor: colors.primarySoft,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  emptyAddBtnText: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: "600",
  },
  budgetsWrap: {
    gap: spacing.lg,
  },
  budgetRow: {
    gap: 6,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetCatName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  budgetPctBadge: {
    fontSize: 13,
    fontWeight: "700",
  },
  budgetTrack: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  budgetFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  budgetFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  budgetSpentText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  budgetLimitText: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "500",
  },
});
