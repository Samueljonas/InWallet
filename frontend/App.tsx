import React, { useState } from "react";
import { ActivityIndicator, useWindowDimensions, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import {
  createThemedStyles,
  ThemeProvider,
  useTheme,
} from "./src/contexts/ThemeContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { TransactionsScreen } from "./src/screens/TransactionsScreen";
import { ManageScreen } from "./src/screens/ManageScreen";
import { NewTransactionScreen } from "./src/screens/NewTransactionScreen";
import { Tab, TabBar } from "./src/components/TabBar";
import { Sidebar } from "./src/components/Sidebar";
import { Transaction } from "./src/types";

/** Largura a partir da qual o layout troca TabBar inferior por Sidebar lateral. */
const DESKTOP_BREAKPOINT = 840;

/**
 * Navegação raiz baseada em estado (sem react-navigation).
 * - Não autenticado: alterna entre Login e Cadastro.
 * - Formulário de transação aberto: ocupa a tela inteira.
 * - Caso contrário: abas Início / Extrato / Gerenciar.
 */
function MainNavigator() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const { colors } = useTheme();
  const styles = useStyles();

  const { isAuthenticated, isLoading } = useAuth();
  const [authRoute, setAuthRoute] = useState<"login" | "register">("login");
  const [tab, setTab] = useState<Tab>("home");
  const [form, setForm] = useState<{ open: boolean; editing?: Transaction }>({
    open: false,
  });
  // Contador incrementado a cada criação/edição/exclusão: as telas observam
  // `refreshKey` em seus efeitos e recarregam os dados quando ele muda.
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return authRoute === "register" ? (
      <RegisterScreen onNavigateToLogin={() => setAuthRoute("login")} />
    ) : (
      <LoginScreen onNavigateToRegister={() => setAuthRoute("register")} />
    );
  }

  if (form.open) {
    return (
      <NewTransactionScreen
        editing={form.editing}
        onGoBack={() => setForm({ open: false })}
        onSaved={() => {
          setForm({ open: false });
          bump();
        }}
      />
    );
  }

  const openForm = (editing?: Transaction) => setForm({ open: true, editing });

  return (
    <View style={[styles.app, isDesktop && styles.appDesktop]}>
      {isDesktop && (
        <Sidebar current={tab} onChange={setTab} onAdd={() => openForm()} />
      )}

      <View style={{ flex: 1 }}>
        {tab === "home" && (
          <DashboardScreen
            refreshKey={refreshKey}
            onAdd={() => openForm()}
            onEditTransaction={openForm}
            onSeeAllTransactions={() => setTab("transactions")}
          />
        )}
        {tab === "transactions" && (
          <TransactionsScreen
            refreshKey={refreshKey}
            onEditTransaction={openForm}
            onChanged={bump}
          />
        )}
        {tab === "manage" && (
          <ManageScreen refreshKey={refreshKey} onChanged={bump} />
        )}
      </View>

      {!isDesktop && (
        <TabBar current={tab} onChange={setTab} onAdd={() => openForm()} />
      )}
    </View>
  );
}

/** StatusBar acompanha o tema: ícones claros no escuro e vice-versa. */
function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedStatusBar />
        <MainNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

const useStyles = createThemedStyles(({ colors }) => ({
  app: { flex: 1, backgroundColor: colors.bg },
  appDesktop: { flexDirection: "row" },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
}));
