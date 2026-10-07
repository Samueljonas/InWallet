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
import { colors, radius, shadowCard, spacing } from "../theme";
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
          : extractErrorMessage(err, "Não foi possível entrar no servidor."),
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Identidade Visual Clean */}
          <View style={styles.brand}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>💳</Text>
            </View>
            <Text style={styles.title}>InWallet</Text>
            <Text style={styles.subtitle}>
              Gestão financeira pessoal limpa, moderna e inteligente
            </Text>
          </View>

          <Card style={styles.loginCard}>
            <Text style={styles.cardHeader}>Acessar Conta</Text>
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.error}>{error}</Text>
              </View>
            )}

            <Field
              label="Nome de usuário"
              placeholder="Ex: samuel"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <Field
              label="Senha"
              placeholder="Sua senha secreta"
              value={password}
              onChangeText={setPassword}
              secure
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />

            <Button
              title="Entrar no InWallet"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: spacing.xl }}
            />
          </Card>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={onNavigateToRegister}
            activeOpacity={0.7}
          >
            <Text style={styles.switchText}>
              Ainda não tem conta?{" "}
              <Text style={styles.switchBold}>Cadastre-se gratuitamente</Text>
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
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    marginBottom: spacing.sm,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
  loginCard: {
    padding: spacing.xl,
  },
  cardHeader: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  errorBox: {
    backgroundColor: colors.expenseBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.expenseBorder,
    padding: spacing.md,
    marginTop: spacing.sm,
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
