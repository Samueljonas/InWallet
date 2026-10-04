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
import { api, fetchAll } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { Account, Category } from "../types";
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
import { colors, radius, spacing } from "../theme";
import {
  confirmAction,
  extractErrorMessage,
  formatCurrency,
  notify,
  parseAmount,
} from "../utils/format";

type Segment = "accounts" | "categories";

interface RowProps {
  title: string;
  subtitle?: string;
  editing: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}

const ItemRow: React.FC<RowProps> = (p) => (
  <View style={styles.row}>
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
        <TouchableOpacity
          onPress={p.onStartEdit}
          hitSlop={8}
          style={styles.iconBtn}
        >
          <Text style={styles.icon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={p.onDelete}
          hitSlop={8}
          style={styles.iconBtn}
        >
          <Text style={styles.icon}>🗑</Text>
        </TouchableOpacity>
      </>
    )}
  </View>
);

export const ManageScreen: React.FC<{
  refreshKey: number;
  onChanged: () => void;
}> = ({ refreshKey, onChanged }) => {
  const { user, logout } = useAuth();
  const [segment, setSegment] = useState<Segment>("accounts");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [newAccName, setNewAccName] = useState("");
  const [newAccBalance, setNewAccBalance] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [accs, cats] = await Promise.all([
        fetchAll<Account>("/api/v1/accounts/"),
        fetchAll<Category>("/api/v1/categories/"),
      ]);
      setAccounts(accs);
      setCategories(cats);
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

  async function removeAccount(acc: Account) {
    const ok = await confirmAction(
      `Excluir conta "${acc.name}"?`,
      "Atenção: todas as transações desta conta também serão excluídas. Essa ação não pode ser desfeita.",
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
      "Essa ação não pode ser desfeita.",
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

  const expenseCats = categories.filter((c) => c.type === "expense");
  const incomeCats = categories.filter((c) => c.type === "income");

  const renderCategory = (cat: Category) => (
    <ItemRow
      key={cat.id}
      title={cat.name}
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
    <Screen>
      <Header
        title="Cadastros"
        subtitle={user ? `Conectado como ${user.username}` : undefined}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
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
        <View style={styles.segments}>
          <Chip
            label="Contas"
            active={segment === "accounts"}
            onPress={() => {
              setSegment("accounts");
              setEditingKey(null);
            }}
          />
          <Chip
            label="Categorias"
            active={segment === "categories"}
            onPress={() => {
              setSegment("categories");
              setEditingKey(null);
            }}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primaryLight}
            style={{ marginTop: spacing.xxl }}
          />
        ) : segment === "accounts" ? (
          <>
            <SectionTitle title="Suas contas" />
            {accounts.length === 0 ? (
              <Card>
                <EmptyState
                  icon="🏦"
                  title="Nenhuma conta ainda"
                  subtitle="Crie sua primeira conta abaixo."
                />
              </Card>
            ) : (
              accounts.map((acc) => (
                <ItemRow
                  key={acc.id}
                  title={acc.name}
                  subtitle={formatCurrency(acc.balance)}
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

            <SectionTitle title="Nova conta" />
            <Card>
              <Field
                label="Nome"
                value={newAccName}
                onChangeText={setNewAccName}
                placeholder="Ex: Nubank, Carteira"
              />
              <Field
                label="Saldo inicial (opcional)"
                value={newAccBalance}
                onChangeText={setNewAccBalance}
                placeholder="0,00"
                keyboardType="decimal-pad"
                hint="O saldo só muda depois por meio de transações."
              />
              <Button
                title="Adicionar conta"
                onPress={addAccount}
                loading={saving}
                style={{ marginTop: spacing.lg }}
              />
            </Card>
          </>
        ) : (
          <>
            <SectionTitle title="Despesas" />
            {expenseCats.length === 0 ? (
              <Card>
                <Text style={styles.muted}>Nenhuma categoria de despesa.</Text>
              </Card>
            ) : (
              expenseCats.map(renderCategory)
            )}

            <SectionTitle title="Receitas" />
            {incomeCats.length === 0 ? (
              <Card>
                <Text style={styles.muted}>Nenhuma categoria de receita.</Text>
              </Card>
            ) : (
              incomeCats.map(renderCategory)
            )}

            <SectionTitle title="Nova categoria" />
            <Card>
              <Field
                label="Nome"
                value={newCatName}
                onChangeText={setNewCatName}
                placeholder="Ex: Mercado, Salário"
              />
              <View style={styles.segments}>
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
                title="Adicionar categoria"
                onPress={addCategory}
                loading={saving}
                style={{ marginTop: spacing.lg }}
              />
            </Card>
          </>
        )}

        <Button
          title="Sair da conta"
          variant="ghost"
          onPress={logout}
          style={{ marginTop: spacing.xxl }}
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  segments: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  rowSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  iconBtn: { padding: spacing.sm },
  icon: { fontSize: 16 },
  editActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  muted: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
});
