import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api, fetchAll } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { Account, Budget, Category } from "../types";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Header,
  Screen,
  SectionTitle,
} from "../components/ui";
import { LegalDocType, LegalModal } from "../components/LegalModal";
import { UpgradeModal } from "../components/UpgradeModal";
import { Icon } from "../components/Icon";
import { radius, spacing } from "../theme";
import { createThemedStyles, useTheme } from "../contexts/ThemeContext";
import {
  confirmAction,
  extractErrorMessage,
  formatCurrency,
  formatCurrencyInput,
  formatDate,
  notify,
  parseAmount,
} from "../utils/format";

type Segment = "accounts" | "categories" | "budgets";

interface RowProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  editing: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}

const ItemRow: React.FC<RowProps> = (p) => {
  const { colors, shadowCard } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.row, shadowCard]}>
      {p.editing ? (
        <View style={{ flex: 1 }}>
          <Field
            value={p.editValue}
            onChangeText={p.onEditChange}
            placeholder="Novo nome"
            autoFocus
          />
          <View style={styles.editActions}>
            <Button title="Salvar" small onPress={p.onSaveEdit} />
            <Button
              title="Cancelar"
              small
              variant="ghost"
              onPress={p.onCancelEdit}
            />
          </View>
        </View>
      ) : (
        <>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{p.title}</Text>
            {!!p.subtitle && <Text style={styles.rowSub}>{p.subtitle}</Text>}
          </View>
          {!!p.badge && (
            <View
              style={[
                styles.rowBadge,
                {
                  backgroundColor: p.badgeColor
                    ? `${p.badgeColor}18`
                    : colors.surfaceAlt,
                },
              ]}
            >
              <Text
                style={[
                  styles.rowBadgeText,
                  { color: p.badgeColor || colors.textMuted },
                ]}
              >
                {p.badge}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={p.onStartEdit}
            hitSlop={8}
            style={styles.iconBtn}
            accessibilityLabel="Editar lançamento"
            accessibilityRole="button"
          >
            <Icon name="edit" size={14} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={p.onDelete}
            hitSlop={8}
            style={styles.iconBtn}
            accessibilityLabel="Excluir lançamento"
            accessibilityRole="button"
          >
            <Icon name="trash" size={14} color={colors.expense} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export const ManageScreen: React.FC<{
  refreshKey: number;
  onChanged: () => void;
}> = ({ refreshKey, onChanged }) => {
  const { user, logout, deleteAccount, refreshUser } = useAuth();
  const { colors, shadowCard, name: themeName, setTheme } = useTheme();
  const styles = useStyles();
  const [segment, setSegment] = useState<Segment>("accounts");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [newAccName, setNewAccName] = useState("");
  const [newAccBalance, setNewAccBalance] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");

  const [budgetCatId, setBudgetCatId] = useState<number | null>(null);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [managingSub, setManagingSub] = useState(false);

  async function handleSwitchPlan(targetCycle: "monthly" | "yearly") {
    try {
      setManagingSub(true);
      await api.post("/accounts/api/v1/auth/subscription/change-plan/", {
        period: targetCycle,
      });
      await refreshUser();
      notify(
        "Plano atualizado",
        targetCycle === "yearly"
          ? "Seu ciclo foi alterado para o Plano Anual (R$ 119,00/ano)."
          : "Seu ciclo foi alterado para o Plano Mensal (R$ 14,90/mês).",
      );
    } catch (err) {
      notify("Erro ao trocar plano", extractErrorMessage(err));
    } finally {
      setManagingSub(false);
    }
  }

  async function handleCancelSubscription(immediate: boolean) {
    const ok = await confirmAction(
      immediate ? "Encerrar PRO imediatamente?" : "Cancelar renovação automática?",
      immediate
        ? "Sua conta voltará imediatamente para o plano Gratuito (limite de 2 contas e sem metas/parcelamentos)."
        : "Você continuará com todos os benefícios PRO até o fim do período vigente e não será cobrado novamente.",
    );
    if (!ok) return;
    try {
      setManagingSub(true);
      await api.post("/accounts/api/v1/auth/subscription/cancel/", {
        immediate,
      });
      await refreshUser();
      notify(
        immediate ? "Plano PRO encerrado" : "Cancelamento agendado",
        immediate
          ? "Sua conta retornou ao plano Gratuito."
          : "A renovação automática foi desativada. Seu acesso PRO segue ativo até o fim do período atual.",
      );
    } catch (err) {
      notify("Erro ao cancelar assinatura", extractErrorMessage(err));
    } finally {
      setManagingSub(false);
    }
  }

  const load = useCallback(async () => {
    try {
      const [accs, cats, bgs] = await Promise.all([
        fetchAll<Account>("/api/v1/accounts/"),
        fetchAll<Category>("/api/v1/categories/"),
        fetchAll<Budget>("/api/v1/budgets/"),
      ]);
      setAccounts(accs);
      setCategories(cats);
      setBudgets(bgs);
      const expCats = cats.filter((c) => c.type === "expense");
      setBudgetCatId((cur) => cur ?? expCats[0]?.id ?? null);
    } catch (err) {
      notify(
        "Erro",
        extractErrorMessage(err, "Não foi possível carregar os cadastros."),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  function startEdit(key: string, current: string) {
    setEditingKey(key);
    setEditValue(current);
  }

  async function saveEdit(kind: "accounts" | "categories", id: number) {
    if (!editValue.trim()) return;
    try {
      await api.patch(`/api/v1/${kind}/${id}/`, { name: editValue.trim() });
      setEditingKey(null);
      await load();
      onChanged();
    } catch (err) {
      notify("Erro ao salvar", extractErrorMessage(err));
    }
  }

  async function addAccount() {
    if (!newAccName.trim()) return;
    if (!user?.is_pro && accounts.length >= 2) {
      setShowUpgradeModal(true);
      return;
    }
    const initial = newAccBalance.trim() ? parseAmount(newAccBalance) : 0;
    if (initial === null || initial < 0) {
      notify("Saldo inválido", "Informe um saldo inicial válido (ex: 150,00).");
      return;
    }
    try {
      setSaving(true);
      await api.post("/api/v1/accounts/", {
        name: newAccName.trim(),
        balance: initial.toFixed(2),
      });
      setNewAccName("");
      setNewAccBalance("");
      await load();
      onChanged();
    } catch (err) {
      notify("Erro ao criar conta", extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function addCategory() {
    if (!newCatName.trim()) return;
    try {
      setSaving(true);
      await api.post("/api/v1/categories/", {
        name: newCatName.trim(),
        type: newCatType,
      });
      setNewCatName("");
      await load();
      onChanged();
    } catch (err) {
      notify("Erro ao criar categoria", extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function saveBudget() {
    if (!user?.is_pro) {
      setShowUpgradeModal(true);
      return;
    }
    if (!budgetCatId) {
      notify("Atenção", "Selecione uma categoria de despesa.");
      return;
    }
    const val = parseAmount(budgetAmount);
    if (val === null || val <= 0) {
      notify("Valor inválido", "Informe um limite mensal maior que zero.");
      return;
    }
    try {
      setSaving(true);
      await api.post("/api/v1/budgets/", {
        category: budgetCatId,
        amount: val.toFixed(2),
      });
      setBudgetAmount("");
      await load();
      onChanged();
    } catch (err) {
      notify("Erro ao salvar meta", extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeBudget(bg: Budget) {
    const ok = await confirmAction(
      `Remover meta de "${bg.category_name}"?`,
      "A categoria continuará existindo normalmente, apenas o alerta de limite mensal será removido.",
    );
    if (!ok) return;
    try {
      await api.delete(`/api/v1/budgets/${bg.id}/`);
      await load();
      onChanged();
    } catch (err) {
      notify("Erro ao excluir meta", extractErrorMessage(err));
    }
  }

  async function removeAccount(acc: Account) {
    const ok = await confirmAction(
      `Excluir conta "${acc.name}"?`,
      "Atenção: todas as transações desta conta também serão excluídas do sistema. Essa ação não pode ser desfeita.",
    );
    if (!ok) return;
    try {
      await api.delete(`/api/v1/accounts/${acc.id}/`);
      await load();
      onChanged();
    } catch (err) {
      notify("Erro ao excluir", extractErrorMessage(err));
    }
  }

  async function removeCategory(cat: Category) {
    const ok = await confirmAction(
      `Excluir categoria "${cat.name}"?`,
      "Essa ação não poderá ser desfeita se não houver transações vinculadas.",
    );
    if (!ok) return;
    try {
      await api.delete(`/api/v1/categories/${cat.id}/`);
      await load();
      onChanged();
    } catch (err) {
      notify("Não foi possível excluir", extractErrorMessage(err));
    }
  }

  async function handleChangePassword() {
    if (!oldPassword || !newPassword) {
      notify("Atenção", "Preencha a senha atual e a nova senha.");
      return;
    }
    if (newPassword.length < 8) {
      notify("Senha curta", "A nova senha deve conter no mínimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      notify("Atenção", "A confirmação da nova senha não coincide.");
      return;
    }

    try {
      setChangingPassword(true);
      await api.post("/accounts/api/v1/auth/password-change/", {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      notify("Senha atualizada", "Sua senha foi alterada com sucesso.");
    } catch (err) {
      notify("Erro ao alterar senha", extractErrorMessage(err));
    } finally {
      setChangingPassword(false);
    }
  }

  async function executeAccountDeletion() {
    try {
      setDeletingAccount(true);
      await deleteAccount();
    } catch (err) {
      setDeletingAccount(false);
      notify(
        "Erro ao excluir conta",
        extractErrorMessage(
          err,
          "Não foi possível concluir a exclusão da conta.",
        ),
      );
    }
  }

  function handleDeleteAccount() {
    const firstTitle = "Excluir Minha Conta?";
    const firstMsg =
      "Você está prestes a iniciar a exclusão da sua conta no InWallet. Todos os seus dados pessoais, contas bancárias, categorias, metas e transações serão apagados permanentemente (Art. 18 da LGPD). Deseja continuar?";
    const secondTitle = "Confirmação Definitiva";
    const secondMsg =
      "Esta ação é irreversível e não poderá ser desfeita. Tem certeza absoluta de que deseja excluir permanentemente sua conta e todos os seus registros financeiros?";

    if (Platform.OS === "web") {
      if (window.confirm(`${firstTitle}\n\n${firstMsg}`)) {
        if (window.confirm(`${secondTitle}\n\n${secondMsg}`)) {
          executeAccountDeletion();
        }
      }
      return;
    }

    // 1ª confirmação nativa via Alert.alert
    Alert.alert(
      firstTitle,
      firstMsg,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            // 2ª confirmação nativa via Alert.alert (confirmação dupla obrigatória)
            Alert.alert(
              secondTitle,
              secondMsg,
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Sim, Excluir Permanentemente",
                  style: "destructive",
                  onPress: () => {
                    executeAccountDeletion();
                  },
                },
              ],
              { cancelable: true },
            );
          },
        },
      ],
      { cancelable: true },
    );
  }

  const expenseCats = categories.filter((c) => c.type === "expense");
  const incomeCats = categories.filter((c) => c.type === "income");

  const renderCategory = (cat: Category) => (
    <ItemRow
      key={cat.id}
      title={cat.name}
      badge={cat.type === "expense" ? "Despesa" : "Receita"}
      badgeColor={cat.type === "expense" ? colors.expense : colors.income}
      editing={editingKey === `cat-${cat.id}`}
      editValue={editValue}
      onEditChange={setEditValue}
      onStartEdit={() => startEdit(`cat-${cat.id}`, cat.name)}
      onCancelEdit={() => setEditingKey(null)}
      onSaveEdit={() => saveEdit("categories", cat.id)}
      onDelete={() => removeCategory(cat)}
    />
  );

  return (
    <Screen fluid>
      <Header
        title="Gestão de Cadastros"
        subtitle={
          user ? `Usuário: ${user.username} (${user.email})` : undefined
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
        <View style={styles.segments}>
          <Chip
            label="Contas"
            active={segment === "accounts"}
            count={accounts.length}
            onPress={() => {
              setSegment("accounts");
              setEditingKey(null);
            }}
          />
          <Chip
            label="Categorias"
            active={segment === "categories"}
            count={categories.length}
            onPress={() => {
              setSegment("categories");
              setEditingKey(null);
            }}
          />
          <Chip
            label={user?.is_pro ? "Metas" : "Metas (PRO)"}
            active={segment === "budgets"}
            count={budgets.length}
            onPress={() => {
              setSegment("budgets");
              setEditingKey(null);
            }}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: spacing.xxl }}
          />
        ) : segment === "accounts" ? (
          <>
            <SectionTitle
              title="Suas Contas"
              subtitle={
                user?.is_pro
                  ? "Gerencie suas carteiras e contas bancárias (Ilimitadas no PRO)"
                  : `Plano Free: ${accounts.length}/2 contas cadastradas`
              }
            />
            {accounts.length === 0 ? (
              <Card>
                <EmptyState
                  icon="wallet"
                  title="Nenhuma conta cadastrada"
                  subtitle="Cadastre sua primeira conta ou carteira abaixo."
                />
              </Card>
            ) : (
              accounts.map((acc) => (
                <ItemRow
                  key={acc.id}
                  title={acc.name}
                  subtitle={`Saldo atual: ${formatCurrency(acc.balance)}`}
                  editing={editingKey === `acc-${acc.id}`}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onStartEdit={() => startEdit(`acc-${acc.id}`, acc.name)}
                  onCancelEdit={() => setEditingKey(null)}
                  onSaveEdit={() => saveEdit("accounts", acc.id)}
                  onDelete={() => removeAccount(acc)}
                />
              ))
            )}

            <SectionTitle
              title="Cadastrar Nova Conta"
              subtitle="Adicione uma nova instituição financeira ou carteira"
            />
            <Card>
              <Field
                label="Nome da Conta"
                value={newAccName}
                onChangeText={setNewAccName}
                placeholder="Ex: Nubank, Inter, Itaú, Carteira"
              />
              <Field
                label="Saldo Inicial (opcional)"
                value={newAccBalance}
                onChangeText={(val) =>
                  setNewAccBalance(formatCurrencyInput(val))
                }
                placeholder="0,00"
                keyboardType="number-pad"
                hint="O saldo inicial é definido apenas na criação da conta."
              />
              <Button
                title="Cadastrar Conta"
                onPress={addAccount}
                loading={saving}
                style={{ marginTop: spacing.lg }}
              />
            </Card>
          </>
        ) : segment === "categories" ? (
          <>
            <SectionTitle
              title="Categorias de Despesa"
              subtitle={`${expenseCats.length} categorias cadastradas`}
            />
            {expenseCats.length === 0 ? (
              <Card>
                <Text style={styles.muted}>
                  Nenhuma categoria de despesa criada.
                </Text>
              </Card>
            ) : (
              expenseCats.map(renderCategory)
            )}

            <SectionTitle
              title="Categorias de Receita"
              subtitle={`${incomeCats.length} categorias cadastradas`}
            />
            {incomeCats.length === 0 ? (
              <Card>
                <Text style={styles.muted}>
                  Nenhuma categoria de receita criada.
                </Text>
              </Card>
            ) : (
              incomeCats.map(renderCategory)
            )}

            <SectionTitle
              title="Cadastrar Nova Categoria"
              subtitle="Crie categorias personalizadas para organizar suas finanças"
            />
            <Card>
              <Field
                label="Nome da Categoria"
                value={newCatName}
                onChangeText={setNewCatName}
                placeholder="Ex: Supermercado, Aluguel, Investimentos"
              />
              <View style={styles.catTypeChips}>
                <Chip
                  label="Despesa"
                  active={newCatType === "expense"}
                  onPress={() => setNewCatType("expense")}
                />
                <Chip
                  label="Receita"
                  active={newCatType === "income"}
                  onPress={() => setNewCatType("income")}
                />
              </View>
              <Button
                title="Cadastrar Categoria"
                onPress={addCategory}
                loading={saving}
                style={{ marginTop: spacing.lg }}
              />
            </Card>
          </>
        ) : (
          <>
            <SectionTitle
              title="Metas de Gastos Mensais"
              subtitle="Defina tetos de gastos por categoria e acompanhe no Dashboard"
            />
            {!user?.is_pro && (
              <TouchableOpacity
                style={styles.proUpgradeBanner}
                onPress={() => setShowUpgradeModal(true)}
                activeOpacity={0.88}
              >
                <View style={styles.proBannerIconWrap}>
                  <Icon name="spark" size={16} color={colors.primaryLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.proBannerTitle}>
                    Recurso Exclusivo do InWallet PRO
                  </Text>
                  <Text style={styles.proBannerDesc}>
                    Defina limites para cada categoria e receba alertas inteligentes no Dashboard. Toque para desbloquear.
                  </Text>
                </View>
                <Icon name="arrow-right" size={14} color={colors.primaryLight} />
              </TouchableOpacity>
            )}
            {budgets.length === 0 ? (
              <Card>
                <EmptyState
                  icon="target"
                  title="Nenhuma meta definida"
                  subtitle="Defina um limite mensal para suas categorias de despesa abaixo."
                />
              </Card>
            ) : (
              budgets.map((bg) => (
                <View key={bg.id} style={[styles.row, shadowCard]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{bg.category_name}</Text>
                    <Text style={styles.rowSub}>
                      Teto mensal: {formatCurrency(bg.amount)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setBudgetCatId(bg.category);
                      setBudgetAmount(
                        formatCurrencyInput(
                          String(Math.round(Number(bg.amount) * 100)),
                        ),
                      );
                    }}
                    style={styles.iconBtn}
                    hitSlop={8}
                    accessibilityLabel="Editar lançamento"
                    accessibilityRole="button"
                  >
                    <Icon name="edit" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeBudget(bg)}
                    style={styles.iconBtn}
                    hitSlop={8}
                    accessibilityLabel="Excluir lançamento"
                    accessibilityRole="button"
                  >
                    <Icon name="trash" size={14} color={colors.expense} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            <SectionTitle
              title="Definir ou Atualizar Meta"
              subtitle="Escolha uma categoria de despesa e o valor máximo mensal"
            />
            <Card>
              <Text style={styles.rowSub}>Categoria de Despesa</Text>
              <View style={[styles.catTypeChips, { flexWrap: "wrap" }]}>
                {expenseCats.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    active={budgetCatId === cat.id}
                    onPress={() => setBudgetCatId(cat.id)}
                  />
                ))}
              </View>
              <Field
                label="Limite Mensal (R$)"
                value={budgetAmount}
                onChangeText={(val) =>
                  setBudgetAmount(formatCurrencyInput(val))
                }
                placeholder="0,00"
                keyboardType="number-pad"
                hint="Você verá uma barra de progresso no Dashboard conforme gastar."
              />
              <Button
                title="Salvar Meta Mensal"
                onPress={saveBudget}
                loading={saving}
                style={{ marginTop: spacing.lg }}
              />
            </Card>
          </>
        )}

        {/* Aparência do Aplicativo — Tema Escuro vs Claro */}
        <SectionTitle
          title="Aparência do Aplicativo"
          subtitle="Escolha entre o tema Midnight Navy (Escuro) ou Daylight Slate (Claro)"
        />
        <Card>
          <View style={styles.themeRow}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                themeName === "dark" && styles.themeOptionActive,
              ]}
              onPress={() => setTheme("dark")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Ativar tema escuro"
              accessibilityState={{ selected: themeName === "dark" }}
            >
              <Icon
                name="moon"
                size={16}
                color={themeName === "dark" ? colors.primary : colors.textMuted}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.themeOptionTitle,
                    themeName === "dark" && styles.themeOptionTitleActive,
                  ]}
                >
                  Modo Escuro
                </Text>
                <Text style={styles.themeOptionDesc}>Midnight Navy</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themeName === "light" && styles.themeOptionActive,
              ]}
              onPress={() => setTheme("light")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Ativar tema claro"
              accessibilityState={{ selected: themeName === "light" }}
            >
              <Icon
                name="sun"
                size={16}
                color={
                  themeName === "light" ? colors.primary : colors.textMuted
                }
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.themeOptionTitle,
                    themeName === "light" && styles.themeOptionTitleActive,
                  ]}
                >
                  Modo Claro
                </Text>
                <Text style={styles.themeOptionDesc}>Daylight Slate</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Gestão de Assinatura — Troca de Plano e Cancelamento */}
        <SectionTitle
          title="Assinatura e Plano"
          subtitle="Gerencie seu ciclo de cobrança, troque de plano ou cancele quando quiser"
        />
        <Card>
          <View style={styles.subHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {user?.is_pro
                  ? user.billing_cycle === "monthly"
                    ? "InWallet PRO • Plano Mensal (R$ 14,90/mês)"
                    : "InWallet PRO • Plano Anual (R$ 119,00/ano)"
                  : "Plano Gratuito (Free)"}
              </Text>
              <Text style={styles.rowSub}>
                {user?.is_pro
                  ? user.plan_expires_at
                    ? `${user.cancel_at_period_end ? "Acesso válido até" : "Próxima renovação em"}: ${formatDate(user.plan_expires_at.slice(0, 10))}`
                    : "Assinatura PRO vitalícia / ativa"
                  : "Até 2 contas bancárias • Sem metas mensais ou parcelamentos"}
              </Text>
            </View>
            <View
              style={[
                styles.subStatusBadge,
                {
                  backgroundColor: user?.is_pro
                    ? user.cancel_at_period_end
                      ? colors.warningBg
                      : colors.primarySoft
                    : colors.surfaceAlt,
                },
              ]}
            >
              <Text
                style={[
                  styles.subStatusText,
                  {
                    color: user?.is_pro
                      ? user.cancel_at_period_end
                        ? colors.warning
                        : colors.primary
                      : colors.textMuted,
                  },
                ]}
              >
                {user?.is_pro
                  ? user.cancel_at_period_end
                    ? "CANCELAMENTO AGENDADO"
                    : "PRO ATIVO"
                  : "FREE"}
              </Text>
            </View>
          </View>

          {user?.is_pro ? (
            <View style={styles.subActionsCol}>
              {/* Troca entre Mensal e Anual */}
              <Button
                title={
                  user.billing_cycle === "monthly"
                    ? "Mudar para Plano Anual (Economize 33% • R$ 119/ano)"
                    : "Mudar para Plano Mensal (R$ 14,90/mês)"
                }
                variant="outline"
                loading={managingSub}
                onPress={() =>
                  handleSwitchPlan(
                    user.billing_cycle === "monthly" ? "yearly" : "monthly",
                  )
                }
              />

              {/* Reativar renovação se estava agendado para cancelar */}
              {user.cancel_at_period_end ? (
                <View style={styles.subCancelButtonsRow}>
                  <Button
                    title="Reativar Renovação Automática"
                    variant="primary"
                    small
                    loading={managingSub}
                    onPress={() =>
                      handleSwitchPlan(user.billing_cycle || "yearly")
                    }
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Encerrar PRO Agora"
                    variant="danger"
                    small
                    loading={managingSub}
                    onPress={() => handleCancelSubscription(true)}
                    style={{ flex: 1 }}
                  />
                </View>
              ) : (
                <View style={styles.subCancelButtonsRow}>
                  <Button
                    title="Cancelar Renovação"
                    variant="ghost"
                    small
                    loading={managingSub}
                    onPress={() => handleCancelSubscription(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Encerrar PRO Imediatamente"
                    variant="danger"
                    small
                    loading={managingSub}
                    onPress={() => handleCancelSubscription(true)}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </View>
          ) : (
            <Button
              title="Fazer Upgrade para o InWallet PRO"
              onPress={() => setShowUpgradeModal(true)}
              style={{ marginTop: spacing.md }}
            />
          )}
        </Card>

        {/* Segurança da Conta — Alteração de Senha */}
        <SectionTitle
          title="Segurança da Conta"
          subtitle="Altere sua senha de acesso quando desejar"
        />
        <Card>
          <Field
            label="Senha atual"
            placeholder="Sua senha em uso"
            value={oldPassword}
            onChangeText={setOldPassword}
            secure
          />
          <Field
            label="Nova senha"
            placeholder="Mínimo de 8 caracteres"
            value={newPassword}
            onChangeText={setNewPassword}
            secure
          />
          <Field
            label="Confirmar nova senha"
            placeholder="Repita a nova senha"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            secure
          />
          <Button
            title="Atualizar Senha"
            onPress={handleChangePassword}
            loading={changingPassword}
            style={{ marginTop: spacing.lg }}
          />
        </Card>

        {/* Documentos Legais e Privacidade (LGPD) */}
        <SectionTitle
          title="Privacidade e Termos Legais"
          subtitle="Transparência sobre seus dados e direitos (LGPD)"
        />
        <Card>
          <View style={styles.legalLinksRow}>
            <TouchableOpacity
              style={styles.legalLinkBtn}
              onPress={() => setLegalDoc("terms")}
              accessibilityRole="link"
              accessibilityLabel="Abrir Termos de Uso"
            >
              <Icon name="file" size={14} color={colors.primaryLight} />
              <Text style={styles.legalLinkText}>Termos de Uso</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.legalLinkBtn}
              onPress={() => setLegalDoc("privacy")}
              accessibilityRole="link"
              accessibilityLabel="Abrir Política de Privacidade (LGPD)"
            >
              <Icon name="lock" size={14} color={colors.primaryLight} />
              <Text style={styles.legalLinkText}>
                Política de Privacidade (LGPD)
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.logoutWrap}>
          <Button
            title="Sair da Conta (Logout)"
            variant="outline"
            onPress={logout}
            style={styles.logoutBtn}
          />
        </View>

        {/* Zona de Exclusão Definitiva de Conta (Art. 18 LGPD & Lojas) */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>
            Zona de Exclusão de Dados (LGPD)
          </Text>
          <Text style={styles.dangerDesc}>
            Ao excluir sua conta, seu usuário e todas as contas bancárias,
            categorias, metas e transações serão removidos permanentemente dos
            nossos servidores em cascata.
          </Text>
          <TouchableOpacity
            style={[
              styles.deleteAccountBtn,
              deletingAccount && { opacity: 0.6 },
            ]}
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Excluir Minha Conta"
          >
            {deletingAccount ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.deleteAccountBtnText}>
                Excluir Minha Conta
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => load()}
      />
    </Screen>
  );
};

const useStyles = createThemedStyles(({ colors }) => ({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  segments: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  catTypeChips: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14.5,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  rowSub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  rowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  rowBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  iconBtn: {
    padding: spacing.sm,
    marginLeft: 4,
  },
  editActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: spacing.sm,
  },
  legalLinksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  legalLinkBtn: {
    flex: 1,
    minWidth: 180,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  legalLinkText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: "600",
  },
  logoutWrap: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  logoutBtn: {
    width: "100%",
    borderColor: colors.borderStrong,
  },
  dangerCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.expenseBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.expenseBorder,
    padding: spacing.lg,
  },
  dangerTitle: {
    color: colors.expense,
    fontSize: 15,
    fontWeight: "700",
  },
  dangerDesc: {
    color: colors.textMuted,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  deleteAccountBtn: {
    backgroundColor: colors.expense,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteAccountBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  proUpgradeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  proBannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  proBannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  proBannerDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  themeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  themeOptionTitle: {
    fontSize: 13.5,
    fontWeight: "600",
    color: colors.text,
  },
  themeOptionTitleActive: {
    color: colors.primary,
  },
  themeOptionDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  subHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  subStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  subStatusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  subActionsCol: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  subCancelButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
}));
