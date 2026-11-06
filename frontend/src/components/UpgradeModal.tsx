import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { radius, spacing } from "../theme";
import { createThemedStyles, useTheme } from "../contexts/ThemeContext";
import { Button, Input } from "./ui";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { extractErrorMessage, notify } from "../utils/format";
import { Icon, IconName } from "./Icon";

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSubscribe?: (planType: "monthly" | "yearly") => void;
}

const PRO_BENEFITS: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: "wallet",
    title: "Contas Bancárias Ilimitadas",
    desc: "Cadastre quantas contas, carteiras e cartões precisar (Free: máx. 2).",
  },
  {
    icon: "target",
    title: "Metas de Gastos por Categoria",
    desc: "Defina tetos mensais com alertas visuais no Dashboard para não estourar o orçamento.",
  },
  {
    icon: "repeat",
    title: "Parcelamento e Despesas Recorrentes",
    desc: "Lance compras parceladas em até 48x ou repita custos fixos todo mês automaticamente.",
  },
  {
    icon: "download",
    title: "Importação OFX/CSV e Exportação em Planilha",
    desc: "Importe extratos bancários e exporte relatórios com 1 clique para Excel.",
  },
  {
    icon: "spark",
    title: "Suporte Prioritário & Novidades Antecipadas",
    desc: "Acesso em primeira mão ao hub de investimentos e novos recursos.",
  },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onSubscribe,
}) => {
  const { refreshUser } = useAuth();
  const { colors, shadowCard, shadowHero } = useTheme();
  const styles = useStyles();
  const [step, setStep] = useState<"plans" | "checkout">("plans");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card">("pix");
  const [subscribing, setSubscribing] = useState(false);

  // Pix state
  const [pixTransaction, setPixTransaction] = useState<{
    external_id: string;
    pix_payload: string;
    amount: string;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Credit Card state
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  function resetAndClose() {
    setStep("plans");
    setPixTransaction(null);
    setCopiedPix(false);
    onClose();
  }

  async function handleProceedToCheckout() {
    if (onSubscribe) {
      onSubscribe(selectedPlan);
      return;
    }
    setStep("checkout");
    if (paymentMethod === "pix" && !pixTransaction) {
      await generatePixCheckout(selectedPlan);
    }
  }

  async function generatePixCheckout(plan: "monthly" | "yearly") {
    try {
      setSubscribing(true);
      const { data } = await api.post("/accounts/api/v1/auth/subscription/checkout/", {
        period: plan,
        payment_method: "pix",
      });
      setPixTransaction({
        external_id: data.external_id,
        pix_payload: data.pix_payload || "",
        amount: data.amount,
      });
    } catch (err) {
      notify(
        "Erro ao gerar Pix",
        extractErrorMessage(err, "Não foi possível gerar o código Pix.")
      );
    } finally {
      setSubscribing(false);
    }
  }

  function handleCopyPix() {
    if (!pixTransaction?.pix_payload) return;
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pixTransaction.pix_payload);
    }
    setCopiedPix(true);
    notify("Código Pix copiado", "Cole o código no aplicativo do seu banco para pagar.");
  }

  async function handleConfirmPixPayment() {
    if (!pixTransaction?.external_id) return;
    try {
      setSubscribing(true);
      await api.post(
        `/accounts/api/v1/auth/subscription/confirm/${pixTransaction.external_id}/`
      );
      await refreshUser();
      notify(
        "Assinatura ativa",
        "Pagamento Pix confirmado! Sua conta agora é InWallet PRO."
      );
      onSuccess?.();
      resetAndClose();
    } catch (err) {
      notify(
        "Erro na confirmação",
        extractErrorMessage(err, "Não foi possível confirmar o pagamento Pix.")
      );
    } finally {
      setSubscribing(false);
    }
  }

  async function handleCardCheckout() {
    const cleanNum = cardNumber.replace(/\D/g, "");
    if (cleanNum.length < 13 || !cardHolder.trim() || cardExpiry.length < 4 || cardCvv.length < 3) {
      notify("Dados incompletos", "Preencha todos os dados do cartão de crédito.");
      return;
    }

    try {
      setSubscribing(true);
      await api.post("/accounts/api/v1/auth/subscription/checkout/", {
        period: selectedPlan,
        payment_method: "credit_card",
        card: {
          holder_name: cardHolder.trim(),
          number: cleanNum,
          expiry: cardExpiry.trim(),
          cvv: cardCvv.trim(),
        },
      });
      await refreshUser();
      notify(
        "Assinatura ativa",
        "Pagamento aprovado! Sua conta agora é InWallet PRO."
      );
      onSuccess?.();
      resetAndClose();
    } catch (err) {
      notify(
        "Pagamento recusado",
        extractErrorMessage(err, "Não foi possível processar o cartão informado.")
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
      onRequestClose={resetAndClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.container, shadowHero]}>
          {/* Header com Botão Fechar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {step === "checkout" && (
                <TouchableOpacity
                  onPress={() => setStep("plans")}
                  style={styles.backBtn}
                  hitSlop={10}
                >
                  <Icon name="arrow-left" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              <View style={styles.badgePro}>
                <Text style={styles.badgeProText}>INWALLET PRO</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={resetAndClose}
              hitSlop={12}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Icon name="close" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {step === "plans" ? (
              <>
                <Text style={styles.title}>
                  Desbloqueie o potencial completo das suas finanças
                </Text>
                <Text style={styles.subtitle}>
                  Tenha controle absoluto com orçamentos por categoria, contas
                  ilimitadas e relatórios avançados.
                </Text>

                {/* Lista de Benefícios */}
                <View style={styles.benefitsList}>
                  {PRO_BENEFITS.map((item, idx) => (
                    <View key={idx} style={styles.benefitItem}>
                      <View style={styles.benefitIconWrap}>
                        <Icon name={item.icon} size={16} color={colors.primary} />
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
                  <TouchableOpacity
                    style={[
                      styles.planCard,
                      selectedPlan === "yearly" && styles.planCardActive,
                      shadowCard,
                    ]}
                    onPress={() => {
                      setSelectedPlan("yearly");
                      setPixTransaction(null);
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.discountTag}>
                      <Text style={styles.discountTagText}>
                        33% OFF — MAIS VANTAJOSO
                      </Text>
                    </View>
                    <View style={styles.planHeader}>
                      <Text style={styles.planName}>Plano Anual</Text>
                      <Text style={styles.planPrice}>
                        R$ 9,90 <Text style={styles.planPeriod}>/ mês</Text>
                      </Text>
                    </View>
                    <Text style={styles.planBillingNote}>
                      Cobrado anualmente (R$ 119,00/ano)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.planCard,
                      selectedPlan === "monthly" && styles.planCardActive,
                      shadowCard,
                    ]}
                    onPress={() => {
                      setSelectedPlan("monthly");
                      setPixTransaction(null);
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.planHeader}>
                      <Text style={styles.planName}>Plano Mensal</Text>
                      <Text style={styles.planPrice}>
                        R$ 14,90 <Text style={styles.planPeriod}>/ mês</Text>
                      </Text>
                    </View>
                    <Text style={styles.planBillingNote}>
                      Cancele a qualquer momento sem taxas
                    </Text>
                  </TouchableOpacity>
                </View>

                <Button
                  title={
                    selectedPlan === "yearly"
                      ? "Continuar • Plano Anual (R$ 119,00)"
                      : "Continuar • Plano Mensal (R$ 14,90)"
                  }
                  loading={subscribing}
                  onPress={handleProceedToCheckout}
                  style={styles.subscribeBtn}
                />
              </>
            ) : (
              <>
                <Text style={styles.title}>Finalizar assinatura</Text>
                <Text style={styles.subtitle}>
                  {selectedPlan === "yearly"
                    ? "Plano Anual InWallet PRO • R$ 119,00 / ano"
                    : "Plano Mensal InWallet PRO • R$ 14,90 / mês"}
                </Text>

                {/* Seletor Pix vs Cartão */}
                <View style={styles.methodTabs}>
                  <TouchableOpacity
                    style={[
                      styles.methodTab,
                      paymentMethod === "pix" && styles.methodTabActive,
                    ]}
                    onPress={() => {
                      setPaymentMethod("pix");
                      if (!pixTransaction) generatePixCheckout(selectedPlan);
                    }}
                  >
                    <Text
                      style={[
                        styles.methodTabText,
                        paymentMethod === "pix" && styles.methodTabTextActive,
                      ]}
                    >
                      Pix Instantâneo
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.methodTab,
                      paymentMethod === "credit_card" && styles.methodTabActive,
                    ]}
                    onPress={() => setPaymentMethod("credit_card")}
                  >
                    <Text
                      style={[
                        styles.methodTabText,
                        paymentMethod === "credit_card" && styles.methodTabTextActive,
                      ]}
                    >
                      Cartão de Crédito
                    </Text>
                  </TouchableOpacity>
                </View>

                {paymentMethod === "pix" ? (
                  <View style={styles.pixBox}>
                    <Text style={styles.pixTitle}>
                      Pix Copia e Cola (Liberação Imediata)
                    </Text>
                    <Text style={styles.pixDesc}>
                      Copie o código EMV abaixo e cole na opção "Pix Copia e Cola"
                      do seu banco.
                    </Text>

                    <View style={styles.pixCodeContainer}>
                      <Text style={styles.pixCodeText} numberOfLines={3} selectable>
                        {pixTransaction?.pix_payload || "Gerando código Pix..."}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.copyPixBtn}
                      onPress={handleCopyPix}
                      disabled={!pixTransaction?.pix_payload}
                    >
                      <Icon
                        name={copiedPix ? "check" : "copy"}
                        size={14}
                        color={colors.primaryLight}
                      />
                      <Text style={styles.copyPixBtnText}>
                        {copiedPix ? "Código Pix Copiado" : "Copiar Código Pix"}
                      </Text>
                    </TouchableOpacity>

                    <Button
                      title="Já realizei o pagamento • Liberar PRO"
                      loading={subscribing}
                      onPress={handleConfirmPixPayment}
                      style={{ marginTop: spacing.md }}
                    />
                  </View>
                ) : (
                  <View style={styles.cardForm}>
                    <Input
                      label="Nome impresso no cartão"
                      placeholder="Ex.: SAMUEL SILVA"
                      value={cardHolder}
                      onChangeText={setCardHolder}
                      autoCapitalize="characters"
                    />
                    <Input
                      label="Número do cartão"
                      placeholder="0000 0000 0000 0000"
                      keyboardType="numeric"
                      value={cardNumber}
                      onChangeText={setCardNumber}
                      maxLength={19}
                    />
                    <View style={styles.cardRow}>
                      <View style={{ flex: 1 }}>
                        <Input
                          label="Validade (MM/AA)"
                          placeholder="12/30"
                          value={cardExpiry}
                          onChangeText={setCardExpiry}
                          maxLength={5}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Input
                          label="CVV"
                          placeholder="123"
                          keyboardType="numeric"
                          value={cardCvv}
                          onChangeText={setCardCvv}
                          maxLength={4}
                          secureTextEntry
                        />
                      </View>
                    </View>

                    <Button
                      title={
                        selectedPlan === "yearly"
                          ? "Pagar R$ 119,00 e Ativar PRO"
                          : "Pagar R$ 14,90 e Ativar PRO"
                      }
                      loading={subscribing}
                      onPress={handleCardCheckout}
                      style={{ marginTop: spacing.sm }}
                    />
                  </View>
                )}
              </>
            )}

            <View style={styles.guaranteeRow}>
              <Icon name="lock" size={12} color={colors.textFaint} />
              <Text style={styles.guaranteeText}>
                Ambiente criptografado • Cancele quando quiser
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = createThemedStyles(({ colors }) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 15, 30, 0.78)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  container: {
    backgroundColor: colors.surface,
    width: "100%",
    maxWidth: 560,
    maxHeight: "92%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: Platform.select({ ios: 34, android: 24, default: 24 }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  badgePro: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeProText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 20,
  },
  benefitsList: {
    marginTop: spacing.lg,
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
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  benefitDesc: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  plansWrap: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  planCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    position: "relative",
  },
  planCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  discountTag: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  discountTagText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  planName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primaryLight,
  },
  planPeriod: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMuted,
  },
  planBillingNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  subscribeBtn: {
    marginTop: spacing.xl,
  },
  methodTabs: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  methodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  methodTabActive: {
    backgroundColor: colors.primary,
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  methodTabTextActive: {
    color: colors.white,
  },
  pixBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  pixTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  pixDesc: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  pixCodeContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pixCodeText: {
    fontSize: 11.5,
    color: colors.text,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    lineHeight: 16,
  },
  copyPixBtn: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  copyPixBtnText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: "600",
  },
  cardForm: {
    marginTop: spacing.xs,
  },
  cardRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  guaranteeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  guaranteeText: {
    fontSize: 12,
    color: colors.textFaint,
    fontWeight: "500",
  },
}));
