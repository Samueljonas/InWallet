import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { chartPalette, colors, radius, spacing } from "../theme";
import { MONTH_SHORT, formatCurrency } from "../utils/format";

export interface MonthlySummaryItem {
  month: string;
  month_number: number | null;
  year: number | null;
  income: number;
  expense: number;
}

export interface CategoryExpenseItem {
  category: string;
  total: string | number;
}

/**
 * Gráfico 1: Evolução Mensal (Comparativo Interativo Receitas vs Despesas)
 * 100% nativo React Native (ultra estável no Expo Mobile e no Web).
 */
export const MonthlyEvolutionChart: React.FC<{
  summary?: MonthlySummaryItem[];
  year: number;
  selectedMonth: number;
  onSelectMonth?: (month: number) => void;
}> = ({ summary = [], year, selectedMonth, onSelectMonth }) => {
  const [activeMonth, setActiveMonth] = useState<number>(selectedMonth || 1);

  const safeSummary = Array.isArray(summary) ? summary : [];

  // Garante que temos os 12 meses do ano
  const fullYearData: MonthlySummaryItem[] = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const found = safeSummary.find((s) => Number(s.month_number) === monthNum);
    return {
      month: found?.month || `${MONTH_SHORT[i]}/${year}`,
      month_number: monthNum,
      year: found?.year || year,
      income: Number(found?.income) || 0,
      expense: Number(found?.expense) || 0,
    };
  });

  const maxVal = Math.max(
    100,
    ...fullYearData.map((d) => Math.max(d.income, d.expense))
  );

  const selectedData =
    fullYearData.find((d) => d.month_number === activeMonth) ||
    fullYearData[Math.max(0, Math.min(11, (selectedMonth || 1) - 1))];

  const totalYearIncome = fullYearData.reduce((acc, d) => acc + d.income, 0);
  const totalYearExpense = fullYearData.reduce((acc, d) => acc + d.expense, 0);
  const savingsRate =
    totalYearIncome > 0
      ? Math.max(0, Math.round(((totalYearIncome - totalYearExpense) / totalYearIncome) * 100))
      : 0;

  const currentMonthName =
    selectedData?.month_number && selectedData.month_number >= 1 && selectedData.month_number <= 12
      ? MONTH_SHORT[selectedData.month_number - 1]
      : "Mês";

  return (
    <View style={styles.container}>
      {/* Cabeçalho do Gráfico com Indicador e Tooltip Dinâmico */}
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartSubtitle}>Mês de {currentMonthName}</Text>
          <View style={styles.metricRow}>
            <Text style={[styles.metricText, { color: colors.primary }]}>
              + {formatCurrency(selectedData?.income || 0)}
            </Text>
            <Text style={styles.metricSeparator}>|</Text>
            <Text style={[styles.metricText, { color: colors.expense }]}>
              - {formatCurrency(selectedData?.expense || 0)}
            </Text>
          </View>
        </View>

        <View style={styles.savingsPill}>
          <Text style={styles.savingsPillLabel}>Economia anual</Text>
          <Text style={styles.savingsPillValue}>{savingsRate}%</Text>
        </View>
      </View>

      {/* Área das Barras Verticais */}
      <View style={styles.barsArea}>
        <View style={styles.guidelineTop} />
        <View style={styles.guidelineMid} />

        <View style={styles.barsContainer}>
          {fullYearData.map((item) => {
            const isSelected = item.month_number === activeMonth;
            const incPct = maxVal > 0 ? (item.income / maxVal) * 100 : 0;
            const expPct = maxVal > 0 ? (item.expense / maxVal) * 100 : 0;
            const hasData = item.income > 0 || item.expense > 0;

            const mIndex = (item.month_number || 1) - 1;
            const mLabel = mIndex >= 0 && mIndex < 12 ? MONTH_SHORT[mIndex] : "";

            return (
              <TouchableOpacity
                key={item.month_number}
                style={[styles.monthColumn, isSelected && styles.monthColumnActive]}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.month_number) {
                    setActiveMonth(item.month_number);
                    if (onSelectMonth) onSelectMonth(item.month_number);
                  }
                }}
              >
                <View style={styles.pairContainer}>
                  {/* Barra de Receita (Azul Fintech) */}
                  <View
                    style={[
                      styles.singleBar,
                      {
                        height: `${Math.max(incPct, item.income > 0 ? 8 : 3)}%`,
                        backgroundColor: isSelected ? colors.primary : colors.primaryLight,
                        opacity: hasData ? 1 : 0.25,
                      },
                    ]}
                  />
                  {/* Barra de Despesa (Vermelho Coral Frio) */}
                  <View
                    style={[
                      styles.singleBar,
                      {
                        height: `${Math.max(expPct, item.expense > 0 ? 8 : 3)}%`,
                        backgroundColor: colors.expense,
                        opacity: hasData ? 1 : 0.25,
                      },
                    ]}
                  />
                </View>

                {/* Rótulo do Mês */}
                <Text
                  style={[
                    styles.monthLabel,
                    isSelected && styles.monthLabelActive,
                  ]}
                >
                  {mLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Legenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Receitas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
          <Text style={styles.legendText}>Despesas</Text>
        </View>
      </View>
    </View>
  );
};

/**
 * Gráfico 2: Distribuição de Gastos por Categoria
 * Segmented Progress Bar + Lista Detalhada na Paleta Fria Harmônica
 */
export const CategoryDistributionChart: React.FC<{
  categories?: CategoryExpenseItem[];
}> = ({ categories = [] }) => {
  const safeCategories = Array.isArray(categories) ? categories : [];

  const parsed = safeCategories.map((c) => ({
    name: String(c.category || "Geral"),
    total: Math.max(0, Number(c.total) || 0),
  }));

  const grandTotal = parsed.reduce((sum, c) => sum + c.total, 0);

  if (parsed.length === 0 || grandTotal <= 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎯</Text>
        <Text style={styles.emptyTitle}>Sem despesas no período</Text>
        <Text style={styles.emptySub}>
          Os gastos deste mês aparecerão categorizados aqui graficamente.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra Segmentada Multicolorida Estilo Apple/Stripe */}
      <View style={styles.segmentedBar}>
        {parsed.map((item, idx) => {
          const pct = grandTotal > 0 ? (item.total / grandTotal) * 100 : 0;
          const color = chartPalette[idx % chartPalette.length];
          return (
            <View
              key={`${item.name}-${idx}`}
              style={[
                styles.segment,
                {
                  width: `${Math.max(pct, 1)}%`,
                  backgroundColor: color,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Lista com Swatches e Percentuais */}
      <View style={styles.catList}>
        {parsed.map((item, idx) => {
          const pct = grandTotal > 0 ? Math.round((item.total / grandTotal) * 100) : 0;
          const color = chartPalette[idx % chartPalette.length];

          return (
            <View key={`${item.name}-${idx}`} style={styles.catItem}>
              <View style={styles.catLeft}>
                <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                <Text style={styles.catTitle} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>

              <View style={styles.catRight}>
                <View style={[styles.pctBadge, { backgroundColor: `${color}18` }]}>
                  <Text style={[styles.pctBadgeText, { color }]}>{pct}%</Text>
                </View>
                <Text style={styles.catAmount}>{formatCurrency(item.total)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chartSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  metricText: {
    fontSize: 13,
    fontWeight: "700",
  },
  metricSeparator: {
    color: colors.borderStrong,
    fontSize: 12,
  },
  savingsPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  savingsPillLabel: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  savingsPillValue: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "900",
  },

  barsArea: {
    height: 140,
    position: "relative",
    justifyContent: "flex-end",
    marginTop: spacing.sm,
  },
  guidelineTop: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.surfaceAlt,
  },
  guidelineMid: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.surfaceAlt,
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    justifyContent: "space-between",
    paddingBottom: 22,
  },
  monthColumn: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    paddingHorizontal: 2,
    borderRadius: radius.sm,
  },
  monthColumnActive: {
    backgroundColor: colors.primarySoft,
  },
  pairContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: "100%",
    width: "100%",
    justifyContent: "center",
  },
  singleBar: {
    width: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 2,
  },
  monthLabel: {
    position: "absolute",
    bottom: 2,
    color: colors.textFaint,
    fontSize: 10,
    fontWeight: "600",
  },
  monthLabelActive: {
    color: colors.primary,
    fontWeight: "800",
  },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  // Segmented Bar Styles
  segmentedBar: {
    flexDirection: "row",
    height: 12,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
    marginVertical: spacing.md,
  },
  segment: {
    height: "100%",
  },
  catList: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  catItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  catLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  colorSwatch: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  catTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  catRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pctBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  pctBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  catAmount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    minWidth: 80,
    textAlign: "right",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});
