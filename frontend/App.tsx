import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { TransactionsScreen } from "./src/screens/TransactionsScreen";
import { ManageScreen } from "./src/screens/ManageScreen";
import { NewTransactionScreen } from "./src/screens/NewTransactionScreen";
import { Tab, TabBar } from "./src/components/TabBar";
import { colors } from "./src/theme";
import { Transaction } from "./src/types";

function MainNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authRoute, setAuthRoute] = useState<"login" | "register">("login");
  const [tab, setTab] = useState<Tab>("home");
  const [form, setForm] = useState<{ open: boolean; editing?: Transaction }>({
    open: false,
  });
  // Sempre que algo muda (criar/editar/excluir), as telas recarregam.
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
    <View style={styles.app}>
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
      <TabBar current={tab} onChange={setTab} onAdd={() => openForm()} />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <MainNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
});
