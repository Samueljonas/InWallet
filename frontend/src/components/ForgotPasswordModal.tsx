import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../api/client";
import { radius, spacing } from "../theme";
import { createThemedStyles, useTheme } from "../contexts/ThemeContext";
import { extractErrorMessage, extractFieldErrors, notify } from "../utils/format";
import { Button, Field } from "./ui";

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const { shadowHero } = useTheme();
  const styles = useStyles();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  function resetAndClose() {
    setStep("request");
    setEmail("");
    setUid("");
    setToken("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setInfoMessage("");
    onClose();
  }

  async function handleRequestReset() {
    if (!email.trim()) {
      setError("Informe o e-mail vinculado à sua conta.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await api.post<{
        detail: string;
        debug_reset?: { uid: string; token: string };
      }>("/accounts/api/v1/auth/password-reset/", {
        email: email.trim(),
      });

      setInfoMessage(res.data.detail);
      if (res.data.debug_reset) {
        setUid(res.data.debug_reset.uid);
        setToken(res.data.debug_reset.token);
      }
      setStep("confirm");
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          "Não foi possível processar a solicitação de recuperação."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmReset() {
    if (!uid.trim() || !token.trim()) {
      setError("Informe o código de identificação (UID) e o token recebidos.");
      return;
    }
    if (newPassword.length < 8) {
      setError("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("A confirmação de senha não coincide.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await api.post("/accounts/api/v1/auth/password-reset/confirm/", {
        uid: uid.trim(),
        token: token.trim(),
        new_password: newPassword,
      });

      notify(
        "Senha redefinida",
        "Sua senha foi atualizada com sucesso. Você já pode acessar sua conta."
      );
      resetAndClose();
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      if (fieldErrors.new_password) {
        setError(fieldErrors.new_password);
      } else {
        setError(
          extractErrorMessage(
            err,
            "Código ou token inválido. Verifique os dados e tente novamente."
          )
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={resetAndClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.backdrop}
      >
        <View style={[styles.container, shadowHero]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {step === "request" ? "Recuperar Senha" : "Redefinir Senha"}
            </Text>
            <TouchableOpacity
              onPress={resetAndClose}
              hitSlop={12}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fechar janela de recuperação"
            >
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {step === "request" ? (
              <>
                <Text style={styles.description}>
                  Informe o endereço de e-mail associado à sua conta para receber
                  o código e o token de redefinição de senha.
                </Text>

                <Field
                  label="E-mail da conta"
                  placeholder="seu@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Button
                  title="Enviar instruções"
                  onPress={handleRequestReset}
                  loading={loading}
                  style={{ marginTop: spacing.lg }}
                />

                <TouchableOpacity
                  style={styles.secondaryLink}
                  onPress={() => {
                    setError("");
                    setStep("confirm");
                  }}
                >
                  <Text style={styles.secondaryLinkText}>
                    Já possuo um código de recuperação
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {!!infoMessage && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>{infoMessage}</Text>
                  </View>
                )}

                <Field
                  label="Código de Identificação (UID)"
                  placeholder="Ex: MQ"
                  value={uid}
                  onChangeText={setUid}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Field
                  label="Token de Segurança"
                  placeholder="Ex: c8a1b2-..."
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                  autoCorrect={false}
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
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secure
                />

                <Button
                  title="Salvar nova senha"
                  onPress={handleConfirmReset}
                  loading={loading}
                  style={{ marginTop: spacing.lg }}
                />

                <TouchableOpacity
                  style={styles.secondaryLink}
                  onPress={() => {
                    setError("");
                    setStep("request");
                  }}
                >
                  <Text style={styles.secondaryLinkText}>
                    Voltar e solicitar novo código
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const useStyles = createThemedStyles(({ colors }) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 15, 30, 0.72)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  container: {
    backgroundColor: colors.surface,
    width: "100%",
    maxWidth: 520,
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
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  closeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  scroll: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  errorBox: {
    backgroundColor: colors.expenseBg,
    borderWidth: 1,
    borderColor: colors.expenseBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.expense,
    fontSize: 13,
    fontWeight: "600",
  },
  infoBox: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  infoText: {
    color: colors.primaryLight,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  secondaryLink: {
    marginTop: spacing.lg,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  secondaryLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
}));

