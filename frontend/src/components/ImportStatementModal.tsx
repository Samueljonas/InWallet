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
import { api } from "../api/client";
import { Account } from "../types";
import { radius, spacing } from "../theme";
import { createThemedStyles, useTheme } from "../contexts/ThemeContext";
import { extractErrorMessage, formatCurrency, notify } from "../utils/format";
import { Icon } from "./Icon";
import { Button, Chip, Input } from "./ui";

interface ImportStatementModalProps {
  visible: boolean;
  onClose: () => void;
  accounts: Account[];
  onImported: () => void;
}

const SAMPLE_CSV = `Data,Valor,Identificador,Descrição
2026-11-01,4500.00,nubank-sal-01,Salário Mensal Empresa
2026-11-02,-89.90,nubank-mkt-02,Supermercado Pao de Acucar
2026-11-03,-34.50,nubank-ubr-03,Uber Viagem Centro
2026-11-04,-55.90,nubank-ifd-04,iFood Pedido Jantar`;

export const ImportStatementModal: React.FC<ImportStatementModalProps> = ({
  visible,
  onClose,
  accounts,
  onImported,
}) => {
  const { colors, shadowHero } = useTheme();
  const styles = useStyles();
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    accounts[0]?.id ?? null
  );
  const [filename, setFilename] = useState("extrato.csv");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported_count: number;
    skipped_count: number;
    total_income: string;
    total_expense: string;
  } | null>(null);

  const effectiveAccountId = selectedAccountId ?? accounts[0]?.id ?? null;

  function handleClose() {
    setResult(null);
    onClose();
  }

  function handleWebFilePick() {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ofx,.csv,text/csv,application/x-ofx";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      setFilename(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setContent(reader.result);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  async function handleImport() {
    if (!effectiveAccountId) {
      notify("Selecione uma conta", "Escolha a conta bancária de destino.");
      return;
    }
    if (!content.trim()) {
      notify(
        "Extrato vazio",
        "Selecione um arquivo .OFX / .CSV ou cole o conteúdo do extrato."
      );
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post("/api/v1/transactions/import/", {
        account: effectiveAccountId,
        filename,
        content: content.trim(),
      });
      setResult(data);
      onImported();
      notify(
        "Importação concluída",
        `${data.imported_count} lançamento(s) importado(s) com sucesso.`
      );
    } catch (err) {
      notify(
        "Erro ao importar",
        extractErrorMessage(err, "Não foi possível processar o extrato informado.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.container, shadowHero]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBadge}>
                <Icon name="upload" size={15} color={colors.primaryLight} />
              </View>
              <Text style={styles.title}>Importar Extrato (OFX / CSV)</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={12}
            >
              <Icon name="close" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: spacing.md }}
          >
            <Text style={styles.subtitle}>
              Importe extratos do Nubank, Itaú, Inter, Bradesco ou qualquer
              arquivo .OFX / .CSV. Lançamentos repetidos são ignorados
              automaticamente.
            </Text>

            <Text style={styles.sectionLabel}>1. Conta de destino</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {accounts.map((acc) => (
                <Chip
                  key={acc.id}
                  label={acc.name}
                  active={effectiveAccountId === acc.id}
                  onPress={() => setSelectedAccountId(acc.id)}
                />
              ))}
            </ScrollView>

            <View style={styles.fileActionsRow}>
              {Platform.OS === "web" && (
                <TouchableOpacity
                  style={styles.filePickerBtn}
                  onPress={handleWebFilePick}
                >
                  <Icon name="file" size={14} color={colors.primaryLight} />
                  <Text style={styles.filePickerText}>
                    Selecionar arquivo .OFX / .CSV
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.sampleBtn}
                onPress={() => {
                  setFilename("nubank_exemplo.csv");
                  setContent(SAMPLE_CSV);
                }}
              >
                <Text style={styles.sampleBtnText}>
                  Preencher exemplo CSV
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Nome / Formato do arquivo"
              placeholder="extrato.ofx ou extrato.csv"
              value={filename}
              onChangeText={setFilename}
              autoCapitalize="none"
            />

            <Input
              label="Conteúdo do extrato (OFX ou CSV)"
              placeholder="Cole aqui o conteúdo do seu arquivo .CSV ou .OFX..."
              value={content}
              onChangeText={setContent}
              multiline
              style={styles.textArea}
            />

            {result && (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>Resumo da importação</Text>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Novos lançamentos:</Text>
                  <Text style={styles.resultValue}>{result.imported_count}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Duplicados ignorados:</Text>
                  <Text style={styles.resultValue}>{result.skipped_count}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Total Receitas:</Text>
                  <Text style={[styles.resultValue, { color: colors.income }]}>
                    {formatCurrency(result.total_income)}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Total Despesas:</Text>
                  <Text style={[styles.resultValue, { color: colors.expense }]}>
                    {formatCurrency(result.total_expense)}
                  </Text>
                </View>
              </View>
            )}

            <Button
              title="Processar e Importar Lançamentos"
              loading={loading}
              onPress={handleImport}
              style={{ marginTop: spacing.sm }}
            />
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
    maxHeight: "90%",
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
    marginBottom: spacing.sm,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
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
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontWeight: "600",
    marginBottom: 8,
  },
  chipsRow: {
    paddingBottom: spacing.md,
  },
  fileActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  filePickerText: {
    color: colors.primaryLight,
    fontSize: 12.5,
    fontWeight: "600",
  },
  sampleBtn: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  sampleBtnText: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontWeight: "600",
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    fontSize: 12,
  },
  resultBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 6,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resultLabel: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  resultValue: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.text,
  },
}));
