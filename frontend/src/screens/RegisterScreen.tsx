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
import { colors, radius, spacing } from "../theme";
import { extractErrorMessage, extractFieldErrors } from "../utils/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RegisterScreen: React.FC<{ onNavigateToLogin: () => void }> = ({
  onNavigateToLogin,
}) => {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
          >
            <Text style={styles.switchText}>
              Já possui uma conta? <Text style={styles.switchBold}>Fazer login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
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
});
