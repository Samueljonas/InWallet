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
import { extractErrorMessage } from "../utils/format";

export const LoginScreen: React.FC<{ onNavigateToRegister: () => void }> = ({
  onNavigateToRegister,
}) => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!username.trim() || !password) {
      setError("Informe usuário e senha.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await login(username, password);
    } catch (err: any) {
      setError(
        err?.response?.status === 401
          ? "Usuário ou senha incorretos."
          : extractErrorMessage(err, "Não foi possível entrar."),
      );
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
            <Text style={styles.logo}>💳</Text>
            <Text style={styles.title}>InWallet</Text>
            <Text style={styles.subtitle}>
              Suas finanças, simples e organizadas.
            </Text>
          </View>

          <Card>
            {!!error && <Text style={styles.error}>{error}</Text>}

            <Field
              label="Usuário"
              placeholder="seu_usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <Field
              label="Senha"
              placeholder="Sua senha"
              value={password}
              onChangeText={setPassword}
              secure
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />

            <Button
              title="Entrar"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: spacing.xl }}
            />
          </Card>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={onNavigateToRegister}
          >
            <Text style={styles.switchText}>
              Não tem conta? <Text style={styles.switchBold}>Cadastre-se</Text>
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
  logo: { fontSize: 52 },
  title: {
    color: colors.primaryLight,
    fontSize: 32,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
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
