import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { Button, Card, Field, Screen } from "../components/ui";
import { LegalDocType, LegalModal } from "../components/LegalModal";
import { Icon } from "../components/Icon";
import { radius, spacing } from "../theme";
import { createThemedStyles, useTheme } from "../contexts/ThemeContext";
import { extractErrorMessage, extractFieldErrors } from "../utils/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RegisterScreen: React.FC<{ onNavigateToLogin: () => void }> = ({
  onNavigateToLogin,
}) => {
  const { register } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = "Escolha um nome de usuário.";
    if (!EMAIL_RE.test(email.trim()))
      e.email = "Informe um e-mail válido (ex: nome@email.com).";
    if (password.length < 8)
      e.password = "A senha precisa ter pelo menos 8 caracteres.";
    else if (/^\d+$/.test(password))
      e.password = "A senha não pode conter apenas números.";
    if (confirm !== password) e.confirm = "As senhas digitadas não coincidem.";
    if (!acceptedTerms)
      e.terms =
        "É necessário ler e aceitar os Termos de Uso e a Política de Privacidade (LGPD) para criar sua conta.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    setGeneralError("");
    if (!validate()) return;
    try {
      setLoading(true);
      await register(username, email, password, firstName);
    } catch (err: any) {
      const fields = extractFieldErrors(err);
      const known = ["username", "email", "password"].filter((k) => fields[k]);
      if (known.length) {
        setErrors(Object.fromEntries(known.map((k) => [k, fields[k]])));
      } else {
        setGeneralError(
          extractErrorMessage(err, "Não foi possível criar a conta."),
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <Text style={styles.title}>Criar Nova Conta</Text>
            <Text style={styles.subtitle}>
              Comece a controlar suas receitas e despesas em segundos
            </Text>
          </View>

          <Card style={styles.registerCard}>
            {!!generalError && (
              <View style={styles.errorBox}>
                <Text style={styles.error}>{generalError}</Text>
              </View>
            )}

            <Field
              label="Nome de usuário *"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Ex: samuel_silva"
              error={errors.username}
            />
            <Field
              label="E-mail *"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="seuemail@exemplo.com"
              error={errors.email}
            />
            <Field
              label="Primeiro nome (opcional)"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Como prefere ser chamado?"
            />
            <Field
              label="Senha *"
              value={password}
              onChangeText={setPassword}
              secure
              placeholder="Mínimo de 8 caracteres"
              error={errors.password}
              hint="Use pelo menos 8 dígitos combinando letras e números."
            />
            <Field
              label="Confirmar senha *"
              value={confirm}
              onChangeText={setConfirm}
              secure
              placeholder="Repita sua senha"
              error={errors.confirm}
              onSubmitEditing={handleRegister}
            />

            {/* Consentimento LGPD & Termos de Uso */}
            <View style={styles.consentContainer}>
              <View style={styles.consentRow}>
                <TouchableOpacity
                  onPress={() => {
                    setAcceptedTerms((v) => !v);
                    if (errors.terms) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.terms;
                        return next;
                      });
                    }
                  }}
                  activeOpacity={0.7}
                  hitSlop={8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acceptedTerms }}
                  accessibilityLabel="Confirmar leitura e aceite dos Termos de Uso e Política de Privacidade"
                  style={[
                    styles.checkbox,
                    acceptedTerms && styles.checkboxChecked,
                    !!errors.terms && styles.checkboxError,
                  ]}
                >
                  {acceptedTerms && (
                    <Icon name="check" size={13} color={colors.white} />
                  )}
                </TouchableOpacity>

                <Text style={styles.consentText}>
                  Declaro que li e concordo com os{" "}
                  <Text
                    style={styles.consentLink}
                    onPress={() => setLegalDoc("terms")}
                    accessibilityRole="link"
                    accessibilityLabel="Ler Termos de Uso"
                  >
                    Termos de Uso
                  </Text>{" "}
                  e com a{" "}
                  <Text
                    style={styles.consentLink}
                    onPress={() => setLegalDoc("privacy")}
                    accessibilityRole="link"
                    accessibilityLabel="Ler Política de Privacidade"
                  >
                    Política de Privacidade (LGPD)
                  </Text>
                  .
                </Text>
              </View>
              {!!errors.terms && (
                <Text style={styles.termsError}>{errors.terms}</Text>
              )}
            </View>

            <Button
              title="Cadastrar e Acessar"
              onPress={handleRegister}
              loading={loading}
              style={{ marginTop: spacing.xl }}
            />
          </Card>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={onNavigateToLogin}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Já possui uma conta? Fazer login"
          >
            <Text style={styles.switchText}>
              Já possui uma conta? <Text style={styles.switchBold}>Fazer login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <LegalModal
        doc={legalDoc}
        onClose={() => setLegalDoc(null)}
        onAccept={() => {
          setAcceptedTerms(true);
          if (errors.terms) {
            setErrors((prev) => {
              const next = { ...prev };
              delete next.terms;
              return next;
            });
          }
        }}
      />
    </Screen>
  );
};

const useStyles = createThemedStyles(({ colors }) => ({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  brand: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 18,
  },
  registerCard: {
    padding: spacing.xl,
  },
  errorBox: {
    backgroundColor: colors.expenseBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.expenseBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.expense,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  consentContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxError: {
    borderColor: colors.expense,
  },
  checkmark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  consentText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  consentLink: {
    color: colors.primaryLight,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  termsError: {
    color: colors.expense,
    fontSize: 12,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  switchBtn: {
    alignItems: "center",
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  switchText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  switchBold: {
    color: colors.primary,
    fontWeight: "700",
  },
}));
