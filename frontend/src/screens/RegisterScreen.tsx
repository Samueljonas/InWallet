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
import { colors, spacing } from "../theme";
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
      e.password = "A senha não pode ter apenas números.";
    if (confirm !== password) e.confirm = "As senhas não coincidem.";
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Leva menos de um minuto.</Text>
          </View>

          <Card>
            {!!generalError && <Text style={styles.error}>{generalError}</Text>}

            <Field
              label="Usuário *"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="seu_usuario"
              error={errors.username}
            />
            <Field
              label="E-mail *"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="nome@email.com"
              error={errors.email}
            />
            <Field
              label="Nome (opcional)"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Como quer ser chamado?"
            />
            <Field
              label="Senha *"
              value={password}
              onChangeText={setPassword}
              secure
              placeholder="Mínimo 8 caracteres"
              error={errors.password}
              hint="Use pelo menos 8 caracteres, com letras e números."
            />
            <Field
              label="Confirmar senha *"
              value={confirm}
              onChangeText={setConfirm}
              secure
              placeholder="Repita a senha"
              error={errors.confirm}
              onSubmitEditing={handleRegister}
            />

            <Button
              title="Criar conta e entrar"
              onPress={handleRegister}
              loading={loading}
              style={{ marginTop: spacing.xl }}
            />
          </Card>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={onNavigateToLogin}
          >
            <Text style={styles.switchText}>
              Já tem conta? <Text style={styles.switchBold}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  brand: { alignItems: "center", marginBottom: spacing.xl },
  title: { color: colors.primaryLight, fontSize: 28, fontWeight: "800" },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  error: {
    color: colors.expense,
    backgroundColor: colors.expenseBg,
    padding: spacing.md,
    borderRadius: 8,
    fontSize: 13,
    overflow: "hidden",
  },
  switchBtn: { alignItems: "center", marginTop: spacing.xl },
  switchText: { color: colors.textMuted, fontSize: 14 },
  switchBold: { color: colors.primaryLight, fontWeight: "700" },
});
