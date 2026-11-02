import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, radius, shadowCard, shadowHero, spacing } from "../theme";
import { Button } from "./ui";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { extractErrorMessage, notify } from "../utils/format";

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSubscribe?: (planType: "monthly" | "yearly") => void;
}

const PRO_BENEFITS = [
  {
    icon: "🏦",
    title: "Contas Bancárias Ilimitadas",
    desc: "Cadastre quantas contas, carteiras e cartões precisar (Free: máx. 2).",
  },
  {
    icon: "🎯",
    title: "Metas de Gastos por Categoria",
    desc: "Defina tetos mensais com alertas visuais no Dashboard para não estourar o orçamento.",
  },
  {
    icon: "💳",
    title: "Parcelamento e Despesas Recorrentes",
    desc: "Lance compras parceladas em até 48x ou repita custos fixos todo mês automaticamente.",
  },
  {
    icon: "📥",
    title: "Exportação Completa em Planilha (CSV)",
    desc: "Exporte relatórios financeiros com 1 clique para Excel, Google Sheets ou contador.",
  },
  {
    icon: "⚡",
    title: "Suporte Prioritário & Novidades Antecipadas",
    desc: "Acesso em primeira mão a integrações de Open Finance e novos recursos.",
  },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onSubscribe,
}) => {
  const { refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [subscribing, setSubscribing] = useState(false);

  async function handleAction() {
    if (onSubscribe) {
      onSubscribe(selectedPlan);
      return;
    }

    try {
      setSubscribing(true);
      await api.post("/accounts/api/v1/auth/subscription/upgrade/", {
        period: selectedPlan,
      });
      await refreshUser();
      notify(
        "Parabéns! 🎉",
        "Sua conta agora é InWallet PRO com todos os recursos desbloqueados!"
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      notify(
        "Erro na assinatura",
        extractErrorMessage(err, "Não foi possível processar a ativação do plano.")
      );
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.container, shadowHero]}>
          {/* Header com Botão Fechar */}
          <View style={styles.header}>
            <View style={styles.badgePro}>
              <Text style={styles.badgeProText}>INWALLET PRO</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Desbloqueie o poder total das suas finanças</Text>
            <Text style={styles.subtitle}>
              Tenha controle absoluto com orçamentos por categoria, contas ilimitadas e relatórios avançados.
            </Text>

            {/* Lista de Benefícios */}
            <View style={styles.benefitsList}>
              {PRO_BENEFITS.map((item, idx) => (
                <View key={idx} style={styles.benefitItem}>
                  <View style={styles.benefitIconWrap}>
                    <Text style={styles.benefitIcon}>{item.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.benefitTitle}>{item.title}</Text>
                    <Text style={styles.benefitDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Seleção de Planos (Mensal vs Anual) */}
            <View style={styles.plansWrap}>
              {/* Plano Anual com Destaque de Economia */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === "yearly" && styles.planCardActive,
                  shadowCard,
                ]}
                onPress={() => setSelectedPlan("yearly")}
                activeOpacity={0.85}
              >
                <View style={styles.discountTag}>
                  <Text style={styles.discountTagText}>33% OFF - MAIS VANTAJOSO</Text>
                </View>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>Plano Anual</Text>
                  <Text style={styles.planPrice}>
                    R$ 9,90 <Text style={styles.planPeriod}>/ mês</Text>
                  </Text>
                </View>
                <Text style={styles.planBillingNote}>Cobrado anualmente (R$ 119,00/ano)</Text>
              </TouchableOpacity>

              {/* Plano Mensal */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === "monthly" && styles.planCardActive,
                  shadowCard,
                ]}
                onPress={() => setSelectedPlan("monthly")}
                activeOpacity={0.85}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>Plano Mensal</Text>
                  <Text style={styles.planPrice}>
                    R$ 14,90 <Text style={styles.planPeriod}>/ mês</Text>
                  </Text>
                </View>
                <Text style={styles.planBillingNote}>Cancele a qualquer momento sem taxas</Text>
              </TouchableOpacity>
            </View>

            {/* Botão de Ação */}
            <Button
              title={
                selectedPlan === "yearly"
                  ? "Assinar Plano Anual por R$ 119"
                  : "Assinar Plano Mensal por R$ 14,90"
              }
              loading={subscribing}
              onPress={handleAction}
              style={styles.subscribeBtn}
            />

            <Text style={styles.guaranteeText}>
              🔒 Pagamento seguro • Cancele quando quiser com 1 clique
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  container: {
    backgroundColor: colors.white,
    width: "100%",
    maxWidth: 580,
    maxHeight: "92%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: Platform.select({ ios: 34, android: 24, default: 20 }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  badgePro: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeProText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  scroll: {
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 18,
  },
  benefitsList: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  benefitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitIcon: {
    fontSize: 18,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.2,
  },
  benefitDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  plansWrap: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  planCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    position: "relative",
  },
  planCardActive: {
    borderColor: colors.primary,
    backgroundColor: "#F0F7FF",
  },
  discountTag: {
    position: "absolute",
    top: -10,
    right: 14,
    backgroundColor: colors.income,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  discountTagText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
  },
  planPeriod: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  planBillingNote: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  subscribeBtn: {
    marginTop: spacing.xl,
    paddingVertical: 14,
  },
  guaranteeText: {
    textAlign: "center",
    color: colors.textFaint,
    fontSize: 11,
    marginTop: spacing.md,
    fontWeight: "500",
  },
});
