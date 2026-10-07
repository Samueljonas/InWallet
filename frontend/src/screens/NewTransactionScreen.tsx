import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api, fetchAll } from "../api/client";
import { Account, Category, Transaction } from "../types";
import { Button, Card, Chip, Field, Header, Screen } from "../components/ui";
import { colors, radius, shadowCard, spacing } from "../theme";
import {
  brDateToIso,
  confirmAction,
  extractErrorMessage,
  extractFieldErrors,
  formatCurrency,
  formatDate,
  notify,
  parseAmount,
  toIsoDate,
} from "../utils/format";

interface Props {
  editing?: Transaction;
  onGoBack: () => void;
  onSaved: () => void;
}

export const NewTransactionScreen: React.FC<Props> = ({
  editing,
  onGoBack,
  onSaved,
}) => {
  const [type, setType] = useState<"expense" | "income">(
    editing?.type ?? "expense",
  );
  const [amount, setAmount] = useState(
    editing ? String(Number(editing.amount)).replace(".", ",") : "",
  );
  const [description, setDescription] = useState(editing?.description ?? "");
  const [dateText, setDateText] = useState(
    editing ? formatDate(editing.date) : formatDate(toIsoDate(new Date())),
  );

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountId, setAccountId] = useState<number | null>(
    editing?.account ?? null,
  );
  const [categoryId, setCategoryId] = useState<number | null>(
    editing?.category ?? null,
  );

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  // Criação rápida de conta e categoria inline
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creating, setCreating] = useState(false);

  const visibleCategories = categories.filter((c) => c.type === type);
  const isExpense = type === "expense";
  const accent = isExpense ? colors.expense : colors.income;

  useEffect(() => {
    (async () => {
      try {
        const [accs, cats] = await Promise.all([
          fetchAll<Account>("/api/v1/accounts/"),
          fetchAll<Category>("/api/v1/categories/"),
        ]);
        setAccounts(accs);
        setCategories(cats);
        setAccountId((cur) => cur ?? accs[0]?.id ?? null);
        setShowNewAccount(accs.length === 0);
      } catch (err) {
        setGeneralError(
          extractErrorMessage(
            err,
            "Não foi possível carregar contas e categorias.",
          ),
        );
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  // Mantém categoria selecionada coerente com o tipo (despesa/receita)
  useEffect(() => {
    if (loadingData) return;
    if (!visibleCategories.some((c) => c.id === categoryId)) {
      setCategoryId(visibleCategories[0]?.id ?? null);
    }
    setShowNewCategory(visibleCategories.length === 0);
  }, [type, categories, loadingData]);

  function setDay(offset: number) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    setDateText(formatDate(toIsoDate(d)));
  }

  async function createAccount() {
    if (!newAccountName.trim()) return;
    const initial = newAccountBalance.trim()
      ? parseAmount(newAccountBalance)
      : 0;
    if (initial === null || initial < 0) {
      notify("Saldo inválido", "Informe um saldo inicial válido (ex: 150,00).");
      return;
    }
    try {
      setCreating(true);
      const res = await api.post<Account>("/api/v1/accounts/", {
        name: newAccountName.trim(),
        balance: initial.toFixed(2),
      });
      setAccounts((prev) => [...prev, res.data]);
      setAccountId(res.data.id);
      setNewAccountName("");
      setNewAccountBalance("");
      setShowNewAccount(false);
    } catch (err) {
      notify("Erro ao criar conta", extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function createCategory() {
    if (!newCategoryName.trim()) return;
    try {
      setCreating(true);
      const res = await api.post<Category>("/api/v1/categories/", {
        name: newCategoryName.trim(),
        type,
      });
      setCategories((prev) => [...prev, res.data]);
      setCategoryId(res.data.id);
      setNewCategoryName("");
      setShowNewCategory(false);
    } catch (err) {
      notify("Erro ao criar categoria", extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleSubmit() {
    setGeneralError("");
    const e: Record<string, string> = {};
    const value = parseAmount(amount);
    if (value === null || value <= 0)
      e.amount = "Informe um valor maior que zero.";
    const iso = brDateToIso(dateText);
    if (!iso) e.date = "Use o formato dd/mm/aaaa.";
    if (!accountId) e.account = "Selecione ou crie uma conta.";
    if (!categoryId) e.category = "Selecione ou crie uma categoria.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      account: accountId,
      category: categoryId,
      type,
      amount: value!.toFixed(2),
      date: iso,
      description: description.trim(),
    };

    try {
      setSaving(true);
      if (editing) {
        await api.patch(`/api/v1/transactions/${editing.id}/`, payload);
      } else {
        await api.post("/api/v1/transactions/", payload);
      }
      onSaved();
    } catch (err) {
      const fields = extractFieldErrors(err);
      const mapped: Record<string, string> = {};
      ["amount", "date", "account", "category"].forEach((k) => {
        if (fields[k]) mapped[k] = fields[k];
      });
      if (Object.keys(mapped).length) setErrors(mapped);
      else
        setGeneralError(
          extractErrorMessage(err, "Não foi possível salvar a transação."),
        );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    const ok = await confirmAction(
      "Excluir transação?",
      "O lançamento será apagado e o saldo da conta será recalculado automaticamente.",
    );
    if (!ok) return;
    try {
      setDeleting(true);
      await api.delete(`/api/v1/transactions/${editing.id}/`);
      onSaved();
    } catch (err) {
      notify("Erro ao excluir", extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Header
          title={editing ? "Editar Lançamento" : "Nova Transação"}
          subtitle={
            editing
              ? "Modifique os dados ou exclua o lançamento"
              : "Preencha os dados da sua despesa ou receita"
          }
          left={
            <TouchableOpacity onPress={onGoBack} hitSlop={10} style={styles.backBtn}>
              <Text style={styles.back}>←</Text>
            </TouchableOpacity>
          }
        />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Seletor de Tipo (Despesa vs Receita) */}
          <View style={[styles.typeSwitch, shadowCard]}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                isExpense ? styles.typeBtnExpenseActive : styles.typeBtnInactive,
              ]}
              onPress={() => setType("expense")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.typeText,
                  isExpense ? styles.typeTextActive : styles.typeTextInactive,
                ]}
              >
                ↓ Despesa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                !isExpense ? styles.typeBtnIncomeActive : styles.typeBtnInactive,
              ]}
              onPress={() => setType("income")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.typeText,
                  !isExpense ? styles.typeTextActive : styles.typeTextInactive,
                ]}
              >
                ↑ Receita
              </Text>
            </TouchableOpacity>
          </View>

          {!!generalError && (
            <Text style={styles.generalError}>{generalError}</Text>
          )}

          {loadingData ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.xl }}
            />
          ) : (
            <>
              {/* Card de Valor de Alto Destaque */}
              <View style={[styles.amountCard, shadowCard]}>
                <Text style={styles.amountLabel}>Valor do lançamento</Text>
                <View style={styles.amountRow}>
                  <Text style={[styles.currency, { color: accent }]}>R$</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0,00"
                    placeholderTextColor={colors.textFaint}
                    keyboardType="decimal-pad"
                    style={[styles.amountInput, { color: accent }]}
                    selectionColor={accent}
                    cursorColor={accent}
                    autoFocus={!editing}
                  />
                </View>
                {!!errors.amount && (
                  <Text style={styles.fieldError}>{errors.amount}</Text>
                )}
              </View>

              {/* Descrição */}
              <Field
                label="Descrição / Motivo"
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Supermercado, Aluguel, Salário, Freela..."
              />

              {/* Data com Atalhos Rápidos */}
              <Field
                label="Data da transação"
                value={dateText}
                onChangeText={setDateText}
                placeholder="dd/mm/aaaa"
                keyboardType="numbers-and-punctuation"
                error={errors.date}
              />
              <View style={styles.quickDateRow}>
                <Chip label="Hoje" onPress={() => setDay(0)} />
                <Chip label="Ontem" onPress={() => setDay(-1)} />
                <Chip label="Anteontem" onPress={() => setDay(-2)} />
              </View>

              {/* Seleção de Conta Bancária */}
              <Text style={styles.sectionLabel}>Conta vinculada</Text>
              <View style={styles.chips}>
                {accounts.map((acc) => (
                  <Chip
                    key={acc.id}
                    label={`${acc.name} (${formatCurrency(acc.balance)})`}
                    active={accountId === acc.id}
                    onPress={() => setAccountId(acc.id)}
                  />
                ))}
                <Chip
                  label={showNewAccount ? "✕ Fechar" : "+ Nova conta"}
                  onPress={() => setShowNewAccount((s) => !s)}
                />
              </View>
              {!!errors.account && (
                <Text style={styles.fieldError}>{errors.account}</Text>
              )}

              {showNewAccount && (
                <Card style={styles.quickCard}>
                  <Text style={styles.quickCardTitle}>Cadastrar Nova Conta</Text>
                  <Field
                    label="Nome da conta"
                    value={newAccountName}
                    onChangeText={setNewAccountName}
                    placeholder="Ex: Nubank, Inter, Carteira Física"
                  />
                  <Field
                    label="Saldo inicial (opcional)"
                    value={newAccountBalance}
                    onChangeText={setNewAccountBalance}
                    placeholder="0,00"
                    keyboardType="decimal-pad"
                  />
                  <Button
                    title="Criar e Vincular Conta"
                    small
                    loading={creating}
                    onPress={createAccount}
                    style={{ marginTop: spacing.md }}
                  />
                </Card>
              )}

              {/* Seleção de Categoria */}
              <Text style={styles.sectionLabel}>Categoria</Text>
              <View style={styles.chips}>
                {visibleCategories.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    active={categoryId === cat.id}
                    onPress={() => setCategoryId(cat.id)}
                  />
                ))}
                <Chip
                  label={showNewCategory ? "✕ Fechar" : "+ Nova categoria"}
                  onPress={() => setShowNewCategory((s) => !s)}
                />
              </View>
              {!!errors.category && (
                <Text style={styles.fieldError}>{errors.category}</Text>
              )}

              {showNewCategory && (
                <Card style={styles.quickCard}>
                  <Text style={styles.quickCardTitle}>
                    Nova Categoria de {isExpense ? "Despesa" : "Receita"}
                  </Text>
                  <Field
                    label="Nome da categoria"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder={
                      isExpense
                        ? "Ex: Supermercado, Transporte, Saúde"
                        : "Ex: Salário, Rendimentos, Pix"
                    }
                  />
                  <Button
                    title="Criar e Selecionar Categoria"
                    small
                    loading={creating}
                    onPress={createCategory}
                    style={{ marginTop: spacing.md }}
                  />
                </Card>
              )}

              {/* Botões Principais de Ação */}
              <Button
                title={editing ? "Salvar Alterações" : "Adicionar Lançamento"}
                variant={isExpense ? "danger" : "primary"}
                onPress={handleSubmit}
                loading={saving}
                style={{ marginTop: spacing.xl }}
              />

              {editing && (
                <Button
                  title="Excluir Transação"
                  variant="outline"
                  loading={deleting}
                  onPress={handleDelete}
                  style={{
                    marginTop: spacing.md,
                    borderColor: colors.expenseBorder,
                  }}
                />
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  backBtn: {
    padding: 6,
    borderRadius: radius.pill,
  },
  back: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: "700",
  },
  typeSwitch: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginTop: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: radius.pill,
  },
  typeBtnExpenseActive: {
    backgroundColor: colors.expense,
  },
  typeBtnIncomeActive: {
    backgroundColor: colors.income,
  },
  typeBtnInactive: {
    backgroundColor: "transparent",
  },
  typeText: {
    fontWeight: "800",
    fontSize: 14,
  },
  typeTextActive: {
    color: colors.white,
  },
  typeTextInactive: {
    color: "#334155", // Slate 700 - explicitly dark and readable
  },
  generalError: {
    color: colors.expense,
    backgroundColor: colors.expenseBg,
    padding: spacing.md,
    borderRadius: radius.md,
    fontSize: 13,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.expenseBorder,
    overflow: "hidden",
  },

  amountCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginTop: spacing.lg,
  },
  amountLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  currency: {
    fontSize: 28,
    fontWeight: "900",
  },
  amountInput: {
    flex: 1,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
    paddingVertical: 4,
  },

  quickDateRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  quickCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickCardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  fieldError: {
    color: colors.expense,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
});
