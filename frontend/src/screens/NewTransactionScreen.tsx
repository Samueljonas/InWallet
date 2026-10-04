import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api, fetchAll } from "../api/client";
import { Account, Category, Transaction } from "../types";
import { Button, Card, Chip, Field, Header, Screen } from "../components/ui";
import { colors, radius, spacing } from "../theme";
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  // criação rápida
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

  // mantém a categoria selecionada coerente com o tipo (despesa/receita)
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
      amount: value!.toFixed(2),
      date: iso,
      description: description.trim(),
    };

    try {
      setSaving(true);
      if (editing) {
        await api.patch(`/api/v1/transactions/${editing.id}/`, payload);
      } else {
        await api.post("/api/v1/transactions/", { ...payload, type });
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
      "O saldo da conta será ajustado.",
    );
    if (!ok) return;
    try {
      await api.delete(`/api/v1/transactions/${editing.id}/`);
      onSaved();
    } catch (err) {
      notify("Erro ao excluir", extractErrorMessage(err));
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Header
          title={editing ? "Editar transação" : "Nova transação"}
          left={
            <TouchableOpacity onPress={onGoBack} hitSlop={10}>
              <Text style={styles.back}>←</Text>
            </TouchableOpacity>
          }
        />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tipo */}
          {editing ? (
            <Text style={[styles.lockedType, { color: accent }]}>
              {isExpense ? "↓ Despesa" : "↑ Receita"}
            </Text>
          ) : (
            <View style={styles.typeSwitch}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  isExpense && { backgroundColor: colors.expense },
                ]}
                onPress={() => setType("expense")}
              >
                <Text
                  style={[styles.typeText, isExpense && styles.typeTextActive]}
                >
                  ↓ Despesa
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  !isExpense && { backgroundColor: colors.income },
                ]}
                onPress={() => setType("income")}
              >
                <Text
                  style={[styles.typeText, !isExpense && styles.typeTextActive]}
                >
                  ↑ Receita
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!!generalError && (
            <Text style={styles.generalError}>{generalError}</Text>
          )}

          {loadingData ? (
            <ActivityIndicator
              color={colors.primaryLight}
              style={{ marginTop: spacing.xl }}
            />
          ) : (
            <>
              {/* Valor */}
              <Card style={{ marginTop: spacing.lg }}>
                <Text style={styles.amountLabel}>Valor</Text>
                <View style={styles.amountRow}>
                  <Text style={[styles.currency, { color: accent }]}>R$</Text>
                  <Field
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0,00"
                    keyboardType="decimal-pad"
                    style={[styles.amountInput, { color: accent }]}
                    error={errors.amount}
                    autoFocus={!editing}
                  />
                </View>
              </Card>

              <Field
                label="Descrição"
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Almoço, Salário, Uber..."
              />

              {/* Data */}
              <Field
                label="Data"
                value={dateText}
                onChangeText={setDateText}
                placeholder="dd/mm/aaaa"
                keyboardType="numbers-and-punctuation"
                error={errors.date}
              />
              <View style={styles.chips}>
                <Chip label="Hoje" onPress={() => setDay(0)} />
                <Chip label="Ontem" onPress={() => setDay(-1)} />
              </View>

              {/* Conta */}
              <Text style={styles.sectionLabel}>Conta</Text>
              <View style={styles.chips}>
                {accounts.map((acc) => (
                  <Chip
                    key={acc.id}
                    label={`${acc.name} • ${formatCurrency(acc.balance)}`}
                    active={accountId === acc.id}
                    onPress={() => setAccountId(acc.id)}
                  />
                ))}
                <Chip
                  label={showNewAccount ? "× Cancelar" : "+ Nova conta"}
                  onPress={() => setShowNewAccount((s) => !s)}
                />
              </View>
              {!!errors.account && (
                <Text style={styles.fieldError}>{errors.account}</Text>
              )}
              {showNewAccount && (
                <Card style={styles.quickCard}>
                  <Field
                    label="Nome da conta"
                    value={newAccountName}
                    onChangeText={setNewAccountName}
                    placeholder="Ex: Nubank, Carteira"
                  />
                  <Field
                    label="Saldo inicial (opcional)"
                    value={newAccountBalance}
                    onChangeText={setNewAccountBalance}
                    placeholder="0,00"
                    keyboardType="decimal-pad"
                  />
                  <Button
                    title="Criar conta"
                    small
                    loading={creating}
                    onPress={createAccount}
                    style={{ marginTop: spacing.md }}
                  />
                </Card>
              )}

              {/* Categoria */}
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
                  label={showNewCategory ? "× Cancelar" : "+ Nova categoria"}
                  onPress={() => setShowNewCategory((s) => !s)}
                />
              </View>
              {!!errors.category && (
                <Text style={styles.fieldError}>{errors.category}</Text>
              )}
              {showNewCategory && (
                <Card style={styles.quickCard}>
                  <Field
                    label={`Nova categoria de ${isExpense ? "despesa" : "receita"}`}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder={
                      isExpense
                        ? "Ex: Mercado, Transporte"
                        : "Ex: Salário, Freelance"
                    }
                  />
                  <Button
                    title="Criar categoria"
                    small
                    loading={creating}
                    onPress={createCategory}
                    style={{ marginTop: spacing.md }}
                  />
                </Card>
              )}

              <Button
                title={editing ? "Salvar alterações" : "Salvar transação"}
                variant={isExpense ? "danger" : "success"}
                onPress={handleSubmit}
                loading={saving}
                style={{ marginTop: spacing.xl }}
              />
              {editing && (
                <Button
                  title="Excluir transação"
                  variant="ghost"
                  onPress={handleDelete}
                  style={{ marginTop: spacing.md }}
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
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  back: { color: colors.primaryLight, fontSize: 28, fontWeight: "600" },
  typeSwitch: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  typeText: { color: colors.textMuted, fontWeight: "700", fontSize: 14 },
  typeTextActive: { color: colors.white },
  lockedType: { fontSize: 16, fontWeight: "800" },
  generalError: {
    color: colors.expense,
    backgroundColor: colors.expenseBg,
    padding: spacing.md,
    borderRadius: 8,
    fontSize: 13,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  amountLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  amountRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  currency: { fontSize: 24, fontWeight: "800", marginTop: spacing.md },
  amountInput: { fontSize: 28, fontWeight: "800" },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickCard: { marginTop: spacing.md, backgroundColor: colors.surfaceAlt },
  fieldError: { color: colors.expense, fontSize: 12, marginTop: 4 },
});
